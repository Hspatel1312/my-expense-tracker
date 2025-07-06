import { useState, useEffect, useCallback } from 'react';
import { SHEETS_CONFIG } from '../constants/config';

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
      if (window.gapi && window.gapi.client && window.gapi.auth2) {
        console.log('✅ Google API already loaded');
        resolve(window.gapi);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('📜 Google API script loaded');
        
        window.gapi.load('client:auth2', {
          callback: () => {
            console.log('✅ Google API modules loaded successfully');
            setGapiLoaded(true);
            resolve(window.gapi);
          },
          onerror: (error) => {
            console.error('❌ Failed to load Google API modules:', error);
            reject(new Error('Failed to load Google API modules: ' + JSON.stringify(error)));
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

  // Initialize with very detailed logging
  const initializeGoogleAPI = useCallback(async () => {
    try {
      console.log('🔧 Starting detailed Google API initialization...');
      
      const gapi = await loadGoogleAPI();
      console.log('✅ API loaded, starting client init...');
      
      // Log current domain for debugging
      console.log('🌐 Current domain:', window.location.origin);
      console.log('🌐 Current hostname:', window.location.hostname);
      
      // Check credentials before init
      console.log('🔑 Checking credentials...');
      console.log('API Key exists:', !!SHEETS_CONFIG.apiKey);
      console.log('API Key length:', SHEETS_CONFIG.apiKey?.length);
      console.log('Client ID exists:', !!SHEETS_CONFIG.clientId);
      console.log('Client ID length:', SHEETS_CONFIG.clientId?.length);
      console.log('Spreadsheet ID exists:', !!SHEETS_CONFIG.spreadsheetId);
      
      // Check if required domains are valid
      if (SHEETS_CONFIG.apiKey && SHEETS_CONFIG.apiKey.length < 30) {
        console.warn('⚠️ API Key seems too short');
      }
      
      if (SHEETS_CONFIG.clientId && !SHEETS_CONFIG.clientId.includes('.apps.googleusercontent.com')) {
        console.warn('⚠️ Client ID format seems incorrect');
      }
      
      console.log('🔄 Calling gapi.client.init...');
      
      // Initialize with detailed error catching
      const initResult = await gapi.client.init({
        apiKey: SHEETS_CONFIG.apiKey,
        clientId: SHEETS_CONFIG.clientId,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        scope: 'https://www.googleapis.com/auth/spreadsheets'
      });
      
      console.log('✅ gapi.client.init completed');
      console.log('Init result:', initResult);
      
      // Test auth instance
      const authInstance = gapi.auth2.getAuthInstance();
      if (!authInstance) {
        throw new Error('Auth instance not created after initialization');
      }
      
      console.log('✅ Auth instance created successfully');
      console.log('Auth instance methods:', Object.getOwnPropertyNames(authInstance));
      
      // Test if we can check sign-in status
      const isSignedIn = authInstance.isSignedIn.get();
      console.log('✅ Auth status check successful. Currently signed in:', isSignedIn);
      
      return gapi;
      
    } catch (error) {
      console.error('❌ Google API initialization failed with detailed info:');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Try to get more details about the error
      if (error.details) {
        console.error('Error details:', error.details);
      }
      
      if (error.result) {
        console.error('Error result:', error.result);
      }
      
      if (error.status) {
        console.error('HTTP Status:', error.status);
        console.error('HTTP Status Text:', error.statusText);
      }
      
      // Check if it's specifically an API key issue
      if (error.message && error.message.includes('API key')) {
        console.error('🔑 This appears to be an API key related error');
        console.error('💡 Suggestions:');
        console.error('   1. Check if API key is correct in environment variables');
        console.error('   2. Verify API key restrictions in Google Cloud Console');
        console.error('   3. Ensure Google Sheets API is enabled');
        console.error('   4. Check if the domain is authorized');
      }
      
      throw error;
    }
  }, [loadGoogleAPI]);

  // Connection function with better error handling
  const connectToGoogleSheets = useCallback(async () => {
    console.log('🚀 Starting connection with enhanced debugging...');
    setSyncStatus('syncing');
    setIsLoading(true);

    try {
      // Add a small delay to ensure everything is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔧 Initializing Google API...');
      await initializeGoogleAPI();
      
      console.log('🔐 Starting authentication process...');
      const authInstance = window.gapi.auth2.getAuthInstance();
      
      // Check current auth status
      const currentAuthStatus = authInstance.isSignedIn.get();
      console.log('📊 Current authentication status:', currentAuthStatus);
      
      if (!currentAuthStatus) {
        console.log('🔐 User not signed in, starting sign-in process...');
        
        try {
          // Try sign-in
          const signInResult = await authInstance.signIn();
          console.log('✅ Sign-in completed');
          console.log('Sign-in result:', signInResult);
        } catch (signInError) {
          console.error('❌ Sign-in failed:', signInError);
          throw signInError;
        }
      }
      
      // Verify sign-in was successful
      const finalAuthStatus = authInstance.isSignedIn.get();
      console.log('📊 Final authentication status:', finalAuthStatus);
      
      if (!finalAuthStatus) {
        throw new Error('Authentication failed or was cancelled by user');
      }
      
      console.log('📊 Testing spreadsheet access...');
      
      // Test spreadsheet access
      const spreadsheetResponse = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: SHEETS_CONFIG.spreadsheetId
      });
      
      console.log('✅ Spreadsheet access successful!');
      console.log('📊 Connected to spreadsheet:', spreadsheetResponse.result.properties.title);
      
      // Update connection state
      setSheetsConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSync: new Date().toISOString()
      }));
      
      setSyncStatus('success');
      console.log('🎉 Full connection process completed successfully!');
      
      return true;
      
    } catch (error) {
      console.error('❌ Connection process failed:');
      console.error('Error at step:', error.message);
      console.error('Full error:', error);
      
      setSyncStatus('error');
      setSheetsConfig(prev => ({ ...prev, isConnected: false }));
      
      // Provide user-friendly error message
      let userMessage = 'Connection failed. ';
      if (error.message.includes('API key')) {
        userMessage += 'Please check your API key configuration.';
      } else if (error.message.includes('cancelled')) {
        userMessage += 'Sign-in was cancelled.';
      } else if (error.message.includes('400')) {
        userMessage += 'Configuration error. Please check your Google Cloud Console settings.';
      } else {
        userMessage += 'Please try again or check the console for details.';
      }
      
      throw new Error(userMessage);
      
    } finally {
      setIsLoading(false);
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  }, [initializeGoogleAPI]);

  // Simplified placeholder functions for now
  const loadAccountBalances = useCallback(async () => {
    return { balances: {}, accounts: [] };
  }, []);

  const loadTransactions = useCallback(async () => {
    return [];
  }, []);

  const addTransactionToSheets = useCallback(async () => {
    return false;
  }, []);

  const manualSync = useCallback(async () => {
    return { balances: {}, accounts: [], transactions: [] };
  }, []);

  // Initialize on mount
  useEffect(() => {
    console.log('🏗️ Component mounted, starting Google API load...');
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
