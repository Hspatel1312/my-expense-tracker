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

  // Load Google API
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
        window.gapi.load('client:auth2', {
          callback: () => {
            console.log('✅ Google API loaded successfully');
            setGapiLoaded(true);
            resolve(window.gapi);
          },
          onerror: (error) => {
            console.error('❌ Failed to load Google API client:', error);
            reject(new Error('Failed to load Google API client'));
          }
        });
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load Google API script');
        reject(new Error('Failed to load Google API script'));
      };

      document.head.appendChild(script);
    });
  }, []);

  // Initialize Google API with config
  const initializeGoogleAPI = useCallback(async () => {
    try {
      console.log('🔧 Initializing Google API...');
      
      // Check environment variables
      if (!SHEETS_CONFIG.apiKey || !SHEETS_CONFIG.clientId || !SHEETS_CONFIG.spreadsheetId) {
        console.error('❌ Missing Google API configuration:', {
          apiKey: SHEETS_CONFIG.apiKey ? 'Set' : 'Missing',
          clientId: SHEETS_CONFIG.clientId ? 'Set' : 'Missing',
          spreadsheetId: SHEETS_CONFIG.spreadsheetId ? 'Set' : 'Missing'
        });
        throw new Error('Missing Google API configuration. Check environment variables.');
      }

      const gapi = await loadGoogleAPI();
      
      await gapi.client.init({
        apiKey: SHEETS_CONFIG.apiKey,
        clientId: SHEETS_CONFIG.clientId,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        scope: 'https://www.googleapis.com/auth/spreadsheets'
      });

      console.log('✅ Google API initialized successfully');
      return gapi;
    } catch (error) {
      console.error('❌ Failed to initialize Google API:', error);
      throw error;
    }
  }, [loadGoogleAPI]);

  // Main connection function
  const connectToGoogleSheets = useCallback(async () => {
    console.log('🚀 Starting Google Sheets connection...');
    setSyncStatus('syncing');
    setIsLoading(true);

    try {
      // Step 1: Initialize API
      await initializeGoogleAPI();
      console.log('✅ Step 1: API initialized');

      // Step 2: Get auth instance
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance) {
        throw new Error('Auth instance not available');
      }
      console.log('✅ Step 2: Auth instance obtained');

      // Step 3: Check if already signed in
      let isSignedIn = authInstance.isSignedIn.get();
      console.log('🔍 Current sign-in status:', isSignedIn);

      // Step 4: Sign in if needed
      if (!isSignedIn) {
        console.log('🔐 Prompting for sign-in...');
        await authInstance.signIn();
        isSignedIn = authInstance.isSignedIn.get();
        console.log('✅ Step 4: Sign-in completed:', isSignedIn);
      }

      if (!isSignedIn) {
        throw new Error('Sign-in failed or cancelled');
      }

      // Step 5: Test spreadsheet access
      console.log('📊 Testing spreadsheet access...');
      const response = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId
      });
      
      console.log('✅ Step 5: Connected to spreadsheet:', response.result.properties.title);

      // Step 6: Update connection state
      setSheetsConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSync: new Date().toISOString()
      }));

      setSyncStatus('success');
      console.log('🎉 Connection successful!');
      
      return true;
    } catch (error) {
      console.error('❌ Connection failed:', error);
      setSyncStatus('error');
      setSheetsConfig(prev => ({
        ...prev,
        isConnected: false
      }));
      throw error;
    } finally {
      setIsLoading(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [initializeGoogleAPI]);

  // Load account balances
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

      rows.slice(1).forEach(row => {
        if (row && row.length >= 3 && row[0]) {
          const accountName = row[0].trim();
          const endingBalance = parseFloat(row[2]) || 0;
          
          newBalances[accountName] = endingBalance;
          accountsList.push(accountName);
        }
      });

      console.log('✅ Loaded balances:', newBalances);
      return { balances: newBalances, accounts: accountsList };
    } catch (error) {
      console.error('❌ Failed to load account balances:', error);
      return { balances: {}, accounts: [] };
    }
  }, []);

  // Load transactions
  const loadTransactions = useCallback(async () => {
    try {
      console.log('📋 Loading transactions...');
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

      console.log('✅ Loaded transactions:', transactions.length);
      return transactions;
    } catch (error) {
      console.error('❌ Failed to load transactions:', error);
      return [];
    }
  }, []);

  // Add transaction to sheets
  const addTransactionToSheets = useCallback(async (transaction) => {
    try {
      console.log('➕ Adding transaction to sheets:', transaction);
      
      // Ensure we're authenticated first
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance || !authInstance.isSignedIn.get()) {
        console.log('🔐 Not authenticated, connecting first...');
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

      console.log('✅ Transaction added successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to add transaction:', error);
      return false;
    }
  }, [connectToGoogleSheets]);

  // Manual sync function
  const manualSync = useCallback(async () => {
    if (!sheetsConfig.isConnected) {
      console.log('🔗 Not connected, connecting first...');
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
      console.log('🔄 Sync completed successfully');
      return { ...balanceData, transactions: transactionData };
    } catch (error) {
      console.error('❌ Sync failed:', error);
      setSyncStatus('error');
      throw error;
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [sheetsConfig.isConnected, connectToGoogleSheets, loadAccountBalances, loadTransactions]);

  // Initialize on mount
  useEffect(() => {
    console.log('🏗️ Component mounted, loading Google API...');
    loadGoogleAPI().catch(console.error);
  }, [loadGoogleAPI]);

  return {
    sheetsConfig,
    syncStatus,
    isLoading,
    gapiLoaded,
    connectToGoogleSheets,
    manualSync,
    addTransactionToSheets,
    loadAccountBalances,
    loadTransactions
  };
};
