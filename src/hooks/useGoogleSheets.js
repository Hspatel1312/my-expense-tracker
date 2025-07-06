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
        console.error('❌ Failed to load Google Identity Services');
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

  // Initialize Google API (OAuth-only, no API key)
  const initializeGoogleAPI = useCallback(async () => {
    try {
      console.log('🔧 Initializing Google API (OAuth-only mode)...');
      
      const gapi = await loadGoogleAPI();
      
      // Initialize WITHOUT API key - we'll use OAuth for everything
      await gapi.client.init({
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
      });

      console.log('✅ Google API client initialized (OAuth-only)');
      return gapi;
    } catch (error) {
      console.error('❌ Failed to initialize Google API:', error);
      throw error;
    }
  }, [loadGoogleAPI]);

  // Modern authentication using Google Identity Services
  const authenticateWithGoogleIdentity = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔐 Starting OAuth-only authentication...');
        
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: SHEETS_CONFIG.clientId,
          scope: 'https://www.googleapis.com/auth/spreadsheets',
          callback: (response) => {
            if (response.error) {
              console.error('❌ OAuth error:', response);
              reject(new Error(`OAuth error: ${response.error}`));
              return;
            }
            
            console.log('✅ OAuth token received');
            console.log('🔑 Token details:', {
              hasAccessToken: !!response.access_token,
              tokenLength: response.access_token?.length,
              scope: response.scope
            });
            
            // Set the access token for API calls
            window.gapi.client.setToken({
              access_token: response.access_token
            });
            
            console.log('🔑 Access token set for OAuth API calls');
            resolve(response);
          },
          error_callback: (error) => {
            console.error('❌ OAuth initialization error:', error);
            reject(new Error(`OAuth initialization error: ${error}`));
          }
        });
        
        // Request access token
        console.log('🚀 Requesting OAuth access token...');
        client.requestAccessToken();
        
      } catch (error) {
        console.error('❌ Authentication setup failed:', error);
        reject(error);
      }
    });
  }, []);

  // Test spreadsheet access using OAuth token
  const testSpreadsheetAccess = useCallback(async () => {
    try {
      console.log('📊 Testing spreadsheet access with OAuth...');
      console.log('📋 Spreadsheet ID:', SHEETS_CONFIG.spreadsheetId);
      
      // Verify we have a token
      const currentToken = window.gapi.client.getToken();
      console.log('🔍 Current token check:', {
        hasToken: !!currentToken,
        hasAccessToken: !!currentToken?.access_token,
        tokenStart: currentToken?.access_token?.substring(0, 10) + '...'
      });
      
      if (!currentToken || !currentToken.access_token) {
        throw new Error('No valid OAuth token available');
      }
      
      // Make the API call using OAuth token
      const response = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId
      });
      
      console.log('✅ OAuth spreadsheet access successful!');
      console.log('📊 Spreadsheet info:', {
        title: response.result.properties.title,
        sheetCount: response.result.sheets?.length,
        locale: response.result.properties.locale
      });
      
      return response.result;
      
    } catch (error) {
      console.error('❌ OAuth spreadsheet access failed:', error);
      
      // Detailed error analysis for OAuth context
      if (error.status === 401) {
        console.error('🔍 Error 401 - Unauthorized. OAuth token may be invalid or expired.');
      } else if (error.status === 403) {
        console.error('🔍 Error 403 - Forbidden. Check OAuth scope and spreadsheet permissions.');
      } else if (error.status === 404) {
        console.error('🔍 Error 404 - Not Found. Spreadsheet ID may be incorrect or inaccessible via OAuth.');
      }
      
      console.error('📝 Full OAuth error details:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        result: error.result
      });
      
      throw error;
    }
  }, []);

  // Main connection function
  const connectToGoogleSheets = useCallback(async () => {
    console.log('🚀 Starting OAuth-only Google Sheets connection...');
    setSyncStatus('syncing');
    setIsLoading(true);

    try {
      // Step 1: Load both Google APIs
      console.log('📚 Loading Google APIs...');
      await Promise.all([
        loadGoogleAPI(),
        loadGoogleIdentityServices()
      ]);
      
      // Step 2: Initialize Google API client (OAuth-only)
      console.log('🔧 Initializing Google API (OAuth-only)...');
      await initializeGoogleAPI();
      
      // Step 3: Authenticate using OAuth
      console.log('🔐 Authenticating with OAuth...');
      await authenticateWithGoogleIdentity();
      
      // Step 4: Test spreadsheet access using OAuth
      await testSpreadsheetAccess();
      
      console.log('🎉 OAuth-only connection fully successful!');
      
      // Update connection state
      setSheetsConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSync: new Date().toISOString()
      }));
      
      setSyncStatus('success');
      return true;
      
    } catch (error) {
      console.error('❌ OAuth connection failed:', error.message);
      
      setSyncStatus('error');
      setSheetsConfig(prev => ({ ...prev, isConnected: false }));
      throw error;
    } finally {
      setIsLoading(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [loadGoogleAPI, loadGoogleIdentityServices, initializeGoogleAPI, authenticateWithGoogleIdentity, testSpreadsheetAccess]);

  // Load account balances using OAuth
  const loadAccountBalances = useCallback(async () => {
    try {
      console.log('💰 Loading account balances with OAuth...');
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

      console.log('✅ Account balances loaded via OAuth:', newBalances);
      return { balances: newBalances, accounts: accountsList };
    } catch (error) {
      console.error('❌ Failed to load account balances via OAuth:', error);
      return { balances: {}, accounts: [] };
    }
  }, []);

  // Load transactions using OAuth
  const loadTransactions = useCallback(async () => {
    try {
      console.log('📋 Loading transactions with OAuth...');
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: SHEETS_CONFIG.TRANSACTIONS_RANGE
      });

      const rows = response.result.values || [];
      const dataRows = rows.slice(1);
      
      const transactions = dataRows
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

      console.log('✅ Transactions loaded via OAuth:', transactions.length, 'transactions');
      return transactions;
    } catch (error) {
      console.error('❌ Failed to load transactions via OAuth:', error);
      return [];
    }
  }, []);

  // Add transaction to sheets using OAuth
  const addTransactionToSheets = useCallback(async (transaction) => {
    try {
      console.log('➕ Adding transaction with OAuth...');
      
      // Ensure we're authenticated
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

      console.log('✅ Transaction added via OAuth');
      return true;
    } catch (error) {
      console.error('❌ Failed to add transaction via OAuth:', error);
      return false;
    }
  }, [sheetsConfig.isConnected, connectToGoogleSheets]);

  // Manual sync using OAuth
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
      console.log('🔄 OAuth sync completed successfully');
      return { ...balanceData, transactions: transactionData };
    } catch (error) {
      console.error('❌ OAuth sync failed:', error);
      setSyncStatus('error');
      throw error;
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [sheetsConfig.isConnected, connectToGoogleSheets, loadAccountBalances, loadTransactions]);

  // Initialize APIs on mount
  useEffect(() => {
    console.log('🏗️ Loading Google APIs for OAuth-only mode...');
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
