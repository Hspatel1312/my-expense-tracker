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

  // Initialize Google API (without auth2)
  const initializeGoogleAPI = useCallback(async () => {
    try {
      console.log('🔧 Initializing Google API with modern approach...');
      
      const gapi = await loadGoogleAPI();
      
      await gapi.client.init({
        apiKey: SHEETS_CONFIG.apiKey,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
      });

      console.log('✅ Google API client initialized (without auth)');
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
        console.log('🔐 Starting modern Google authentication...');
        
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
            // Set the access token for API calls
            window.gapi.client.setToken({
              access_token: response.access_token
            });
            
            resolve(response);
          },
          error_callback: (error) => {
            console.error('❌ OAuth initialization error:', error);
            reject(new Error(`OAuth initialization error: ${error}`));
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

  // Main connection function
  const connectToGoogleSheets = useCallback(async () => {
    console.log('🚀 Starting modern Google Sheets connection...');
    setSyncStatus('syncing');
    setIsLoading(true);

    try {
      // Step 1: Load both Google APIs
      console.log('📚 Loading Google APIs...');
      await Promise.all([
        loadGoogleAPI(),
        loadGoogleIdentityServices()
      ]);
      
      // Step 2: Initialize Google API client
      console.log('🔧 Initializing Google API...');
      await initializeGoogleAPI();
      
      // Step 3: Authenticate using modern method
      console.log('🔐 Authenticating...');
      await authenticateWithGoogleIdentity();
      
      // Step 4: Test spreadsheet access
      console.log('📊 Testing spreadsheet access...');
      const response = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId
      });
      
      console.log('✅ Successfully connected to:', response.result.properties.title);
      
      // Update connection state
      setSheetsConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSync: new Date().toISOString()
      }));
      
      setSyncStatus('success');
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
  }, [loadGoogleAPI, loadGoogleIdentityServices, initializeGoogleAPI, authenticateWithGoogleIdentity]);

  // Load account balances
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

  // Load transactions
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
    console.log('🏗️ Loading modern Google APIs...');
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
