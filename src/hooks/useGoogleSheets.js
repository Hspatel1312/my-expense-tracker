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

  // Process transaction data with timezone-safe date parsing
  const processTransactionData = useCallback((transactionData) => {
    const transactionRows = transactionData.values || [];
    const dataRows = transactionRows.slice(1);
    
    const transactions = dataRows
      .filter(row => row && row.length > 3 && row[0] && row[1] && row[2] && row[3])
      .map((row, index) => {
        const amount = parseAmount(row[1]);
        
        // Use timezone-safe date parsing
        const parsedDate = parseGoogleSheetsDate(row[0]);
        
        // Better transaction type detection
        let transactionType = row[8] || ''; // Column I (Type)
        if (!transactionType) {
          transactionType = getTransactionType(row[2] || ''); // Fallback to category-based detection
        }
        
        console.log(`🔍 Processing transaction ${index + 1}:`, {
          rawDate: row[0],
          parsedDate: parsedDate,
          rawAmount: row[1],
          parsedAmount: amount,
          description: row[3],
          category: row[2],
          detectedType: transactionType
        });
        
        return {
          id: `sheet_${index}_${Date.now()}_${Math.random()}`,
          date: parsedDate, // Now using timezone-safe parsing
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
    
    console.log('📊 Processed transactions with timezone-safe dates:', transactions.length);
    console.log('🔍 Sample transaction dates:', transactions.slice(0, 3).map(t => ({ 
      description: t.description, 
      originalDate: t.date, 
      displayDate: new Date(t.date).toLocaleDateString('en-IN') 
    })));
    
    return transactions;
  }, [parseAmount]);

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
        
        // Load data immediately
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
        
        console.log('🔍 Auth check - Scanning', balanceRows.length, 'rows for accounts...');
        
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
              
              console.log(`🔍 Auth check - Found account: "${accountName}" with balance: ${endingBalance}`);
              
              newBalances[accountName] = endingBalance;
              accountsList.push(accountName);
            }
          }
        });
        
        // Process transactions with timezone-safe dates
        const transactions = processTransactionData(transactionData.result);
        
        console.log('📊 Auto-loaded data:', {
          balances: newBalances,
          accounts: accountsList,
          transactions: transactions.length,
          sampleTransaction: transactions[0]
        });
        
        return {
          balances: newBalances,
          accounts: accountsList,
          transactions: transactions
        };
        
      } catch (error) {
        console.log('❌ Stored token is invalid:', error);
        window.gapi.client.setToken(null);
        localStorage.removeItem('google_auth_token');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error checking existing auth:', error);
      localStorage.removeItem('google_auth_token');
      return false;
    }
  }, [gapiLoaded, gisLoaded, getStoredToken, parseAmount, processTransactionData]);

  // Authenticate and immediately test
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
            
            window.gapi.client.setToken({
              access_token: response.access_token
            });
            
            storeToken({ access_token: response.access_token });
            
            console.log('🔑 Access token set and stored');
            
            setTimeout(async () => {
              try {
                console.log('🔍 Testing connection...');
                
                const testResponse = await window.gapi.client.sheets.spreadsheets.get({
                  spreadsheetId: SHEETS_CONFIG.spreadsheetId
                });
                
                console.log('✅ SUCCESS!');
                console.log('📊 Connected to:', testResponse.result.properties.title);
                
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
                
                console.log('✅ Initial data loaded successfully!');
                
                resolve({
                  spreadsheet: testResponse.result,
                  balanceData: balanceData.result,
                  transactionData: transactionData.result
                });
                
              } catch (testError) {
                console.error('❌ Test failed:', testError);
                reject(testError);
              }
            }, 3000);
          },
          error_callback: (error) => {
            console.error('❌ OAuth error callback:', error);
            reject(new Error(`OAuth error: ${error}`));
          }
        });
        
        client.requestAccessToken();
        
      } catch (error) {
        console.error('❌ Authentication setup failed:', error);
        reject(error);
      }
    });
  }, [storeToken]);

  // Simplified connection function
  const connectToGoogleSheets = useCallback(async () => {
    console.log('🚀 Starting connection...');
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
        console.log('🎯 Processing data loaded during connection...');
        
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
              
              console.log(`🔍 Connection - Found account: "${accountName}" with balance: ${endingBalance}`);
              
              newBalances[accountName] = endingBalance;
              accountsList.push(accountName);
            }
          }
        });
        
        // Process transactions with timezone-safe dates
        const transactions = processTransactionData(connectionResult.transactionData);
        
        returnData = {
          balances: newBalances,
          accounts: accountsList,
          transactions: transactions
        };
        
        console.log('💰 Processed balances:', newBalances);
        console.log('📊 Processed transactions:', transactions.length);
      }
      
      setSheetsConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSync: new Date().toISOString()
      }));
      
      setSyncStatus('success');
      console.log('🎉 Connection completed!');
      
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
        console.log('🔄 No valid token for accounts, reconnecting...');
        await connectToGoogleSheets();
      }

      console.log('💰 Loading account balances...');
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

      console.log('✅ Account balances loaded successfully:', newBalances);
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
        console.log('🔄 No valid token for transactions, reconnecting...');
        await connectToGoogleSheets();
      }

      console.log('📋 Loading transactions...');
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: SHEETS_CONFIG.TRANSACTIONS_RANGE
      });

      const transactions = processTransactionData(response.result);

      console.log('✅ Transactions loaded successfully:', transactions.length);
      return transactions;
    } catch (error) {
      console.error('❌ Failed to load transactions:', error);
      return [];
    }
  }, [connectToGoogleSheets, processTransactionData]);

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
        
        const storedToken = getStoredToken();
        if (storedToken) {
          console.log('🔍 Setting stored token...');
          window.gapi.client.setToken({
            access_token: storedToken.access_token
          });
          
          try {
            await window.gapi.client.sheets.spreadsheets.get({
              spreadsheetId: SHEETS_CONFIG.spreadsheetId
            });
            
            console.log('✅ Stored token is still valid!');
            setSheetsConfig(prev => ({ ...prev, isConnected: true }));
            
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
    loadAccountBalances,
    loadTransactions
  };
};
