import { useState, useEffect, useCallback } from 'react';
import { SHEETS_CONFIG } from '../constants/config';
import { parseGoogleSheetsDate, getTransactionType } from '../utils/helpers';

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

  // Process transaction data with timezone-safe date parsing
  const processTransactionData = useCallback((transactionData) => {
    const transactionRows = transactionData.values || [];
    const dataRows = transactionRows.slice(1);
    
    const transactions = dataRows
      .filter(row => row && row.length > 3 && row[0] && row[1] && row[2] && row[3])
      .map((row, index) => {
        const amount = parseAmount(row[1]);
        const parsedDate = parseGoogleSheetsDate(row[0]);
        
        let transactionType = row[8] || '';
        if (!transactionType) {
          transactionType = getTransactionType(row[2] || '');
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
  }, [parseAmount]);

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
        
        const [balanceData, transactionData] = await Promise.all([
          window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_CONFIG.spreadsheetId,
            range: 'Data!E:G'
          }),
          window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SHEETS_CONFIG.spreadsheetId,
            range: SHEETS_CONFIG.TRANSACTIONS_RANGE
          })
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
          transactions: transactions
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
  }, [gapiLoaded, gisLoaded, getStoredToken, parseAmount, processTransactionData]);

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
                
                const [balanceData, transactionData] = await Promise.all([
                  window.gapi.client.sheets.spreadsheets.values.get({
                    spreadsheetId: SHEETS_CONFIG.spreadsheetId,
                    range: 'Data!E:G'
                  }),
                  window.gapi.client.sheets.spreadsheets.values.get({
                    spreadsheetId: SHEETS_CONFIG.spreadsheetId,
                    range: SHEETS_CONFIG.TRANSACTIONS_RANGE
                  })
                ]);
                
                resolve({
                  spreadsheet: testResponse.result,
                  balanceData: balanceData.result,
                  transactionData: transactionData.result
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
  }, [storeToken]);

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
      
      let returnData = { balances: {}, accounts: [], transactions: [] };
      
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
          transactions: transactions
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

  // 🔥 NEW: Add transaction to sheets
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

      console.log('✅ Transaction added to sheet at row:', lastRow);
      return true;
    } catch (error) {
      console.error('❌ Failed to add transaction to sheets:', error);
      return false;
    }
  }, [sheetsConfig.isConnected]);

  // 🔥 NEW: Update transaction in sheets
  const updateTransactionInSheets = useCallback(async (transaction) => {
    try {
      if (!sheetsConfig.isConnected || !transaction.sheetRow) {
        console.log('📝 Cannot update - not connected or no sheet row:', {
          connected: sheetsConfig.isConnected,
          sheetRow: transaction.sheetRow
        });
        return false;
      }

      console.log('📝 Updating transaction in sheet row:', transaction.sheetRow, transaction);

      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: `Transactions!A${transaction.sheetRow}:I${transaction.sheetRow}`,
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

      console.log('✅ Transaction updated in sheet');
      return true;
    } catch (error) {
      console.error('❌ Failed to update transaction in sheets:', error);
      return false;
    }
  }, [sheetsConfig.isConnected]);

  // 🔥 NEW: Delete transaction from sheets
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

      // Clear the row by setting all cells to empty
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
    updateTransactionInSheets,     // 🔥 NEW
    deleteTransactionFromSheets,   // 🔥 NEW
    loadAccountBalances,
    loadTransactions
  };
};
