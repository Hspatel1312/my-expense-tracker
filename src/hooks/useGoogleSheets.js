import { useState, useEffect, useCallback } from 'react';
import { SHEETS_CONFIG } from '../constants/config';
import { formatDateForInput, getTransactionType } from '../utils/helpers';

export const useGoogleSheets = () => {
  const [sheetsConfig, setSheetsConfig] = useState({
    ...SHEETS_CONFIG,
    isConnected: false,
    lastSync: null
  });
  
  const [syncStatus, setSyncStatus] = useState('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);

  // Robust amount parser for Indian Rupee format (₹1,200.00) and plain numbers
  const parseAmount = useCallback((value) => {
    if (!value) return 0;
    
    console.log('🔍 Raw amount value:', value, 'Type:', typeof value);
    
    // Handle different types
    if (typeof value === 'number') {
      console.log('✅ Already a number:', value);
      return value;
    }
    
    // Convert to string and clean
    let cleanValue = value.toString().trim();
    console.log('🔍 String value:', cleanValue);
    
    // Handle Indian Rupee format: ₹1,200.00 or ₹12,00,000
    cleanValue = cleanValue
      .replace(/^₹\s*/i, '') // Remove ₹ prefix
      .replace(/[,\s]/g, '') // Remove commas and spaces
      .replace(/[^\d.-]/g, '') // Keep only digits, dots, and minus
      .trim();
    
    console.log('🔍 Cleaned value:', cleanValue);
    
    if (cleanValue === '' || cleanValue === '-') {
      console.log('⚠️ Empty after cleaning');
      return 0;
    }
    
    const parsed = parseFloat(cleanValue);
    console.log('🔍 Parsed result:', parsed, 'isNaN:', isNaN(parsed));
    
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  // Store the token in localStorage
  const storeToken = useCallback((token) => {
    try {
      localStorage.setItem('google_auth_token', JSON.stringify({
        access_token: token.access_token,
        expires_at: Date.now() + (3600 * 1000), // 1 hour from now
        stored_at: Date.now()
      }));
      console.log('✅ Token stored successfully');
    } catch (error) {
      console.warn('⚠️ Could not store token:', error);
    }
  }, []);

  // Retrieve and validate stored token
  const getStoredToken = useCallback(() => {
    try {
      const stored = localStorage.getItem('google_auth_token');
      if (stored) {
        const tokenData = JSON.parse(stored);
        
        // Check if token is still valid (not expired)
        if (Date.now() < tokenData.expires_at) {
          console.log('✅ Found valid stored token');
          return tokenData;
        } else {
          console.log('⚠️ Stored token expired');
          localStorage.removeItem('google_auth_token');
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not retrieve token:', error);
      localStorage.removeItem('google_auth_token');
    }
    return null;
  }, []);

  // Load modern Google Identity Services
  const loadGoogleIdentityServices = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.accounts) {
        resolve(window.google);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('✅ Google Identity Services loaded');
        setGisLoaded(true);
        resolve(window.google);
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'));
      };

      document.head.appendChild(script);
    });
  }, []);

  // Load Google API Client
  const loadGoogleAPI = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.gapi && window.gapi.client) {
        resolve(window.gapi);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        window.gapi.load('client', {
          callback: () => {
            console.log('✅ Google API client loaded');
            setGapiLoaded(true);
            resolve(window.gapi);
          },
          onerror: () => {
            reject(new Error('Failed to load Google API client'));
          }
        });
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google API script'));
      };

      document.head.appendChild(script);
    });
  }, []);

  // Initialize Google API (OAuth-only)
  const initializeGoogleAPI = useCallback(async () => {
    try {
      console.log('🔧 Initializing Google API...');
      
      const gapi = await loadGoogleAPI();
      
      await gapi.client.init({
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
      });

      console.log('✅ Google API client initialized');
      return gapi;
    } catch (error) {
      console.error('❌ Failed to initialize Google API:', error);
      throw error;
    }
  }, [loadGoogleAPI]);

  // Load categories from Google Sheets
  const loadCategories = useCallback(async () => {
    try {
      console.log('📋 Loading categories from Google Sheets...');
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: 'Data!A:C' // Categories are in columns A, B, C
      });

      const rows = response.result.values || [];
      const categories = [];
      
      console.log('🔍 Raw category data rows:', rows.length);
      
      // Skip header row and process data
      const dataRows = rows.slice(1); // Skip the header row
      
      dataRows.forEach((row, index) => {
        if (row && row.length >= 3 && row[0] && row[1] && row[2]) {
          const category = {
            main: row[0].toString().trim(),
            sub: row[1].toString().trim(),
            combined: row[2].toString().trim()
          };
          
          // Only add if all fields are populated and not empty
          if (category.main && category.sub && category.combined) {
            categories.push(category);
            console.log(`📂 Category ${index + 1}: ${category.main} > ${category.sub}`);
          }
        }
      });
      
      console.log('✅ Categories loaded successfully:', categories.length, 'categories');
      return categories;
    } catch (error) {
      console.error('❌ Failed to load categories:', error);
      // Return empty array on failure, the app should handle this gracefully
      return [];
    }
  }, []);

  // Enhanced check for existing authentication
  const checkExistingAuth = useCallback(async () => {
    try {
      if (!gapiLoaded || !gisLoaded) return false;
      
      console.log('🔍 Checking for existing authentication...');
      
      // First check localStorage
      const storedToken = getStoredToken();
      if (!storedToken) {
        console.log('ℹ️ No stored authentication found');
        return false;
      }
      
      // Set the stored token
      window.gapi.client.setToken({
        access_token: storedToken.access_token
      });
      
      try {
        // Test the connection with stored token
        const testResponse = await window.gapi.client.sheets.spreadsheets.get({
          spreadsheetId: SHEETS_CONFIG.spreadsheetId
        });
        
        console.log('✅ Stored token is valid!');
        
        // Update connection state
        setSheetsConfig(prev => ({
          ...prev,
          isConnected: true,
          lastSync: new Date().toISOString()
        }));
        
        // Load all data immediately
        const [balanceData, transactionData, categoriesData] = await Promise.all([
          window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_CONFIG.spreadsheetId,
            range: 'Data!E:G' // Full columns for accounts
          }),
          window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_CONFIG.spreadsheetId,
            range: SHEETS_CONFIG.TRANSACTIONS_RANGE
          }),
          loadCategories() // Load categories from sheets
        ]);
        
        // Process account balance data - scan all rows
        const balanceRows = balanceData.result.values || [];
        const newBalances = {};
        const accountsList = [];
        
        console.log('🔍 Auth check - Scanning', balanceRows.length, 'rows for accounts...');
        
        // Scan all rows for account names in column E
        balanceRows.forEach((row, index) => {
          if (row && row[0]) { // Column E has a value
            const accountName = row[0].toString().trim();
            
            // Skip header rows and empty values
            if (accountName && 
                accountName !== 'Accounts' && 
                accountName !== 'Account' &&
                accountName !== '' &&
                !accountName.toLowerCase().includes('balance')) {
              
              // Get ending balance from column G (index 2), default to 0 if empty
              let endingBalance = 0;
              if (row[2]) {
                endingBalance = parseAmount(row[2]);
              }
              
              console.log(`🔍 Auth check - Found account: "${accountName}" with balance: ${endingBalance}`);
              
              newBalances[accountName] = endingBalance;
              accountsList.push(accountName);
            }
          }
        });
        
        const transactionRows = transactionData.result.values || [];
        const dataRows = transactionRows.slice(1);
        
        const transactions = dataRows
          .filter(row => row && row.length > 3 && row[0] && row[1] && row[2] && row[3])
          .map((row, index) => {
            const amount = parseAmount(row[1]);
            
            // Better transaction type detection
            let transactionType = row[8] || ''; // Column I (Type)
            if (!transactionType) {
              transactionType = getTransactionType(row[2] || ''); // Fallback to category-based detection
            }
            
            console.log(`🔍 Transaction ${index + 1}:`, {
              rawAmount: row[1],
              parsedAmount: amount,
              description: row[3],
              category: row[2],
              detectedType: transactionType,
              rawType: row[8]
            });
            
            return {
              id: `sheet_${index}_${Date.now()}_${Math.random()}`,
              date: formatDateForInput(row[0]),
              amount: amount,
              category: row[2] || '',
              description: row[3] || '',
              tag: row[4] || '',
              account: row[5] || '',
              type: transactionType,
              synced: true,
              source: 'sheets',
              sheetRow: index + 2
            };
          });
        
        console.log('📊 Auto-loaded data:', {
          balances: newBalances,
          accounts: accountsList,
          transactions: transactions.length,
          categories: categoriesData.length,
          sampleTransaction: transactions[0]
        });
        
        return {
          balances: newBalances,
          accounts: accountsList,
          transactions: transactions,
          categories: categoriesData // Include categories in return data
        };
        
      } catch (error) {
        console.log('❌ Stored token is invalid:', error);
        // Clear invalid token
        window.gapi.client.setToken(null);
        localStorage.removeItem('google_auth_token');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error checking existing auth:', error);
      localStorage.removeItem('google_auth_token');
      return false;
    }
  }, [gapiLoaded, gisLoaded, getStoredToken, parseAmount, loadCategories]);

  // Authenticate and immediately test with the EXACT method that worked
  const authenticateAndTest = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔐 Starting authentication with immediate test...');
        
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: SHEETS_CONFIG.clientId,
          scope: 'https://www.googleapis.com/auth/spreadsheets',
          callback: async (response) => {
            if (response.error) {
              console.error('❌ OAuth error:', response);
              reject(new Error(`OAuth error: ${response.error}`));
              return;
            }
            
            console.log('✅ OAuth token received');
            
            // Set the access token
            window.gapi.client.setToken({
              access_token: response.access_token
            });
            
            // Store the token for persistence
            storeToken({ access_token: response.access_token });
            
            console.log('🔑 Access token set and stored');
            
            // Use the EXACT method that worked in manual test
            console.log('⏰ Waiting 3 seconds then testing...');
            setTimeout(async () => {
              try {
                console.log('🔍 Testing with exact manual method...');
                
                // Test 1: The exact call that worked manually
                const testResponse = await window.gapi.client.sheets.spreadsheets.get({
                  spreadsheetId: SHEETS_CONFIG.spreadsheetId
                });
                
                console.log('✅ SUCCESS with manual method!');
                console.log('📊 Connected to:', testResponse.result.properties.title);
                
                // Test the data ranges that worked manually
                console.log('🔍 Testing Transactions range...');
                const transactionsTest = await window.gapi.client.sheets.spreadsheets.values.get({
                  spreadsheetId: SHEETS_CONFIG.spreadsheetId,
                  range: SHEETS_CONFIG.TRANSACTIONS_RANGE
                });
                
                console.log('✅ Transactions test:', transactionsTest.result.values?.length - 1, 'transactions');
                
                console.log('🔍 Testing Accounts range...');
                const accountsTest = await window.gapi.client.sheets.spreadsheets.values.get({
                  spreadsheetId: SHEETS_CONFIG.spreadsheetId,
                  range: 'Data!E:G'
                });
                
                console.log('✅ Accounts test:', accountsTest.result.values?.length - 1, 'accounts');
                
                // Test categories range
                console.log('🔍 Testing Categories range...');
                const categoriesTest = await window.gapi.client.sheets.spreadsheets.values.get({
                  spreadsheetId: SHEETS_CONFIG.spreadsheetId,
                  range: 'Data!A:C'
                });
                
                console.log('✅ Categories test:', categoriesTest.result.values?.length - 1, 'categories');
                
                // All tests passed - resolve with success
                console.log('🎉 All tests passed! Loading initial data...');
                
                // Immediately load the actual data while token is fresh
                try {
                  const [balanceData, transactionData, categoriesData] = await Promise.all([
                    window.gapi.client.sheets.spreadsheets.values.get({
                      spreadsheetId: SHEETS_CONFIG.spreadsheetId,
                      range: 'Data!E:G' // Full columns for accounts
                    }),
                    window.gapi.client.sheets.spreadsheets.values.get({
                      spreadsheetId: SHEETS_CONFIG.spreadsheetId,
                      range: SHEETS_CONFIG.TRANSACTIONS_RANGE
                    }),
                    loadCategories() // Load categories
                  ]);
                  
                  console.log('✅ Initial data loaded successfully!');
                  console.log('💰 Balance data rows:', balanceData.result.values?.length);
                  console.log('📊 Transaction data rows:', transactionData.result.values?.length);
                  console.log('📂 Categories loaded:', categoriesData.length);
                  
                  resolve({
                    spreadsheet: testResponse.result,
                    transactionCount: transactionsTest.result.values?.length - 1 || 0,
                    accountCount: accountsTest.result.values?.length - 1 || 0,
                    categoryCount: categoriesData.length,
                    balanceData: balanceData.result,
                    transactionData: transactionData.result,
                    categoriesData: categoriesData
                  });
                  
                } catch (dataError) {
                  console.warn('⚠️ Initial data loading failed, but connection succeeded:', dataError);
                  // Still resolve with success since connection worked
                  resolve({
                    spreadsheet: testResponse.result,
                    transactionCount: transactionsTest.result.values?.length - 1 || 0,
                    accountCount: accountsTest.result.values?.length - 1 || 0,
                    categoryCount: categoriesTest.result.values?.length - 1 || 0
                  });
                }
                
              } catch (testError) {
                console.error('❌ Manual method test failed:', testError);
                reject(testError);
              }
            }, 3000);
          },
          error_callback: (error) => {
            console.error('❌ OAuth error callback:', error);
            reject(new Error(`OAuth error: ${error}`));
          }
        });
        
        // Request access token
        client.requestAccessToken();
        
      } catch (error) {
        console.error('❌ Authentication setup failed:', error);
        reject(error);
      }
    });
  }, [storeToken, loadCategories]);

  // Simplified connection function using the working method
  const connectToGoogleSheets = useCallback(async () => {
    console.log('🚀 Starting connection with proven method...');
    setSyncStatus('syncing');
    setIsLoading(true);

    try {
      // Step 1: Load APIs
      await Promise.all([
        loadGoogleAPI(),
        loadGoogleIdentityServices()
      ]);
      
      // Step 2: Initialize API
      await initializeGoogleAPI();
      
      // Step 3: Authenticate and test using the exact method that worked
      const connectionResult = await authenticateAndTest();
      
      // Step 4: Process and return the loaded data
      let returnData = { balances: {}, accounts: [], transactions: [], categories: [] };
      
      if (connectionResult.balanceData && connectionResult.transactionData && connectionResult.categoriesData) {
        console.log('🎯 Processing data loaded during connection...');
        
        // Process balance data with full column scan
        const balanceRows = connectionResult.balanceData.values || [];
        const newBalances = {};
        const accountsList = [];
        
        console.log('🔍 Scanning', balanceRows.length, 'rows for accounts in connection...');
        
        // Scan all rows for account names in column E
        balanceRows.forEach((row, index) => {
          if (row && row[0]) { // Column E has a value
            const accountName = row[0].toString().trim();
            
            // Skip header rows and empty values
            if (accountName && 
                accountName !== 'Accounts' && 
                accountName !== 'Account' &&
                accountName !== '' &&
                !accountName.toLowerCase().includes('balance')) {
              
              // Get ending balance from column G (index 2), default to 0 if empty
              let endingBalance = 0;
              if (row[2]) {
                endingBalance = parseAmount(row[2]);
              }
              
              console.log(`🔍 Connection - Found account: "${accountName}" with balance: ${endingBalance}`);
              
              newBalances[accountName] = endingBalance;
              accountsList.push(accountName);
            }
          }
        });
        
        // Process transaction data with improved amount parsing
        const transactionRows = connectionResult.transactionData.values || [];
        const dataRows = transactionRows.slice(1);
        
        const transactions = dataRows
          .filter(row => row && row.length > 3 && row[0] && row[1] && row[2] && row[3])
          .map((row, index) => {
            const amount = parseAmount(row[1]);
            
            console.log(`🔍 Processing transaction ${index + 1}:`, {
              rawAmount: row[1],
              parsedAmount: amount,
              description: row[3]
            });

            return {
              id: `sheet_${index}_${Date.now()}_${Math.random()}`,
              date: formatDateForInput(row[0]),
              amount: amount,
              category: row[2] || '',
              description: row[3] || '',
              tag: row[4] || '',
              account: row[5] || '',
              type: row[8] || getTransactionType(row[2] || ''),
              synced: true,
              source: 'sheets',
              sheetRow: index + 2
            };
          });
        
        returnData = {
          balances: newBalances,
          accounts: accountsList,
          transactions: transactions,
          categories: connectionResult.categoriesData // Include loaded categories
        };
        
        console.log('💰 Processed balances:', newBalances);
        console.log('📊 Processed transactions:', transactions.length);
        console.log('📂 Processed categories:', connectionResult.categoriesData.length);
        console.log('🔍 Sample transaction with amount:', transactions.find(t => t.amount > 0));
      }
      
      // Step 5: Update connection state
      console.log('✅ Connection successful! Updating state...');
      setSheetsConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSync: new Date().toISOString()
      }));
      
      setSyncStatus('success');
      console.log('🎉 Connection completed, returning data!');
      
      return returnData; // Return the processed data
      
    } catch (error) {
      console.error('❌ Connection failed:', error);
      setSyncStatus('error');
      setSheetsConfig(prev => ({ ...prev, isConnected: false }));
      localStorage.removeItem('google_auth_token');
      throw error;
    } finally {
      setIsLoading(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [loadGoogleAPI, loadGoogleIdentityServices, initializeGoogleAPI, authenticateAndTest, parseAmount]);

  // Load account balances - scan full E:G columns
  const loadAccountBalances = useCallback(async () => {
    try {
      // Check if we have a valid token
      const currentToken = window.gapi.client.getToken();
      if (!currentToken || !currentToken.access_token) {
        console.log('🔄 No valid token for accounts, reconnecting...');
        await connectToGoogleSheets();
      }

      console.log('💰 Loading account balances from full E:G range...');
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: 'Data!E:G' // Full columns
      });

      const rows = response.result.values || [];
      const newBalances = {};
      const accountsList = [];

      console.log('🔍 Scanning', rows.length, 'rows for accounts...');

      // Scan all rows for account names in column E
      rows.forEach((row, index) => {
        if (row && row[0]) { // Column E has a value
          const accountName = row[0].toString().trim();
          
          // Skip header rows and empty values
          if (accountName && 
              accountName !== 'Accounts' && 
              accountName !== 'Account' &&
              accountName !== '' &&
              !accountName.toLowerCase().includes('balance')) {
            
            // Get ending balance from column G (index 2), default to 0 if empty
            let endingBalance = 0;
            if (row[2]) {
              endingBalance = parseAmount(row[2]);
            }
            
            console.log(`🔍 Found account: "${accountName}" with balance: ${endingBalance}`);
            
            newBalances[accountName] = endingBalance;
            accountsList.push(accountName);
          }
        }
      });

      console.log('✅ Account balances loaded successfully:', newBalances);
      return { balances: newBalances, accounts: accountsList };
    } catch (error) {
      console.error('❌ Failed to load account balances:', error);
      return { balances: {}, accounts: [] };
    }
  }, [connectToGoogleSheets, parseAmount]);

  // Load transactions (ensure token is valid)
  const loadTransactions = useCallback(async () => {
    try {
      // Check if we have a valid token
      const currentToken = window.gapi.client.getToken();
      if (!currentToken || !currentToken.access_token) {
        console.log('🔄 No valid token for transactions, reconnecting...');
        await connectToGoogleSheets();
      }

      console.log('📋 Loading transactions...');
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: SHEETS_CONFIG.TRANSACTIONS_RANGE
      });

      const rows = response.result.values || [];
      const dataRows = rows.slice(1);
      
      const transactions = dataRows
        .filter(row => row && row.length > 3 && row[0] && row[1] && row[2] && row[3])
        .map((row, index) => {
          const amount = parseAmount(row[1]);

          return {
            id: `sheet_${index}_${Date.now()}_${Math.random()}`,
            date: formatDateForInput(row[0]),
            amount: amount,
            category: row[2] || '',
            description: row[3] || '',
            tag: row[4] || '',
            account: row[5] || '',
            type: row[8] || getTransactionType(row[2] || ''),
            synced: true,
            source: 'sheets',
            sheetRow: index + 2
          };
        });

      console.log('✅ Transactions loaded successfully:', transactions.length, 'transactions');
      return transactions;
    } catch (error) {
      console.error('❌ Failed to load transactions:', error);
      return [];
    }
  }, [connectToGoogleSheets, parseAmount]);

  // Add or update transaction to sheets
  const addTransactionToSheets = useCallback(async (transaction) => {
    try {
      if (!sheetsConfig.isConnected) {
        await connectToGoogleSheets();
      }

      // Only update columns A-F (skip G, H, and I which have formulas)
      const transactionData = [
        transaction.date,        // A
        transaction.amount,      // B
        transaction.category,    // C
        transaction.description, // D
        transaction.tag,         // E
        transaction.account      // F
        // Skip G, H, and I (all have formulas)
      ];

      // Check if this is an edit (has sheetRow) or new transaction
      if (transaction.sheetRow && transaction.sheetRow > 1) {
        console.log('📝 Updating existing transaction at row:', transaction.sheetRow);
        
        // Update existing row - only columns A-F
        await window.gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: SHEETS_CONFIG.spreadsheetId,
          range: `Transactions!A${transaction.sheetRow}:F${transaction.sheetRow}`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [transactionData] // A-F only
          }
        });
        
        console.log('✅ Transaction updated successfully at row:', transaction.sheetRow, '(preserved formulas in G, H, I)');
      } else {
        console.log('➕ Adding new transaction to sheets');
        
        // Add new transaction - only to columns A-F
        const readResponse = await window.gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: SHEETS_CONFIG.spreadsheetId,
          range: SHEETS_CONFIG.TRANSACTIONS_RANGE
        });
        
        const lastRow = (readResponse.result.values?.length || 1) + 1;
        
        await window.gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: SHEETS_CONFIG.spreadsheetId,
          range: `Transactions!A${lastRow}:F${lastRow}`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [transactionData] // A-F only
          }
        });
        
        console.log('✅ New transaction added at row:', lastRow, '(skipped G, H, I - letting formulas handle them)');
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to add/update transaction:', error);
      return false;
    }
  }, [sheetsConfig.isConnected, connectToGoogleSheets]);

  // Delete transaction from sheets
  const deleteTransactionFromSheets = useCallback(async (transaction) => {
    try {
      console.log('🗑️ deleteTransactionFromSheets called with:', {
        id: transaction.id,
        sheetRow: transaction.sheetRow,
        description: transaction.description,
        isConnected: sheetsConfig.isConnected
      });

      if (!sheetsConfig.isConnected) {
        console.log('⚠️ Not connected to sheets, skipping deletion');
        return true; // Allow local deletion even if not connected
      }

      if (!transaction.sheetRow || transaction.sheetRow <= 1) {
        console.log('⚠️ Invalid sheet row info:', transaction.sheetRow, '- skipping sheets deletion');
        return true; // Allow local deletion
      }

      console.log('🔍 Getting spreadsheet info to find sheet ID...');

      // First, get the sheet ID for the Transactions sheet
      const spreadsheetInfo = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId
      });
      
      console.log('📋 Available sheets:', spreadsheetInfo.result.sheets.map(s => ({
        title: s.properties.title,
        sheetId: s.properties.sheetId
      })));
      
      // Find the Transactions sheet ID
      const transactionsSheet = spreadsheetInfo.result.sheets.find(sheet => 
        sheet.properties.title === 'Transactions'
      );
      
      if (!transactionsSheet) {
        console.error('❌ Could not find "Transactions" sheet');
        // Try with sheet ID 0 as fallback
        console.log('🔄 Trying with sheet ID 0 as fallback...');
      }
      
      const sheetId = transactionsSheet ? transactionsSheet.properties.sheetId : 0;
      console.log('📋 Using sheet ID:', sheetId, 'for row deletion');

      console.log('🗑️ Attempting to delete row', transaction.sheetRow, 'from sheet ID', sheetId);

      // Try Method 1: Delete the row using batchUpdate
      try {
        const deleteResponse = await window.gapi.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId: SHEETS_CONFIG.spreadsheetId,
          resource: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: sheetId,
                  dimension: 'ROWS',
                  startIndex: transaction.sheetRow - 1, // 0-indexed
                  endIndex: transaction.sheetRow
                }
              }
            }]
          }
        });

        console.log('✅ Row deletion successful:', deleteResponse);
        return true;

      } catch (deleteError) {
        console.error('❌ Row deletion failed, trying alternative method:', deleteError);
        
        // Method 2: Clear the row content instead of deleting
        console.log('🔄 Trying to clear row content instead...');
        try {
          const clearResponse = await window.gapi.client.sheets.spreadsheets.values.clear({
            spreadsheetId: SHEETS_CONFIG.spreadsheetId,
            range: `Transactions!A${transaction.sheetRow}:I${transaction.sheetRow}`
          });
          
          console.log('✅ Row content cleared successfully:', clearResponse);
          return true;
        } catch (clearError) {
          console.error('❌ Both deletion methods failed:', clearError);
          return false;
        }
      }

    } catch (error) {
      console.error('❌ Failed to delete transaction from sheets:', error);
      console.error('Error details:', {
        message: error.message,
        result: error.result,
        status: error.status
      });
      return false;
    }
  }, [sheetsConfig.isConnected]);

  // Manual sync - now includes categories
  const manualSync = useCallback(async () => {
    if (!sheetsConfig.isConnected) {
      await connectToGoogleSheets();
    }
    
    setSyncStatus('syncing');
    try {
      const [balanceData, transactionData, categoriesData] = await Promise.all([
        loadAccountBalances(),
        loadTransactions(),
        loadCategories() // Load categories during sync
      ]);
      
      setSheetsConfig(prev => ({
        ...prev,
        lastSync: new Date().toISOString()
      }));
      
      setSyncStatus('success');
      return { 
        ...balanceData, 
        transactions: transactionData, 
        categories: categoriesData // Include categories in sync result
      };
    } catch (error) {
      setSyncStatus('error');
      throw error;
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [sheetsConfig.isConnected, connectToGoogleSheets, loadAccountBalances, loadTransactions, loadCategories]);

  // Initialize APIs and check for existing auth on mount
  useEffect(() => {
    const initializeAndCheck = async () => {
      try {
        await Promise.all([
          loadGoogleAPI(),
          loadGoogleIdentityServices()
        ]);
        
        await initializeGoogleAPI();
        
        // Check for stored token first
        const storedToken = getStoredToken();
        if (storedToken) {
          console.log('🔍 Setting stored token...');
          window.gapi.client.setToken({
            access_token: storedToken.access_token
          });
          
          // Test if it still works
          try {
            await window.gapi.client.sheets.spreadsheets.get({
              spreadsheetId: SHEETS_CONFIG.spreadsheetId
            });
            
            console.log('✅ Stored token is still valid!');
            setSheetsConfig(prev => ({ ...prev, isConnected: true }));
            
            // Load data automatically
            const existingData = await checkExistingAuth();
            if (existingData) {
              window.expenseTrackerData = existingData;
            }
            
          } catch (error) {
            console.log('❌ Stored token invalid, will need to re-authenticate');
            localStorage.removeItem('google_auth_token');
          }
        }
        
      } catch (error) {
        console.error('❌ Initialization failed:', error);
      }
    };
    
    initializeAndCheck();
  }, [loadGoogleAPI, loadGoogleIdentityServices, initializeGoogleAPI, getStoredToken, checkExistingAuth]);

  return {
    sheetsConfig,
    syncStatus,
    isLoading,
    gapiLoaded: gapiLoaded && gisLoaded,
    connectToGoogleSheets,
    manualSync,
    addTransactionToSheets,
    deleteTransactionFromSheets, // Export delete function
    loadAccountBalances,
    loadTransactions,
    loadCategories // Export loadCategories for standalone use
  };
};
