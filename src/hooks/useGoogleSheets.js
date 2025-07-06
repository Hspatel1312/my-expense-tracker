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

  // Initialize Google API (OAuth-only)
  const initializeGoogleAPI = useCallback(async () => {
    try {
      console.log('🔧 Initializing Google API (OAuth-only mode)...');
      
      const gapi = await loadGoogleAPI();
      
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
        console.log('🔐 Starting OAuth authentication...');
        
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: SHEETS_CONFIG.clientId,
          scope: 'https://www.googleapis.com/auth/spreadsheets',
          callback: (response) => {
            if (response.error) {
              console.error('❌ OAuth error:', response);
              reject(new Error(`OAuth error: ${response.error}`));
              return;
            }
            
            console.log('✅ OAuth token received successfully');
            
            // Set the access token for API calls
            window.gapi.client.setToken({
              access_token: response.access_token
            });
            
            console.log('🔑 Access token configured for API calls');
            resolve(response);
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

  // Test both spreadsheet ranges that we know work
  const testSpreadsheetAccess = useCallback(async () => {
    try {
      console.log('📊 Testing spreadsheet access...');
      
      // Test 1: Get spreadsheet metadata
      console.log('🔍 Test 1: Getting spreadsheet metadata...');
      const metadataResponse = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId
      });
      
      console.log('✅ Spreadsheet metadata:', {
        title: metadataResponse.result.properties.title,
        sheets: metadataResponse.result.sheets.map(s => s.properties.title)
      });
      
      // Test 2: Get Transactions data (we know this works)
      console.log('🔍 Test 2: Getting Transactions data...');
      const transactionsResponse = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: 'Transactions!A:I'
      });
      
      const transactionCount = transactionsResponse.result.values?.length - 1 || 0;
      console.log('✅ Transactions loaded:', transactionCount, 'transactions');
      
      // Test 3: Get Accounts data (we know this works)
      console.log('🔍 Test 3: Getting Accounts data...');
      const accountsResponse = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: 'Data!E:G'
      });
      
      const accountCount = accountsResponse.result.values?.length - 1 || 0;
      console.log('✅ Accounts loaded:', accountCount, 'accounts');
      
      // All tests passed!
      console.log('🎉 All spreadsheet access tests passed!');
      return {
        metadata: metadataResponse.result,
        transactionCount,
        accountCount
      };
      
    } catch (error) {
      console.error('❌ Spreadsheet access test failed:', error);
      throw error;
    }
  }, []);

  // Main connection function
  const connectToGoogleSheets = useCallback(async () => {
    console.log('🚀 Starting Google Sheets connection...');
    setSyncStatus('syncing');
    setIsLoading(true);

    try {
      // Step 1: Load APIs
      console.log('📚 Loading Google APIs...');
      await Promise.all([
        loadGoogleAPI(),
        loadGoogleIdentityServices()
      ]);
      
      // Step 2: Initialize API client
      console.log('🔧 Initializing Google API...');
      await initializeGoogleAPI();
      
      // Step 3: Authenticate
      console.log('🔐 Authenticating...');
      await authenticateWithGoogleIdentity();
      
      // Step 4: Test access (we know this works from console test)
      console.log('📊 Testing spreadsheet access...');
      const testResults = await testSpreadsheetAccess();
      
      // Step 5: Update connection state
      console.log('✅ Connection successful! Updating state...');
      setSheetsConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSync: new Date().toISOString()
      }));
      
      setSyncStatus('success');
      console.log('🎉 Google Sheets connection completed successfully!');
      console.log('📊 Connected to:', testResults.metadata.properties.title);
      console.log('📈 Found:', testResults.transactionCount, 'transactions,', testResults.accountCount, 'accounts');
      
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
  }, [loadGoogleAPI, loadGoogleIdentityServices, initializeGoogleAPI, authenticateWithGoogleIdentity, testSpreadsheetAccess]);

  // Load account balances (we know this works)
  const loadAccountBalances = useCallback(async () => {
    try {
      console.log('💰 Loading account balances...');
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: SHEETS_CONFIG.ACCOUNTS_RANGE
      });

      const rows = response.result.values || [];
      const newBalances = {};
      const accountsList = [];

      // Process account data (skip header row)
      rows.slice(1).forEach(row => {
        if (row && row.length >= 3 && row[0]) {
          const accountName = row[0].trim();
          const endingBalance = parseFloat(row[2]) || 0;
          newBalances[accountName] = endingBalance;
          accountsList.push(accountName);
        }
      });

      console.log('✅ Account balances loaded:', newBalances);
      return { balances: newBalances, accounts: accountsList };
    } catch (error) {
      console.error('❌ Failed to load account balances:', error);
      return { balances: {}, accounts: [] };
    }
  }, []);

  // Load transactions (we know this works)
  const loadTransactions = useCallback(async () => {
    try {
      console.log('📋 Loading transactions...');
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: SHEETS_CONFIG.TRANSACTIONS_RANGE
      });

      const rows = response.result.values || [];
      const dataRows = rows.slice(1); // Skip header row
      
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

      console.log('✅ Transactions loaded:', transactions.length, 'transactions');
      return transactions;
    } catch (error) {
      console.error('❌ Failed to load transactions:', error);
      return [];
    }
  }, []);

  // Add transaction to sheets
  const addTransactionToSheets = useCallback(async (transaction) => {
    try {
      console.log('➕ Adding transaction to sheets...');
      
      // Ensure we're connected
      if (!sheetsConfig.isConnected) {
        console.log('🔗 Not connected, connecting first...');
        await connectToGoogleSheets();
      }

      // Get current data to find next row
      const readResponse = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId,
        range: SHEETS_CONFIG.TRANSACTIONS_RANGE
      });
      
      const lastRow = (readResponse.result.values?.length || 1) + 1;
      
      // Add the transaction
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

      console.log('✅ Transaction added successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to add transaction:', error);
      return false;
    }
  }, [sheetsConfig.isConnected, connectToGoogleSheets]);

  // Manual sync
  const manualSync = useCallback(async () => {
    if (!sheetsConfig.isConnected) {
      console.log('🔗 Not connected, connecting first...');
      await connectToGoogleSheets();
    }
    
    setSyncStatus('syncing');
    try {
      console.log('🔄 Starting manual sync...');
      const [balanceData, transactionData] = await Promise.all([
        loadAccountBalances(),
        loadTransactions()
      ]);
      
      setSheetsConfig(prev => ({
        ...prev,
        lastSync: new Date().toISOString()
      }));
      
      setSyncStatus('success');
      console.log('✅ Manual sync completed successfully');
      return { ...balanceData, transactions: transactionData };
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
      setSyncStatus('error');
      throw error;
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [sheetsConfig.isConnected, connectToGoogleSheets, loadAccountBalances, loadTransactions]);

  // Initialize APIs on mount
  useEffect(() => {
    console.log('🏗️ Loading Google APIs...');
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
