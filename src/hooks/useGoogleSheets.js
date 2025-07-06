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
                  spreadsheetId: '1F_dHrcPRz4KFISVQFnOPYD37VWZBKlkIgyLLm66Enlg'
                });
                
                console.log('✅ SUCCESS with manual method!');
                console.log('📊 Connected to:', testResponse.result.properties.title);
                
                // Test the data ranges that worked manually
                console.log('🔍 Testing Transactions range...');
                const transactionsTest = await window.gapi.client.sheets.spreadsheets.values.get({
                  spreadsheetId: '1F_dHrcPRz4KFISVQFnOPYD37VWZBKlkIgyLLm66Enlg',
                  range: 'Transactions!A:I'
                });
                
                console.log('✅ Transactions test:', transactionsTest.result.values?.length - 1, 'transactions');
                
                console.log('🔍 Testing Accounts range...');
                const accountsTest = await window.gapi.client.sheets.spreadsheets.values.get({
                  spreadsheetId: '1F_dHrcPRz4KFISVQFnOPYD37VWZBKlkIgyLLm66Enlg',
                  range: 'Data!E:G'
                });
                
                console.log('✅ Accounts test:', accountsTest.result.values?.length - 1, 'accounts');
                
                // All tests passed - resolve with success
                resolve({
                  spreadsheet: testResponse.result,
                  transactionCount: transactionsTest.result.values?.length - 1 || 0,
                  accountCount: accountsTest.result.values?.length - 1 || 0
                });
                
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
      const results = await authenticateAndTest();
      
      // Step 4: Update connection state
      console.log('✅ Connection successful! Updating state...');
      setSheetsConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSync: new Date().toISOString()
      }));
      
      setSyncStatus('success');
      console.log('🎉 Connection completed using proven method!');
      
      return true;
      
    } catch (error) {
      console.error('❌ Connection failed:', error);
      setSyncStatus('error');
      setSheetsConfig(prev => ({ ...prev, isConnected: false }));
      throw error;
    } finally {
      setIsLoading(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [loadGoogleAPI, loadGoogleIdentityServices, initializeGoogleAPI, authenticateAndTest]);

  // Load account balances (using working method)
  const loadAccountBalances = useCallback(async () => {
    try {
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
          const endingBalance = parseFloat(row[2]) || 0;
          newBalances[accountName] = endingBalance;
          accountsList.push(accountName);
        }
      });

      return { balances: newBalances, accounts: accountsList };
    } catch (error) {
      console.error('Failed to load account balances:', error);
      return { balances: {}, accounts: [] };
    }
  }, []);

  // Load transactions (using working method)
  const loadTransactions = useCallback(async () => {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: SHEETS_CONFIG.TRANSACTIONS_RANGE
      });

      const rows = response.result.values || [];
      const dataRows = rows.slice(1);
      
      return dataRows
        .filter(row => row && row.length > 3 && row[0] && row[1] && row[2] && row[3])
        .map((row, index) => ({
          id: `sheet_${index}_${Date.now()}`,
          date: formatDateForInput(row[0]),
          amount: parseFloat(row[1]) || 0,
          category: row[2] || '',
          description: row[3] || '',
          tag: row[4] || '',
          account: row[5] || '',
          type: row[8] || getTransactionType(row[2] || ''),
          synced: true,
          source: 'sheets',
          sheetRow: index + 2
        }));
    } catch (error) {
      console.error('Failed to load transactions:', error);
      return [];
    }
  }, []);

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

  // Initialize APIs on mount
  useEffect(() => {
    Promise.all([
      loadGoogleAPI(),
      loadGoogleIdentityServices()
    ]).catch(console.error);
  }, [loadGoogleAPI, loadGoogleIdentityServices]);

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
