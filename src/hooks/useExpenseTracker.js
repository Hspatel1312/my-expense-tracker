import { useState, useEffect, useCallback } from 'react';
import { SHEETS_CONFIG } from '../constants/config';
import { parseGoogleSheetsDate, getTransactionType } from '../utils/helpers';
import { processCategoriesFromSheets } from '../constants/categories';

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

  // Robust amount parser for Indian Rupee format
  const parseAmount = useCallback((value) => {
    if (!value) return 0;
    
    if (typeof value === 'number') {
      return value;
    }
    
    let cleanValue = value.toString().trim()
      .replace(/^₹\s*/i, '')
      .replace(/[,\s]/g, '')
      .replace(/[^\d.-]/g, '')
      .trim();
    
    if (cleanValue === '' || cleanValue === '-') {
      return 0;
    }
    
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  // Store the token in localStorage
  const storeToken = useCallback((token) => {
    try {
      localStorage.setItem('google_auth_token', JSON.stringify({
        access_token: token.access_token,
        expires_at: Date.now() + (3600 * 1000),
        stored_at: Date.now()
      }));
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
        if (Date.now() < tokenData.expires_at) {
          return tokenData;
        } else {
          localStorage.removeItem('google_auth_token');
        }
      }
    } catch (error) {
      localStorage.removeItem('google_auth_token');
    }
    return null;
  }, []);

  // Load Google Identity Services
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

  // Initialize Google API
  const initializeGoogleAPI = useCallback(async () => {
    try {
      const gapi = await loadGoogleAPI();
      
      await gapi.client.init({
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
      });

      return gapi;
    } catch (error) {
      console.error('❌ Failed to initialize Google API:', error);
      throw error;
    }
  }, [loadGoogleAPI]);

  // 🔥 FIXED: Load categories from Google Sheets Data!A2:C (all three columns)
  const loadCategoriesFromSheets = useCallback(async () => {
    try {
      console.log('📋 Loading categories from Google Sheets Data!A2:C...');
      
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: 'Data!A2:C' // 🔥 Load all three columns: Main, Sub, Combined
      });

      const rows = response.result.values || [];
      console.log('📋 Raw category data from sheets:', rows.length, 'rows');
      console.log('📋 Sample rows:', rows.slice(0, 5));
      
      // Process the categories using the helper function
      const processedCategories = processCategoriesFromSheets(rows);
      
      console.log('✅ Categories processed:', processedCategories.length);
      console.log('📋 Sample processed categories:', processedCategories.slice(0, 5));
      
      return processedCategories;
    } catch (error) {
      console.error('❌ Failed to load categories from sheets:', error);
      // Return fallback categories
      const { masterCategories } = await import('../constants/categories');
      return masterCategories;
    }
  }, []);

  // Enhanced transaction type detection based on category
  const getTransactionTypeFromCategory = useCallback((category) => {
    if (!category) return 'Expense';
    
    const categoryLower = category.toLowerCase();
    
    // Check if category contains income-related keywords
    if (categoryLower.includes('income') || 
        categoryLower.includes('salary') || 
        categoryLower.includes('reload') ||
        categoryLower.includes('refund') ||
        categoryLower.includes('bonus') ||
        categoryLower.includes('dividend')) {
      return 'Income';
    }
    
    // Check for transfer keywords
    if (categoryLower.includes('transfer') || 
        categoryLower.includes('withdrawal') ||
        categoryLower.includes('deposit')) {
      return 'Transfer';
    }
    
    // Default to Expense for all other categories
    return 'Expense';
  }, []);

  // Process transaction data with timezone-safe date parsing
  const processTransactionData = useCallback((transactionData) => {
    const transactionRows = transactionData.values || [];
    const dataRows = transactionRows.slice(1);
    
    const transactions = dataRows
      .filter(row => row && row.length > 3 && row[0] && row[1] && row[2] && row[3])
      .map((row, index) => {
        const amount = parseAmount(row[1]);
        const parsedDate = parseGoogleSheetsDate(row[0]);
        
        // Use calculated type from column I, or determine from category
        let transactionType = row[8] || ''; // Column I (calculated)
        if (!transactionType) {
          transactionType = getTransactionTypeFromCategory(row[2] || '');
        }
        
        return {
          id: `sheet_${index}_${Date.now()}_${Math.random()}`,
          date: parsedDate,
          amount: amount,
          category: row[2] || '',
          description: row[3] || '',
          tag: row[4] || '',
          account: row[5] || '',
          type: transactionType,
          synced: true,
          source: 'sheets',
          sheetRow: index + 2 // Row number in sheet (accounting for header)
        };
      });
    
    return transactions;
  }, [parseAmount, getTransactionTypeFromCategory]);

  // Enhanced check for existing authentication
  const checkExistingAuth = useCallback(async () => {
    try {
      if (!gapiLoaded || !gisLoaded) return false;
      
      const storedToken = getStoredToken();
      if (!storedToken) {
        return false;
      }
      
      window.gapi.client.setToken({
        access_token: storedToken.access_token
      });
      
      try {
        const testResponse = await window.gapi.client.sheets.spreadsheets.get({
          spreadsheetId: SHEETS_CONFIG.spreadsheetId
        });
        
        setSheetsConfig(prev => ({
          ...prev,
          isConnected: true,
          lastSync: new Date().toISOString()
        }));
        
        // Load all data including categories
        const [balanceData, transactionData, categories] = await Promise.all([
          window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_CONFIG.spreadsheetId,
            range: 'Data!E:G'
          }),
          window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_CONFIG.spreadsheetId,
            range: SHEETS_CONFIG.TRANSACTIONS_RANGE
          }),
          loadCategoriesFromSheets() // 🔥 Load categories from sheets
        ]);
        
        // Process account balance data
        const balanceRows = balanceData.result.values || [];
        const newBalances = {};
        const accountsList = [];
        
        balanceRows.forEach((row, index) => {
          if (row && row[0]) {
            const accountName = row[0].toString().trim();
            
            if (accountName && 
                accountName !== 'Accounts' && 
                accountName !== 'Account' &&
                accountName !== '' &&
                !accountName.toLowerCase().includes('balance')) {
              
              let endingBalance = 0;
              if (row[2]) {
                endingBalance = parseAmount(row[2]);
              }
              
              newBalances[accountName] = endingBalance;
              accountsList.push(accountName);
            }
          }
        });
        
        const transactions = processTransactionData(transactionData.result);
        
        return {
          balances: newBalances,
          accounts: accountsList,
          transactions: transactions,
          categories: categories // 🔥 Include processed categories
        };
        
      } catch (error) {
        window.gapi.client.setToken(null);
        localStorage.removeItem('google_auth_token');
        return false;
      }
      
    } catch (error) {
      localStorage.removeItem('google_auth_token');
      return false;
    }
  }, [gapiLoaded, gisLoaded, getStoredToken, parseAmount, processTransactionData, loadCategoriesFromSheets]);

  // Authenticate and test
  const authenticateAndTest = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: SHEETS_CONFIG.clientId,
          scope: 'https://www.googleapis.com/auth/spreadsheets',
          callback: async (response) => {
            if (response.error) {
              reject(new Error(`OAuth error: ${response.error}`));
              return;
            }
            
            window.gapi.client.setToken({
              access_token: response.access_token
            });
            
            storeToken({ access_token: response.access_token });
            
            setTimeout(async () => {
              try {
                const testResponse = await window.gapi.client.sheets.spreadsheets.get({
                  spreadsheetId: SHEETS_CONFIG.spreadsheetId
                });
                
                const [balanceData, transactionData, categories] = await Promise.all([
                  window.gapi.client.sheets.spreadsheets.values.get({
                    spreadsheetId: SHEETS_CONFIG.spreadsheetId,
                    range: 'Data!E:G'
                  }),
                  window.gapi.client.sheets.spreadsheets.values.get({
                    spreadsheetId: SHEETS_CONFIG.spreadsheetId,
                    range: SHEETS_CONFIG.TRANSACTIONS_RANGE
                  }),
                  loadCategoriesFromSheets() // 🔥 Load categories
                ]);
                
                resolve({
                  spreadsheet: testResponse.result,
                  balanceData: balanceData.result,
                  transactionData: transactionData.result,
                  categories: categories // 🔥 Include categories
                });
                
              } catch (testError) {
                reject(testError);
              }
            }, 3000);
          },
          error_callback: (error) => {
            reject(new Error(`OAuth error: ${error}`));
          }
        });
        
        client.requestAccessToken();
        
      } catch (error) {
        reject(error);
      }
    });
  }, [storeToken, loadCategoriesFromSheets]);

  // Connect to Google Sheets
  const connectToGoogleSheets = useCallback(async () => {
    setSyncStatus('syncing');
    setIsLoading(true);

    try {
      await Promise.all([
        loadGoogleAPI(),
        loadGoogleIdentityServices()
      ]);
      
      await initializeGoogleAPI();
      const connectionResult = await authenticateAndTest();
      
      let returnData = { balances: {}, accounts: [], transactions: [], categories: [] };
      
      if (connectionResult.balanceData && connectionResult.transactionData) {
        // Process balance data
        const balanceRows = connectionResult.balanceData.values || [];
        const newBalances = {};
        const accountsList = [];
        
        balanceRows.forEach((row, index) => {
          if (row && row[0]) {
            const accountName = row[0].toString().trim();
            
            if (accountName && 
                accountName !== 'Accounts' && 
                accountName !== 'Account' &&
                accountName !== '' &&
                !accountName.toLowerCase().includes('balance')) {
              
              let endingBalance = 0;
              if (row[2]) {
                endingBalance = parseAmount(row[2]);
              }
              
              newBalances[accountName] = endingBalance;
              accountsList.push(accountName);
            }
          }
        });
        
        const transactions = processTransactionData(connectionResult.transactionData);
        
        returnData = {
          balances: newBalances,
          accounts: accountsList,
          transactions: transactions,
          categories: connectionResult.categories || [] // 🔥 Include categories
        };
      }
      
      setSheetsConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSync: new Date().toISOString()
      }));
      
      setSyncStatus('success');
      return returnData;
      
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
  }, [loadGoogleAPI, loadGoogleIdentityServices, initializeGoogleAPI, authenticateAndTest, parseAmount, processTransactionData]);

  // Load account balances
  const loadAccountBalances = useCallback(async () => {
    try {
      const currentToken = window.gapi.client.getToken();
      if (!currentToken || !currentToken.access_token) {
        await connectToGoogleSheets();
      }

      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: 'Data!E:G'
      });

      const rows = response.result.values || [];
      const newBalances = {};
      const accountsList = [];

      rows.forEach((row, index) => {
        if (row && row[0]) {
          const accountName = row[0].toString().trim();
          
          if (accountName && 
              accountName !== 'Accounts' && 
              accountName !== 'Account' &&
              accountName !== '' &&
              !accountName.toLowerCase().includes('balance')) {
            
            let endingBalance = 0;
            if (row[2]) {
              endingBalance = parseAmount(row[2]);
            }
            
            newBalances[accountName] = endingBalance;
            accountsList.push(accountName);
          }
        }
      });

      return { balances: newBalances, accounts: accountsList };
    } catch (error) {
      console.error('❌ Failed to load account balances:', error);
      return { balances: {}, accounts: [] };
    }
  }, [connectToGoogleSheets, parseAmount]);

  // Load transactions
  const loadTransactions = useCallback(async () => {
    try {
      const currentToken = window.gapi.client.getToken();
      if (!currentToken || !currentToken.access_token) {
        await connectToGoogleSheets();
      }

      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: SHEETS_CONFIG.TRANSACTIONS_RANGE
      });

      const transactions = processTransactionData(response.result);
      return transactions;
    } catch (error) {
      console.error('❌ Failed to load transactions:', error);
      return [];
    }
  }, [connectToGoogleSheets, processTransactionData]);

  // Add transaction to sheets (only A-F columns)
  const addTransactionToSheets = useCallback(async (transaction) => {
    try {
      if (!sheetsConfig.isConnected) {
        console.log('📝 Not connected to sheets, skipping add operation');
        return false;
      }

      console.log('📝 Adding transaction to sheets:', transaction);

      const readResponse = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: SHEETS_CONFIG.TRANSACTIONS_RANGE
      });
      
      const lastRow = (readResponse.result.values?.length || 1) + 1;
      
      // Only update columns A-F, let G, H, I be calculated by Google Sheets
      await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: `Transactions!A${lastRow}:F${lastRow}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[
            transaction.date,        // A: Date
            transaction.amount,      // B: Amount  
            transaction.category,    // C: Category
            transaction.description, // D: Description
            transaction.tag,         // E: Tag
            transaction.account      // F: Account
          ]]
        }
      });

      console.log('✅ Transaction added to sheet at row:', lastRow);
      return true;
    } catch (error) {
      console.error('❌ Failed to add transaction to sheets:', error);
      return false;
    }
  }, [sheetsConfig.isConnected]);

  // 🔥 CRITICAL FIX: Update transaction in sheets with better error handling
  const updateTransactionInSheets = useCallback(async (transaction) => {
    try {
      if (!sheetsConfig.isConnected) {
        console.error('❌ Not connected to sheets');
        return false;
      }

      if (!transaction.sheetRow) {
        console.error('❌ No sheet row specified for transaction:', transaction);
        return false;
      }

      console.log('📝 🔥 UPDATING transaction in sheet row:', transaction.sheetRow);
      console.log('📝 🔥 Transaction data:', {
        date: transaction.date,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        tag: transaction.tag,
        account: transaction.account
      });

      // 🔥 CRITICAL: Only update columns A-F to preserve calculated formulas
      const updateResponse = await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: `Transactions!A${transaction.sheetRow}:F${transaction.sheetRow}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[
            transaction.date,        // A: Date
            transaction.amount,      // B: Amount
            transaction.category,    // C: Category
            transaction.description, // D: Description
            transaction.tag || '',   // E: Tag
            transaction.account      // F: Account
          ]]
        }
      });

      console.log('✅ 🔥 Transaction updated successfully in sheet row:', transaction.sheetRow);
      console.log('📝 Update response:', updateResponse);
      
      return true;
    } catch (error) {
      console.error('❌ 🔥 Failed to update transaction in sheets:', error);
      console.error('Error details:', error.result || error.message);
      return false;
    }
  }, [sheetsConfig.isConnected]);

  // Delete transaction from sheets
  const deleteTransactionFromSheets = useCallback(async (transaction) => {
    try {
      if (!sheetsConfig.isConnected || !transaction.sheetRow) {
        console.log('📝 Cannot delete - not connected or no sheet row:', {
          connected: sheetsConfig.isConnected,
          sheetRow: transaction.sheetRow
        });
        return false;
      }

      console.log('📝 Deleting transaction from sheet row:', transaction.sheetRow);

      // Clear the entire row (A-I)
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: `Transactions!A${transaction.sheetRow}:I${transaction.sheetRow}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [['', '', '', '', '', '', '', '', '']]
        }
      });

      console.log('✅ Transaction deleted from sheet');
      return true;
    } catch (error) {
      console.error('❌ Failed to delete transaction from sheets:', error);
      return false;
    }
  }, [sheetsConfig.isConnected]);

  // Manual sync
  const manualSync = useCallback(async () => {
    if (!sheetsConfig.isConnected) {
      await connectToGoogleSheets();
    }
    
    setSyncStatus('syncing');
    try {
      const [balanceData, transactionData, categories] = await Promise.all([
        loadAccountBalances(),
        loadTransactions(),
        loadCategoriesFromSheets() // 🔥 Load categories
      ]);
      
      setSheetsConfig(prev => ({
        ...prev,
        lastSync: new Date().toISOString()
      }));
      
      setSyncStatus('success');
      return { 
        ...balanceData, 
        transactions: transactionData, 
        categories: categories // 🔥 Include categories
      };
    } catch (error) {
      setSyncStatus('error');
      throw error;
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [sheetsConfig.isConnected, connectToGoogleSheets, loadAccountBalances, loadTransactions, loadCategoriesFromSheets]);

  // Initialize APIs and check for existing auth on mount
  useEffect(() => {
    const initializeAndCheck = async () => {
      try {
        await Promise.all([
          loadGoogleAPI(),
          loadGoogleIdentityServices()
        ]);
        
        await initializeGoogleAPI();
        
        const storedToken = getStoredToken();
        if (storedToken) {
          window.gapi.client.setToken({
            access_token: storedToken.access_token
          });
          
          try {
            await window.gapi.client.sheets.spreadsheets.get({
              spreadsheetId: SHEETS_CONFIG.spreadsheetId
            });
            
            setSheetsConfig(prev => ({ ...prev, isConnected: true }));
            
            const existingData = await checkExistingAuth();
            if (existingData) {
              window.expenseTrackerData = existingData;
            }
            
          } catch (error) {
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
    updateTransactionInSheets,
    deleteTransactionFromSheets,
    loadAccountBalances,
    loadTransactions,
    loadCategoriesFromSheets, // 🔥 NEW: Expose category loading
    getTransactionTypeFromCategory // 🔥 NEW: Expose type detection
  };
};
