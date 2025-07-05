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
              reject(new Error('Failed to load Google API client'));
            }
          });
        } else {
          reject(new Error('Google API not available'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google API script'));
      };

      document.head.appendChild(script);
    });
  };

  const initializeGoogleAPI = async () => {
    try {
      const gapi = await loadGoogleAPI();
      
      await gapi.client.init({
        apiKey: sheetsConfig.apiKey,
        clientId: sheetsConfig.clientId,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        scope: 'https://www.googleapis.com/auth/spreadsheets'
      });

      console.log('Google API initialized successfully');
      return gapi;
    } catch (error) {
      console.error('Failed to initialize Google API:', error);
      throw error;
    }
  };

  const authenticateGoogle = async () => {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  };

  const connectToGoogleSheets = useCallback(async () => {
    setSyncStatus('syncing');
    setIsLoading(true);

    try {
      await initializeGoogleAPI();
      
      // Test connection
      await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: sheetsConfig.spreadsheetId
      });

      await authenticateGoogle();

      setSheetsConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSync: new Date().toISOString()
      }));
      
      setSyncStatus('success');
      return true;
    } catch (error) {
      console.error('Connection failed:', error);
      setSyncStatus('error');
      throw error;
    } finally {
      setIsLoading(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [sheetsConfig.spreadsheetId, sheetsConfig.apiKey, sheetsConfig.clientId]);

  const loadAccountBalances = async () => {
    try {
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

      return { balances: newBalances, accounts: accountsList };
    } catch (error) {
      console.error('Failed to load account balances:', error);
      return { balances: {}, accounts: [] };
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetsConfig.spreadsheetId,
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
  };

  const addTransactionToSheets = async (transaction) => {
    try {
      await authenticateGoogle();

      const readResponse = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetsConfig.spreadsheetId,
        range: SHEETS_CONFIG.TRANSACTIONS_RANGE
      });
      
      const lastRow = (readResponse.result.values?.length || 1) + 1;
      
      await window.gapi.client.sheets.spreadsheets.values.append({
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

      return true;
    } catch (error) {
      console.error('Failed to add transaction:', error);
      return false;
    }
  };

  const manualSync = async () => {
    if (!sheetsConfig.isConnected) return null;
    
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
  };

  useEffect(() => {
    loadGoogleAPI().catch(console.error);
  }, []);

  useEffect(() => {
    if (gapiLoaded && !sheetsConfig.isConnected) {
      setTimeout(() => {
        connectToGoogleSheets().catch(console.error);
      }, 1000);
    }
  }, [gapiLoaded, sheetsConfig.isConnected, connectToGoogleSheets]);

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
