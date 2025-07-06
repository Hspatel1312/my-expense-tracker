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

  // Load Google API with different approach
  const loadGoogleAPI = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.gapi && window.gapi.client && window.gapi.auth2) {
        resolve(window.gapi);
        return;
      }

      // Remove any existing scripts
      const existingScripts = document.querySelectorAll('script[src*="apis.google.com"]');
      existingScripts.forEach(script => script.remove());

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('📜 Google API script loaded');
        
        window.gapi.load('client:auth2', {
          callback: () => {
            console.log('✅ Google API client and auth2 loaded successfully');
            setGapiLoaded(true);
            resolve(window.gapi);
          },
          onerror: (error) => {
            console.error('❌ Failed to load Google API modules:', error);
            reject(new Error('Failed to load Google API modules'));
          }
        });
      };
      
      script.onerror = (error) => {
        console.error('❌ Failed to load Google API script:', error);
        reject(new Error('Failed to load Google API script'));
      };

      document.head.appendChild(script);
    });
  }, []);

  // Initialize with more specific error handling
  const initializeGoogleAPI = useCallback(async () => {
    try {
      console.log('🔧 Starting Google API initialization...');
      
      const gapi = await loadGoogleAPI();
      
      console.log('🔑 Initializing with credentials...');
      console.log('API Key length:', SHEETS_CONFIG.apiKey?.length);
      console.log('Client ID length:', SHEETS_CONFIG.clientId?.length);
      
      // Initialize client
      await gapi.client.init({
        apiKey: SHEETS_CONFIG.apiKey,
        clientId: SHEETS_CONFIG.clientId,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        scope: 'https://www.googleapis.com/auth/spreadsheets'
      });

      console.log('✅ Google API client initialized');
      
      // Check auth instance
      const authInstance = gapi.auth2.getAuthInstance();
      if (!authInstance) {
        throw new Error('Auth instance not created');
      }
      
      console.log('✅ Auth instance available');
      return gapi;
      
    } catch (error) {
      console.error('❌ Google API initialization failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }, [loadGoogleAPI]);

  // Simplified connection function
  const connectToGoogleSheets = useCallback(async () => {
    console.log('🚀 Starting connection attempt...');
    setSyncStatus('syncing');
    setIsLoading(true);

    try {
      // Wait a moment to ensure page is fully loaded
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await initializeGoogleAPI();
      
      // Get fresh auth instance
      const authInstance = window.gapi.auth2.getAuthInstance();
      
      console.log('🔐 Checking authentication status...');
      const isSignedIn = authInstance.isSignedIn.get();
      console.log('Current auth status:', isSignedIn);
      
      if (!isSignedIn) {
        console.log('🔐 Starting sign-in process...');
        
        // Try silent sign-in first
        try {
          await authInstance.signIn({ prompt: 'none' });
          console.log('✅ Silent sign-in successful');
        } catch (silentError) {
          console.log('ℹ️ Silent sign-in failed, trying interactive sign-in...');
          await authInstance.signIn();
          console.log('✅ Interactive sign-in successful');
        }
      }
      
      // Verify we're now signed in
      if (!authInstance.isSignedIn.get()) {
        throw new Error('Sign-in failed or was cancelled');
      }
      
      console.log('📊 Testing spreadsheet access...');
      const response = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId
      });
      
      console.log('✅ Successfully connected to:', response.result.properties.title);
      
      // Update state
      setSheetsConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSync: new Date().toISOString()
      }));
      
      setSyncStatus('success');
      return true;
      
    } catch (error) {
      console.error('❌ Connection failed:', error);
      console.error('Error type:', typeof error);
      console.error('Error properties:', Object.keys(error));
      
      if (error.status) {
        console.error('HTTP Status:', error.status);
        console.error('HTTP Status Text:', error.statusText);
      }
      
      setSyncStatus('error');
      setSheetsConfig(prev => ({ ...prev, isConnected: false }));
      throw error;
      
    } finally {
      setIsLoading(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [initializeGoogleAPI]);

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
