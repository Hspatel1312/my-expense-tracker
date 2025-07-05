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
  const [authInstance, setAuthInstance] = useState(null);

  const loadGoogleAPI = () => {
    return new Promise((resolve, reject) => {
      if (window.gapi && window.gapi.load) {
        resolve(window.gapi);
        return;
      }

      const existingScript = document.querySelector('script[src*="apis.google.com"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.gapi && window.gapi.load) {
          window.gapi.load('client:auth2', {
            callback: () => {
              console.log('Google API loaded successfully');
              setGapiLoaded(true);
              resolve(window.gapi);
            },
            onerror: () => {
              console.error('Failed to load Google API client');
              reject(new Error('Failed to load Google API client'));
            }
          });
        } else {
          console.error('Google API not available after script load');
          reject(new Error('Google API not available'));
        }
      };
      
      script.onerror = () => {
        console.error('Failed to load Google API script');
        reject(new Error('Failed to load Google API script'));
      };

      document.head.appendChild(script);
    });
  };

  const initializeGoogleAPI = useCallback(async () => {
    try {
      console.log('Initializing Google API...');

      if (!sheetsConfig.apiKey || !sheetsConfig.clientId || !sheetsConfig.spreadsheetId) {
        throw new Error('Missing required Google API configuration. Check your environment variables.');
      }

      const gapi = await loadGoogleAPI();
      
      await gapi.client.init({
        apiKey: sheetsConfig.apiKey,
        clientId: sheetsConfig.clientId,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        scope: 'https://www.googleapis.com/auth/spreadsheets'
      });

      // Get auth instance and set up listeners
      const auth = gapi.auth2.getAuthInstance();
      setAuthInstance(auth);

      // Listen for sign-in state changes
      auth.isSignedIn.listen((isSignedIn) => {
        console.log('Auth state changed:', isSignedIn);
        setSheetsConfig(prev => ({
          ...prev,
          isConnected: isSignedIn
        }));
      });

      // Check if already signed in
      const isSignedIn = auth.isSignedIn.get();
      console.log('Initial sign-in state:', isSignedIn);
      
      if (isSignedIn) {
        setSheetsConfig(prev => ({
          ...prev,
          isConnected: true,
          lastSync: new Date().toISOString()
        }));
      }

      console.log('Google API initialized successfully');
      return gapi;
    } catch (error) {
      console.error('Failed to initialize Google API:', error);
      throw error;
    }
  }, [sheetsConfig.apiKey, sheetsConfig.clientId, sheetsConfig.spreadsheetId]);

  const checkAuthStatus = () => {
    if (authInstance) {
      const isSignedIn = authInstance.isSignedIn.get();
      console.log('Checking auth status:', isSignedIn);
      return isSignedIn;
    }
    return false;
  };

  const ensureAuthenticated = async () => {
    try {
      if (!authInstance) {
        await initializeGoogleAPI();
      }

      const isSignedIn = authInstance.isSignedIn.get();
      
      if (!isSignedIn) {
        console.log('Not signed in, prompting for authentication...');
        await authInstance.signIn();
      }

      // Update connection state
      setSheetsConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSync: new Date().toISOString()
      }));

      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      setSheetsConfig(prev => ({
        ...prev,
        isConnected: false
      }));
      throw error;
    }
  };

  const connectToGoogleSheets = useCallback(async () => {
    console.log('Starting Google Sheets connection...');
    setSyncStatus('syncing');
    setIsLoading(true);

    try {
      await ensureAuthenticated();
      
      // Test spreadsheet access
      const response = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: sheetsConfig.spreadsheetId
      });
      
      console.log('Connected to spreadsheet:', response.result.properties.title);
      
      setSyncStatus('success');
      return true;
    } catch (error) {
      console.error('Connection failed:', error);
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
  }, [sheetsConfig.spreadsheetId]);

  const loadAccountBalances = async () => {
    try {
      await ensureAuthenticated();

      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetsConfig.spreadsheetId,
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

      console.log('Loaded balances:', newBalances);
      return { balances: newBalances, accounts: accountsList };
    } catch (error) {
      console.error('Failed to load account balances:', error);
      return { balances: {}, accounts: [] };
    }
  };

  const loadTransactions = async () => {
    try {
      await ensureAuthenticated();

      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetsConfig.spreadsheetId,
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

      console.log('Loaded transactions:', transactions.length);
      return transactions;
    } catch (error) {
      console.error('Failed to load transactions:', error);
      return [];
    }
  };

  const addTransactionToSheets = async (transaction) => {
    try {
      console.log('Adding transaction to sheets:', transaction);
      await ensureAuthenticated();

      const readResponse = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetsConfig.spreadsheetId,
        range: SHEETS_CONFIG.TRANSACTIONS_RANGE
      });
      
      const lastRow = (readResponse.result.values?.length || 1) + 1;
      
      const addResponse = await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: sheetsConfig.spreadsheetId,
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

      console.log('Transaction added successfully:', addResponse);
      return true;
    } catch (error) {
      console.error('Failed to add transaction:', error);
      return false;
    }
  };

  const manualSync = async () => {
    if (!sheetsConfig.isConnected) {
      console.log('Not connected, attempting to connect first...');
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
      console.log('Sync completed successfully');
      return { ...balanceData, transactions: transactionData };
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      throw error;
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  // Initialize Google API on mount
  useEffect(() => {
    console.log('Initializing Google API...');
    initializeGoogleAPI().catch(console.error);
  }, [initializeGoogleAPI]);

  return {
    sheetsConfig,
    syncStatus,
    isLoading,
    gapiLoaded,
    connectToGoogleSheets,
    manualSync,
    addTransactionToSheets,
    loadAccountBalances,
    loadTransactions,
    checkAuthStatus,
    ensureAuthenticated
  };
};
