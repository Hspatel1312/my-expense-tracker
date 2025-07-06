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

  // Store auth state in localStorage
  const storeAuthState = useCallback((isConnected) => {
    try {
      localStorage.setItem('expense_tracker_auth', JSON.stringify({
        isConnected,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Could not store auth state:', error);
    }
  }, []);

  // Get stored auth state
  const getStoredAuthState = useCallback(() => {
    try {
      const stored = localStorage.getItem('expense_tracker_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if stored state is less than 1 hour old
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - parsed.timestamp < oneHour) {
          return parsed.isConnected;
        }
      }
    } catch (error) {
      console.warn('Could not retrieve auth state:', error);
    }
    return false;
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

  // Enhanced check for existing authentication
  const checkExistingAuth = useCallback(async () => {
    try {
      if (!gapiLoaded || !gisLoaded) return false;
      
      console.log('🔍 Checking for existing authentication...');
      
      // First check localStorage
      const storedAuth = getStoredAuthState();
      if (!storedAuth) {
        console.log('ℹ️ No stored authentication found');
        return false;
      }
      
      // Check if we have a valid token
      const currentToken = window.gapi.client.getToken();
      if (currentToken && currentToken.access_token) {
        console.log('✅ Found existing token, testing connection...');
        
        try {
          // Test the connection with existing token
          const testResponse = await window.gapi.client.sheets.spreadsheets.get({
            spreadsheetId: SHEETS_CONFIG.spreadsheetId
          });
          
          console.log('✅ Existing token is valid!');
          
          // Update connection state
          setSheetsConfig(prev => ({
            ...prev,
            isConnected: true,
            lastSync: new Date().toISOString()
          }));
          
          // Load data immediately
          const [balanceData, transactionData] = await Promise.all([
            window.gapi.client.sheets.spreadsheets.values.get({
              spreadsheetId: SHEETS_CONFIG.spreadsheetId,
              range: SHEETS_CONFIG.ACCOUNTS_RANGE
            }),
            window.gapi.client.sheets.spreadsheets.values.get({
              spreadsheetId: SHEETS_CONFIG.spreadsheetId,
              range: SHEETS_CONFIG.TRANSACTIONS_RANGE
            })
          ]);
          
          // Process data with improved amount parsing
          const balanceRows = balanceData.result.values || [];
          const newBalances = {};
          const accountsList = [];
          
          balanceRows.slice(1).forEach(row => {
            if (row && row.length >= 3 && row[0]) {
              const accountName = row[0].trim();
              let endingBalance = 0;
              if (row[2]) {
                const cleanBalance = row[2].toString().replace(/[₹,\s]/g, '');
                endingBalance = parseFloat(cleanBalance) || 0;
              }
              newBalances[accountName] = endingBalance;
              accountsList.push(accountName);
            }
          });
          
          const transactionRows = transactionData.result.values || [];
          const dataRows = transactionRows.slice(1);
          
          const transactions = dataRows
            .filter(row => row && row.length > 3 && row[0] && row[1] && row[2] && row[3])
            .map((row, index) => {
              // Improved amount parsing
              let amount = 0;
              if (row[1]) {
                const cleanAmount = row[1].toString().replace(/[₹,\s]/g, '');
                amount = parseFloat(cleanAmount) || 0;
              }
              
              console.log('🔍 Parsing transaction:', {
                rawAmount: row[1],
                cleanAmount: amount,
                description: row[3]
              });
              
              return {
                id: `sheet_${index}_${Date.now()}`,
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
          
          console.log('📊 Auto-loaded data:', {
            balances: newBalances,
            accounts: accountsList,
            transactions: transactions.length,
            sampleTransaction: transactions[0]
          });
          
          // Store successful auth
          storeAuthState(true);
          
          return {
            balances: newBalances,
            accounts: accountsList,
            transactions: transactions
          };
          
        } catch (error) {
          console.log('❌ Existing token is invalid:', error);
          // Clear invalid token and stored auth
          window.gapi.client.setToken(null);
          storeAuthState(false);
          return false;
        }
      }
      
      console.log('ℹ️ No valid token found');
      storeAuthState(false);
      return false;
      
    } catch (error) {
      console.error('❌ Error checking existing auth:', error);
      storeAuthState(false);
      return false;
    }
  }, [gapiLoaded, gisLoaded, getStoredAuthState, storeAuthState]);

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
            
            console.log('🔑 Access token set');
            
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
                  range: SHEETS_CONFIG.ACCOUNTS_RANGE
                });
                
                console.log('✅ Accounts test:', accountsTest.result.values?.length - 1, 'accounts');
                
                // All tests passed - resolve with success
                console.log('🎉 All tests passed! Loading initial data...');
                
                // Immediately load the actual data while token is fresh
                try {
                  const [balanceData, transactionData] = await Promise.all([
                    window.gapi.client.sheets.spreadsheets.values.get({
                      spreadsheetId: SHEETS_CONFIG.spreadsheetId,
                      range: SHEETS_CONFIG.ACCOUNTS_RANGE
                    }),
                    window.gapi.client.sheets.spreadsheets.values.get({
                      spreadsheetId: SHEETS_CONFIG.spreadsheetId,
                      range: SHEETS_CONFIG.TRANSACTIONS_RANGE
                    })
                  ]);
                  
                  console.log('✅ Initial data loaded successfully!');
                  console.log('💰 Balance data rows:', balanceData.result.values?.length);
                  console.log('📊 Transaction data rows:', transactionData.result.values?.length);
                  
                  resolve({
                    spreadsheet: testResponse.result,
                    transactionCount: transactionsTest.result.values?.length - 1 || 0,
                    accountCount: accountsTest.result.values?.length - 1 || 0,
                    balanceData: balanceData.result,
                    transactionData: transactionData.result
                  });
                  
                } catch (dataError) {
                  console.warn('⚠️ Initial data loading failed, but connection succeeded:', dataError);
                  // Still resolve with success since connection worked
                  resolve({
                    spreadsheet: testResponse.result,
                    transactionCount: transactionsTest.result.values?.length - 1 || 0,
                    accountCount: accountsTest.result.values?.length - 1 || 0
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
  }, []);

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
      let returnData = { balances: {}, accounts: [], transactions: [] };
      
      if (connectionResult.balanceData && connectionResult.transactionData) {
        console.log('🎯 Processing data loaded during connection...');
        
        // Process balance data
        const balanceRows = connectionResult.balanceData.values || [];
        const newBalances = {};
        const accountsList = [];
        
        balanceRows.slice(1).forEach(row => {
          if (row && row.length >= 3 && row[0]) {
            const accountName = row[0].trim();
            let endingBalance = 0;
            if (row[2]) {
              const cleanBalance = row[2].toString().replace(/[₹,\s]/g, '');
              endingBalance = parseFloat(cleanBalance) || 0;
            }
            newBalances[accountName] = endingBalance;
            accountsList.push(accountName);
          }
        });
        
        // Process transaction data with improved amount parsing
        const transactionRows = connectionResult.transactionData.values || [];
        const dataRows = transactionRows.slice(1);
        
        const transactions = dataRows
          .filter(row => row && row.length > 3 && row[0] && row[1] && row[2] && row[3])
          .map((row, index) => {
            // Better amount parsing - handle different formats
            let amount = 0;
            if (row[1]) {
              // Remove currency symbols, commas, and parse
              const cleanAmount = row[1].toString().replace(/[₹,\s]/g, '');
              amount = parseFloat(cleanAmount) || 0;
            }
            
            console.log('🔍 Processing transaction:', {
              rawAmount: row[1],
              cleanAmount: amount,
              description: row[3]
            });

            return {
              id: `sheet_${index}_${Date.now()}`,
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
          transactions: transactions
        };
        
        console.log('💰 Processed balances:', newBalances);
        console.log('📊 Processed transactions:', transactions.length);
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
      
      // Store successful auth
      storeAuthState(true);
      
      console.log('🎉 Connection completed, returning data!');
      
      return returnData; // Return the processed data
      
    } catch (error) {
      console.error('❌ Connection failed:', error);
      setSyncStatus('error');
      setSheetsConfig(prev => ({ ...prev, isConnected: false }));
      storeAuthState(false);
      throw error;
    } finally {
      setIsLoading(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [loadGoogleAPI, loadGoogleIdentityServices, initializeGoogleAPI, authenticateAndTest, storeAuthState]);

  // Load account balances (ensure token is valid)
  const loadAccountBalances = useCallback(async () => {
    try {
      // Check if we have a valid token
      const currentToken = window.gapi.client.getToken();
      if (!currentToken || !currentToken.access_token) {
        console.log('🔄 No valid token for accounts, reconnecting...');
        await connectToGoogleSheets();
      }

      console.log('💰 Loading account balances...');
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: SHEETS_CONFIG.ACCOUNTS_RANGE
      });

      const rows = response.result.values || [];
      const newBalances = {};
      const accountsList = [];

      rows.slice(1).forEach(row => {
        if (row && row.length >= 3 && row[0]) {
          const accountName = row[0].trim();
          let endingBalance = 0;
          if (row[2]) {
            const cleanBalance = row[2].toString().replace(/[₹,\s]/g, '');
            endingBalance = parseFloat(cleanBalance) || 0;
          }
          newBalances[accountName] = endingBalance;
          accountsList.push(accountName);
        }
      });

      console.log('✅ Account balances loaded successfully:', newBalances);
      return { balances: newBalances, accounts: accountsList };
    } catch (error) {
      console.error('❌ Failed to load account balances:', error);
      return { balances: {}, accounts: [] };
    }
  }, [connectToGoogleSheets]);

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
          // Better amount parsing
          let amount = 0;
          if (row[1]) {
            const cleanAmount = row[1].toString().replace(/[₹,\s]/g, '');
            amount = parseFloat(cleanAmount) || 0;
          }

          return {
            id: `sheet_${index}_${Date.now()}`,
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
  }, [connectToGoogleSheets]);

  // Add transaction to sheets
  const addTransactionToSheets = useCallback(async (transaction) => {
    try {
      if (!sheetsConfig.isConnected) {
        await connectToGoogleSheets();
      }

      const readResponse = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: SHEETS_CONFIG.TRANSACTIONS_RANGE
      });
      
      const lastRow = (readResponse.result.values?.length || 1) + 1;
      
      await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: `Transactions!A${lastRow}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[
            transaction.date,
            transaction.amount,
            transaction.category,
            transaction.description,
            transaction.tag,
            transaction.account,
            '',
            '',
            transaction.type
          ]]
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to add transaction:', error);
      return false;
    }
  }, [sheetsConfig.isConnected, connectToGoogleSheets]);

  // Manual sync
  const manualSync = useCallback(async () => {
    if (!sheetsConfig.isConnected) {
      await connectToGoogleSheets();
    }
    
    setSyncStatus('syncing');
    try {
      const [balanceData, transactionData] = await Promise.all([
        loadAccountBalances(),
        loadTransactions()
      ]);
      
      setSheetsConfig(prev => ({
        ...prev,
        lastSync: new Date().toISOString()
      }));
      
      setSyncStatus('success');
      return { ...balanceData, transactions: transactionData };
    } catch (error) {
      setSyncStatus('error');
      throw error;
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [sheetsConfig.isConnected, connectToGoogleSheets, loadAccountBalances, loadTransactions]);

  // Initialize APIs and check for existing auth on mount
  useEffect(() => {
    const initializeAndCheck = async () => {
      try {
        await Promise.all([
          loadGoogleAPI(),
          loadGoogleIdentityServices()
        ]);
        
        await initializeGoogleAPI();
        
        // Check for existing authentication
        const existingData = await checkExistingAuth();
        if (existingData) {
          // Store data for immediate use
          window.expenseTrackerData = existingData;
        }
        
      } catch (error) {
        console.error('❌ Initialization failed:', error);
      }
    };
    
    initializeAndCheck();
  }, [loadGoogleAPI, loadGoogleIdentityServices, initializeGoogleAPI, checkExistingAuth]);

  return {
    sheetsConfig,
    syncStatus,
    isLoading,
    gapiLoaded: gapiLoaded && gisLoaded,
    connectToGoogleSheets,
    manualSync,
    addTransactionToSheets,
    loadAccountBalances,
    loadTransactions
  };
};
