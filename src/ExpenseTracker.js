import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, BarChart3, CreditCard, TrendingUp, Search, DollarSign, ArrowUpDown, Wallet, Eye, EyeOff, Sparkles, Target, PieChart, Activity, AlertTriangle, CheckCircle, Star, Award, RefreshCw, Cloud, CloudOff, Trash2, Edit, Filter, X } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const ExpenseTracker = () => {
  // Google Sheets Configuration
  const [sheetsConfig, setSheetsConfig] = useState({
    spreadsheetId: '',
    apiKey: '',
    clientId: '', // Now user-configurable
    isConnected: false,
    lastSync: null
  });

  const [syncStatus, setSyncStatus] = useState('idle');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Master data for categories and accounts - accounts will be dynamic from sheets
  const [masterData, setMasterData] = useState({
    categories: [
      { main: 'Food', sub: 'Food', combined: 'Food > Food' },
      { main: 'Fuel', sub: 'Honda City', combined: 'Fuel > Honda City' },
      { main: 'Fuel', sub: 'Aviator', combined: 'Fuel > Aviator' },
      { main: 'Fuel', sub: 'Eon', combined: 'Fuel > Eon' },
      { main: 'Culture', sub: 'Culture', combined: 'Culture > Culture' },
      { main: 'Household', sub: 'Grocery', combined: 'Household > Grocery' },
      { main: 'Household', sub: 'Laundry', combined: 'Household > Laundry' },
      { main: 'Household', sub: 'House Help', combined: 'Household > House Help' },
      { main: 'Household', sub: 'Appliances', combined: 'Household > Appliances' },
      { main: 'Household', sub: 'Bills', combined: 'Household > Bills' },
      { main: 'Apparel', sub: 'Apparel', combined: 'Apparel > Apparel' },
      { main: 'Beauty', sub: 'Beauty', combined: 'Beauty > Beauty' },
      { main: 'Health', sub: 'Preventive', combined: 'Health > Preventive' },
      { main: 'Health', sub: 'Medical', combined: 'Health > Medical' },
      { main: 'Education', sub: 'Education', combined: 'Education > Education' },
      { main: 'Transportation', sub: 'Maintenance', combined: 'Transportation > Maintenance' },
      { main: 'Transportation', sub: 'Insurance', combined: 'Transportation > Insurance' },
      { main: 'Vyomi', sub: 'Vyomi', combined: 'Vyomi > Vyomi' },
      { main: 'Vacation', sub: 'Family', combined: 'Vacation > Family' },
      { main: 'Vacation', sub: 'Own', combined: 'Vacation > Own' },
      { main: 'Subscriptions', sub: 'Subscriptions', combined: 'Subscriptions > Subscriptions' },
      { main: 'Misc', sub: 'Misc', combined: 'Misc > Misc' },
      { main: 'Income', sub: 'Income', combined: 'Income > Income' },
      { main: 'Income', sub: 'Reload', combined: 'Income > Reload' },
      { main: 'Income', sub: 'Others', combined: 'Income > Others' },
      { main: 'Social Life', sub: 'Social Life', combined: 'Social Life > Social Life' },
      { main: 'Entertainment', sub: 'Entertainment', combined: 'Entertainment > Entertainment' }
    ],
    accounts: [] // Will be populated from Google Sheets
  });

  const categoryColors = useMemo(() => ({
    'Food': '#FF6B6B',
    'Social Life': '#4ECDC4',
    'Entertainment': '#45B7D1',
    'Fuel': '#FFA726',
    'Culture': '#66BB6A',
    'Household': '#42A5F5',
    'Apparel': '#AB47BC',
    'Beauty': '#EC407A',
    'Health': '#26A69A',
    'Education': '#5C6BC0',
    'Transportation': '#78909C',
    'Vyomi': '#26C6DA',
    'Vacation': '#FF7043',
    'Subscriptions': '#9CCC65',
    'Misc': '#8D6E63',
    'Income': '#66BB6A'
  }), []);

  // State management
  const [transactions, setTransactions] = useState([]);
  const [balances, setBalances] = useState({}); // Will be populated from Google Sheets

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    description: '',
    account: '',
    tag: ''
  });

  // Autocomplete states
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const [currentView, setCurrentView] = useState('dashboard');
  
  // Enhanced filters
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    account: '',
    type: '',
    month: '',
    year: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Error handling
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Google Sheets API Functions
  const TRANSACTIONS_RANGE = 'Transactions!A:I';
  const ACCOUNTS_RANGE = 'Data!E:G'; // E=Account, F=Starting Balance, G=Ending Balance

  // Load the Google APIs library
  const loadGoogleAPI = () => {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve(window.gapi);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', () => {
          resolve(window.gapi);
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Initialize Google API
  const initializeGoogleAPI = async (apiKey, clientId) => {
    try {
      const gapi = await loadGoogleAPI();
      
      await gapi.client.init({
        apiKey: apiKey,
        clientId: clientId,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        scope: 'https://www.googleapis.com/auth/spreadsheets'
      });

      return gapi;
    } catch (error) {
      console.error('Failed to initialize Google API:', error);
      throw error;
    }
  };

  // Authenticate with Google
  const authenticateGoogle = async () => {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw new Error('Google authentication failed. Please try again.');
    }
  };

  // Load account balances from Google Sheets Data tab
  const loadAccountBalances = async () => {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetsConfig.spreadsheetId,
        range: ACCOUNTS_RANGE
      });

      const rows = response.result.values || [];
      const newBalances = {};
      const accountsList = [];

      // Skip header row and process account data
      rows.slice(1).forEach(row => {
        if (row && row.length >= 3 && row[0]) { // E, F, G columns (account, starting, ending)
          const accountName = row[0].trim();
          const endingBalance = parseFloat(row[2]) || 0; // G column (Ending Balance)
          
          newBalances[accountName] = endingBalance;
          accountsList.push(accountName);
        }
      });

      setBalances(newBalances);
      setMasterData(prev => ({ ...prev, accounts: accountsList }));

      // Set default account for form if not set
      if (accountsList.length > 0 && !formData.account) {
        setFormData(prev => ({ ...prev, account: accountsList[0] }));
        setAccountSearch(accountsList[0]);
      }

      return { balances: newBalances, accounts: accountsList };
    } catch (error) {
      console.error('Failed to load account balances:', error);
      throw error;
    }
  };

  // Load data from Google Sheets
  const loadDataFromGoogleSheets = async () => {
    if (!sheetsConfig.isConnected || !sheetsConfig.spreadsheetId || !sheetsConfig.apiKey) {
      return;
    }

    try {
      setSyncStatus('syncing');
      setError(null);

      // Initialize and authenticate
      await initializeGoogleAPI(sheetsConfig.apiKey, sheetsConfig.clientId);
      await authenticateGoogle();

      // Load account balances first
      await loadAccountBalances();

      // Load transactions
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetsConfig.spreadsheetId,
        range: TRANSACTIONS_RANGE
      });

      const rows = response.result.values || [];
      
      // Skip header row if exists
      const dataRows = rows.slice(1);
      
      const sheetsTransactions = dataRows
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

      setTransactions(sheetsTransactions);
      setSheetsConfig(prev => ({ ...prev, lastSync: new Date().toISOString() }));
      setSyncStatus('success');

    } catch (error) {
      console.error('Failed to load data from Google Sheets:', error);
      if (error.status === 401) {
        setError('Authentication failed. Please check your credentials and try again.');
      } else if (error.status === 403) {
        setError('Access denied. Please check your spreadsheet permissions and API key.');
      } else if (error.status === 404) {
        setError('Spreadsheet not found. Please check the Spreadsheet ID.');
      } else {
        setError(`Failed to sync with Google Sheets: ${error.message}`);
      }
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  // Add new transaction to Google Sheets
  const addTransactionToSheets = async (transaction) => {
    if (!sheetsConfig.isConnected) return false;

    try {
      await authenticateGoogle();

      // Find the last row with data
      const readResponse = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetsConfig.spreadsheetId,
        range: TRANSACTIONS_RANGE
      });
      
      const lastRow = (readResponse.result.values?.length || 1) + 1;
      
      const rowData = [
        transaction.date,
        transaction.amount,
        transaction.category,
        transaction.description,
        transaction.tag,
        transaction.account,
        '', // Empty column
        '', // Empty column  
        transaction.type
      ];

      await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: sheetsConfig.spreadsheetId,
        range: `Transactions!A${lastRow}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [rowData]
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to add transaction to Google Sheets:', error);
      setError(`Failed to sync transaction: ${error.message}`);
      return false;
    }
  };

  // Update transaction in Google Sheets
  const updateTransactionInSheets = async (transaction) => {
    if (!sheetsConfig.isConnected || !transaction.sheetRow) return false;

    try {
      await authenticateGoogle();

      const rowData = [
        transaction.date,
        transaction.amount,
        transaction.category,
        transaction.description,
        transaction.tag,
        transaction.account,
        '', 
        '', 
        transaction.type
      ];

      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: sheetsConfig.spreadsheetId,
        range: `Transactions!A${transaction.sheetRow}:I${transaction.sheetRow}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [rowData]
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to update transaction in Google Sheets:', error);
      setError(`Failed to update transaction: ${error.message}`);
      return false;
    }
  };

  // Delete transaction from Google Sheets
  const deleteTransactionFromSheets = async (transaction) => {
    if (!sheetsConfig.isConnected || !transaction.sheetRow) return false;

    try {
      await authenticateGoogle();

      await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: sheetsConfig.spreadsheetId,
        range: `Transactions!A${transaction.sheetRow}:I${transaction.sheetRow}`
      });

      return true;
    } catch (error) {
      console.error('Failed to delete transaction from Google Sheets:', error);
      setError(`Failed to delete transaction: ${error.message}`);
      return false;
    }
  };

  // Connect to Google Sheets
  const connectToGoogleSheets = async (spreadsheetId, apiKey, clientId) => {
    setSyncStatus('syncing');
    setIsLoading(true);
    setError(null);

    try {
      // Initialize Google API
      await initializeGoogleAPI(apiKey, clientId);
      
      // Test connection by trying to read the spreadsheet metadata
      await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId
      });

      // Authenticate user
      await authenticateGoogle();

      // Connection successful
      setSheetsConfig({
        spreadsheetId,
        apiKey,
        clientId,
        isConnected: true,
        lastSync: null
      });
      
      // Load existing data
      await loadDataFromGoogleSheets();
      
    } catch (error) {
      console.error('Connection failed:', error);
      if (error.status === 404) {
        setError('Spreadsheet not found. Please check the Spreadsheet ID.');
      } else if (error.status === 401) {
        setError('Invalid API key or Client ID.');
      } else if (error.status === 403) {
        setError('Access denied. Please check spreadsheet permissions.');
      } else {
        setError(`Connection failed: ${error.message}`);
      }
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };
  // Utility functions
  const formatDateForInput = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const parseCategory = (categoryString) => {
    const parts = categoryString.split(' > ');
    return {
      main: parts[0] || '',
      sub: parts[1] || parts[0] || '',
      combined: categoryString
    };
  };

  const getTransactionType = (category) => {
    const mainCategory = parseCategory(category).main;
    return mainCategory === 'Income' ? 'Income' : 'Expense';
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.date) {
      errors.date = 'Date is required';
    }

    if (!formData.account.trim()) {
      errors.account = 'Account is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add/Edit transaction
  const addTransaction = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const categoryData = parseCategory(formData.category);
      const transactionType = getTransactionType(formData.category);

      const transactionData = {
        id: editingTransaction ? editingTransaction.id : `local_${Date.now()}`,
        date: formData.date,
        amount: parseFloat(formData.amount),
        category: categoryData.combined,
        description: formData.description,
        account: formData.account,
        type: transactionType,
        tag: formData.tag || '',
        timestamp: new Date().toISOString(),
        synced: false,
        source: 'app',
        sheetRow: editingTransaction?.sheetRow || null
      };

      if (editingTransaction) {
        const success = await updateTransactionInSheets(transactionData);
        if (success || !sheetsConfig.isConnected) {
          setTransactions(prev => 
            prev.map(t => t.id === editingTransaction.id ? { ...transactionData, synced: success } : t)
          );
        }
      } else {
        const success = await addTransactionToSheets(transactionData);
        setTransactions(prev => [{ ...transactionData, synced: success }, ...prev]);
      }

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: '',
        description: '',
        account: masterData.accounts[0] || '',
        tag: ''
      });
      setCategorySearch('');
      setAccountSearch(masterData.accounts[0] || '');
      setEditingTransaction(null);
      setIsFormVisible(false);
      setValidationErrors({});

    } catch (error) {
      setError(`Failed to save transaction: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete transaction
  const deleteTransaction = async (transaction) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    setIsLoading(true);

    try {
      if (transaction.source === 'sheets') {
        const success = await deleteTransactionFromSheets(transaction);
        if (!success && sheetsConfig.isConnected) {
          throw new Error('Failed to delete from Google Sheets');
        }
      }

      setTransactions(prev => prev.filter(t => t.id !== transaction.id));

    } catch (error) {
      setError(`Failed to delete transaction: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Edit transaction
  const editTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      date: transaction.date,
      amount: transaction.amount.toString(),
      category: transaction.category,
      description: transaction.description,
      account: transaction.account,
      tag: transaction.tag || ''
    });
    setCategorySearch(transaction.category);
    setAccountSearch(transaction.account);
    setIsFormVisible(true);
  };

  // Filter categories and accounts based on search
  const filteredCategories = masterData.categories.filter(cat =>
    cat.combined.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredAccounts = masterData.accounts.filter(acc =>
    acc.toLowerCase().includes(accountSearch.toLowerCase())
  );

  // Enhanced filtering
  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      
      const matchesSearch = !filters.search || 
        t.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.category.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesCategory = !filters.category || t.category.includes(filters.category);
      const matchesAccount = !filters.account || t.account === filters.account;
      const matchesType = !filters.type || t.type === filters.type;
      const matchesMonth = !filters.month || tDate.getMonth() === parseInt(filters.month);
      const matchesYear = !filters.year || tDate.getFullYear() === parseInt(filters.year);
      const matchesDateFrom = !filters.dateFrom || t.date >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || t.date <= filters.dateTo;
      
      return matchesSearch && matchesCategory && matchesAccount && matchesType && 
             matchesMonth && matchesYear && matchesDateFrom && matchesDateTo;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Generate filter options
  const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))].sort((a, b) => b - a);
  const months = [
    { value: '0', label: 'January' }, { value: '1', label: 'February' }, { value: '2', label: 'March' },
    { value: '3', label: 'April' }, { value: '4', label: 'May' }, { value: '5', label: 'June' },
    { value: '6', label: 'July' }, { value: '7', label: 'August' }, { value: '8', label: 'September' },
    { value: '9', label: 'October' }, { value: '10', label: 'November' }, { value: '11', label: 'December' }
  ];

  // Calculate analytics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTransactions = useMemo(() => 
    transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    }), [transactions, currentMonth, currentYear]
  );

  const currentMonthExpenses = useMemo(() => 
    currentMonthTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0),
    [currentMonthTransactions]
  );

  const currentMonthIncome = useMemo(() => 
    currentMonthTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0),
    [currentMonthTransactions]
  );

  // Category breakdown for charts
  const categoryTotals = useMemo(() => {
    const totals = {};
    currentMonthTransactions.forEach(t => {
      if (t.type === 'Expense') {
        const mainCategory = parseCategory(t.category).main;
        totals[mainCategory] = (totals[mainCategory] || 0) + t.amount;
      }
    });
    return totals;
  }, [currentMonthTransactions]);

  const pieChartData = useMemo(() => 
    Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      color: categoryColors[name]
    })),
    [categoryTotals, categoryColors]
  );

  const totalBalance = Object.values(balances).reduce((sum, balance) => sum + balance, 0);
  const savingsRate = currentMonthIncome > 0 ? ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 100 : 0;

  const topCategories = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      account: '',
      type: '',
      month: '',
      year: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Manual sync function
  const manualSync = async () => {
    await loadDataFromGoogleSheets();
  };

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.category-dropdown')) {
        setShowCategoryDropdown(false);
      }
      if (!event.target.closest('.account-dropdown')) {
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-sync when connected
  useEffect(() => {
    if (sheetsConfig.isConnected) {
      loadDataFromGoogleSheets();
    }
  }, [sheetsConfig.isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-lg font-medium">
                {editingTransaction ? 'Updating transaction...' : 'Syncing with Google Sheets...'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative bg-white/70 backdrop-blur-2xl border-b border-gray-200/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Expense Tracker</h1>
                <p className="text-gray-600 font-medium">
                  {transactions.length} transactions • {sheetsConfig.isConnected ? 'Synced with Google Sheets' : 'Local storage'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setShowSyncModal(true)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                  sheetsConfig.isConnected 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {sheetsConfig.isConnected ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
                <span className="text-sm font-medium">
                  {sheetsConfig.isConnected ? 'Connected' : 'Connect Sheets'}
                </span>
              </button>
              
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="p-3 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-xl transition-all duration-200"
              >
                {balanceVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-500">Total Balance</div>
                <div className="text-3xl font-bold text-gray-900">
                  {balanceVisible ? `₹${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '••••••••'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="relative bg-white/50 backdrop-blur-xl border-b border-gray-200/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-300 ${
                currentView === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="inline w-5 h-5 mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-300 ${
                currentView === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PieChart className="inline w-5 h-5 mr-2" />
              Analytics
            </button>
            <button
              onClick={() => setCurrentView('transactions')}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-300 ${
                currentView === 'transactions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CreditCard className="inline w-5 h-5 mr-2" />
              Transactions ({filteredTransactions.length})
            </button>
          </nav>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sync Status Banner */}
        {syncStatus !== 'idle' && (
          <div className={`mb-6 p-4 rounded-xl border ${
            syncStatus === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            syncStatus === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center space-x-3">
              {syncStatus === 'syncing' && <RefreshCw className="w-5 h-5 animate-spin" />}
              {syncStatus === 'success' && <CheckCircle className="w-5 h-5" />}
              {syncStatus === 'error' && <AlertTriangle className="w-5 h-5" />}
              <span className="font-medium">
                {syncStatus === 'syncing' && 'Syncing with Google Sheets...'}
                {syncStatus === 'success' && 'Successfully synced with Google Sheets!'}
                {syncStatus === 'error' && 'Failed to sync with Google Sheets. Please try again.'}
              </span>
            </div>
          </div>
        )}

        {/* Dashboard */}
        {currentView === 'dashboard' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group relative bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/50">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      {sheetsConfig.isConnected ? 'Synced' : 'Local'}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {balanceVisible ? `₹${totalBalance.toLocaleString('en-IN')}` : '••••••'}
                  </p>
                </div>
              </div>
              
              <div className="group relative bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/50">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-cyan-400/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      This Month
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Income</p>
                  <p className="text-2xl font-bold text-gray-900">₹{currentMonthIncome.toLocaleString('en-IN')}</p>
                </div>
              </div>
              
              <div className="group relative bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/50">
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-pink-400/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl shadow-lg">
                      <ArrowUpDown className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                      Monthly
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">₹{currentMonthExpenses.toLocaleString('en-IN')}</p>
                </div>
              </div>
              
              <div className="group relative bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/50">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-indigo-400/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl shadow-lg">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                      savingsRate > 20 ? 'text-green-600 bg-green-100' : 'text-orange-600 bg-orange-100'
                    }`}>
                      {savingsRate > 20 ? <Star className="w-3 h-3 inline mr-1" /> : <AlertTriangle className="w-3 h-3 inline mr-1" />}
                      {savingsRate.toFixed(1)}%
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Savings Rate</p>
                  <p className="text-2xl font-bold text-gray-900">₹{(currentMonthIncome - currentMonthExpenses).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            {/* Account Balances & Top Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Account Balances */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-white/50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Account Balances</h3>
                    <p className="text-gray-600">Current status of all accounts</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="space-y-4">
                  {Object.entries(balances).map(([account, balance]) => (
                    <div key={account} className="group relative bg-gradient-to-r from-gray-50 to-gray-100 hover:from-white hover:to-gray-50 border border-gray-200 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${balance >= 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          <div>
                            <span className="font-semibold text-gray-900">{account}</span>
                            <div className="text-xs text-gray-500 mt-1">
                              {balance >= 0 ? 'Active' : 'Credit Used'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {balanceVisible ? `₹${Math.abs(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '••••••'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Spending Categories */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-white/50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Top Categories</h3>
                    <p className="text-gray-600">Your biggest expenses this month</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="space-y-4">
                  {topCategories.map(([category, amount], index) => {
                    const percentage = currentMonthExpenses > 0 ? (amount / currentMonthExpenses) * 100 : 0;
                    return (
                      <div key={category} className="group">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="text-lg font-bold text-gray-400">#{index + 1}</div>
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: categoryColors[category] }}></div>
                            <span className="font-semibold text-gray-900">{category}</span>
                          </div>
                          <span className="font-bold text-gray-900">₹{amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-500 group-hover:shadow-lg"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: categoryColors[category]
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of expenses</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics View */}
        {currentView === 'analytics' && (
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-white/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Expense Distribution</h3>
                  <p className="text-gray-600">How your money is allocated across categories</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl">
                  <PieChart className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {pieChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </div>
                      <span className="font-bold text-gray-900">₹{item.value.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Transactions List */}
        {currentView === 'transactions' && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50">
            <div className="p-8 border-b border-gray-200/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">All Transactions</h2>
                    <p className="text-gray-600">
                      Showing {filteredTransactions.length} of {transactions.length} transactions
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-200 ${
                      showFilters ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                  </button>
                  {(Object.values(filters).some(v => v !== '') || showFilters) && (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Enhanced Filters */}
              {showFilters && (
                <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Filter Transactions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search description..."
                          value={filters.search}
                          onChange={(e) => setFilters({...filters, search: e.target.value})}
                          className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={filters.category}
                        onChange={(e) => setFilters({...filters, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Categories</option>
                        {Object.keys(categoryColors).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account</label>
                      <select
                        value={filters.account}
                        onChange={(e) => setFilters({...filters, account: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Accounts</option>
                        {masterData.accounts.map(acc => (
                          <option key={acc} value={acc}>{acc}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={filters.type}
                        onChange={(e) => setFilters({...filters, type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Types</option>
                        <option value="Expense">Expense</option>
                        <option value="Income">Income</option>
                        <option value="Transfer">Transfer</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                      <select
                        value={filters.month}
                        onChange={(e) => setFilters({...filters, month: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Months</option>
                        {months.map(month => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                      <select
                        value={filters.year}
                        onChange={(e) => setFilters({...filters, year: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Years</option>
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Account</th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-8 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                    <th className="px-8 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {filteredTransactions.map((transaction) => {
                    const categoryData = parseCategory(transaction.category);
                    return (
                      <tr key={transaction.id} className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-200">
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {new Date(transaction.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                          {transaction.tag && (
                            <div className="text-xs text-gray-500 mt-1">
                              <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                {transaction.tag}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: categoryColors[categoryData.main] }}></div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{categoryData.main}</div>
                              <div className="text-xs text-gray-500">{categoryData.sub}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600 font-medium">
                          {transaction.account}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            transaction.type === 'Income' ? 'bg-green-100 text-green-800' :
                            transaction.type === 'Expense' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            transaction.synced ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.synced ? 'Synced' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-right font-bold">
                          <span className={`${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'} group-hover:scale-105 transition-transform duration-200 inline-block`}>
                            {transaction.type === 'Income' ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => editTransaction(transaction)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteTransaction(transaction)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredTransactions.length === 0 && (
              <div className="text-center py-16">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-6">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-xl font-medium">No transactions found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or add some transactions</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Add Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setIsFormVisible(true)}
          className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 border-2 border-white/20"
        >
          <PlusCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Quick Add/Edit Modal */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isFormVisible ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsFormVisible(false)}></div>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className={`bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl transform transition-all duration-500 ${isFormVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'} border border-white/20`}>
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                    </h2>
                    <p className="text-gray-500">
                      {sheetsConfig.isConnected ? 'Will sync to Google Sheets automatically' : 'Will be saved locally'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsFormVisible(false);
                    setEditingTransaction(null);
                    setFormData({
                      date: new Date().toISOString().split('T')[0],
                      amount: '',
                      category: '',
                      description: '',
                      account: masterData.accounts[0] || '',
                      tag: ''
                    });
                    setCategorySearch('');
                    setAccountSearch(masterData.accounts[0] || '');
                    setValidationErrors({});
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className={`w-full px-4 py-3 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                      validationErrors.date ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {validationErrors.date && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.date}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className={`w-full px-4 py-3 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                      validationErrors.amount ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="0.00"
                  />
                  {validationErrors.amount && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.amount}</p>
                  )}
                </div>
                
                <div className="space-y-2 relative category-dropdown">
                  <label className="text-sm font-semibold text-gray-700">Category</label>
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => {
                      setCategorySearch(e.target.value);
                      setFormData({...formData, category: e.target.value});
                      setShowCategoryDropdown(true);
                    }}
                    onFocus={() => setShowCategoryDropdown(true)}
                    className={`w-full px-4 py-3 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                      validationErrors.category ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Start typing category..."
                  />
                  {validationErrors.category && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.category}</p>
                  )}
                  {showCategoryDropdown && filteredCategories.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                      {filteredCategories.slice(0, 10).map((cat, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setCategorySearch(cat.combined);
                            setFormData({...formData, category: cat.combined});
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                        >
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: categoryColors[cat.main] || '#9CA3AF' }}
                          ></div>
                          <span className="text-sm">{cat.combined}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 relative account-dropdown">
                  <label className="text-sm font-semibold text-gray-700">Account</label>
                  <input
                    type="text"
                    value={accountSearch}
                    onChange={(e) => {
                      setAccountSearch(e.target.value);
                      setFormData({...formData, account: e.target.value});
                      setShowAccountDropdown(true);
                    }}
                    onFocus={() => setShowAccountDropdown(true)}
                    className={`w-full px-4 py-3 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                      validationErrors.account ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Select account..."
                  />
                  {validationErrors.account && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.account}</p>
                  )}
                  {showAccountDropdown && filteredAccounts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg max-h-32 overflow-y-auto z-10">
                      {filteredAccounts.map((acc, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setAccountSearch(acc);
                            setFormData({...formData, account: acc});
                            setShowAccountDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm">{acc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className={`w-full px-4 py-3 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                      validationErrors.description ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Enter description..."
                  />
                  {validationErrors.description && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.description}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Tag (Optional)</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({...formData, tag: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
                    placeholder="Enter tag..."
                  />
                </div>
                
                {formData.category && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Auto-detected</label>
                    <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-blue-900">
                          Type: {getTransactionType(formData.category)}
                        </span>
                        <span className="text-xs text-blue-600">
                          • {parseCategory(formData.category).main} → {parseCategory(formData.category).sub}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => {
                    setIsFormVisible(false);
                    setEditingTransaction(null);
                    setValidationErrors({});
                  }}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={addTransaction}
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{editingTransaction ? 'Updating...' : 'Adding...'}</span>
                    </div>
                  ) : (
                    editingTransaction ? 'Update Transaction' : 'Add Transaction'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Google Sheets Modal */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${showSyncModal ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setShowSyncModal(false)}></div>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className={`bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-500 ${showSyncModal ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'} border border-white/20`}>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl">
                    <Cloud className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Google Sheets Sync</h2>
                    <p className="text-gray-500">Connect your spreadsheet</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {!sheetsConfig.isConnected ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Spreadsheet ID</label>
                    <input
                      type="text"
                      placeholder="Enter your Google Sheets ID"
                      value={sheetsConfig.spreadsheetId}
                      onChange={(e) => setSheetsConfig(prev => ({ ...prev, spreadsheetId: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">Found in your Google Sheets URL</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
                    <input
                      type="password"
                      placeholder="Enter your Google API key"
                      value={sheetsConfig.apiKey}
                      onChange={(e) => setSheetsConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">From Google Cloud Console</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">OAuth Client ID</label>
                    <input
                      type="text"
                      placeholder="Enter your OAuth 2.0 Client ID"
                      value={sheetsConfig.clientId}
                      onChange={(e) => setSheetsConfig(prev => ({ ...prev, clientId: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">OAuth 2.0 Client ID from Google Cloud Console</p>
                  </div>
                  
                  <button
                    onClick={() => connectToGoogleSheets(sheetsConfig.spreadsheetId, sheetsConfig.apiKey, sheetsConfig.clientId)}
                    disabled={!sheetsConfig.spreadsheetId || !sheetsConfig.apiKey || !sheetsConfig.clientId || isLoading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Connecting & Loading...</span>
                      </div>
                    ) : (
                      'Connect to Google Sheets'
                    )}
                  </button>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800 mb-3">
                      <strong>Setup Instructions:</strong>
                    </p>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Create a Google Cloud project and enable Sheets API</li>
                      <li>Create API key and OAuth 2.0 credentials</li>
                      <li>Add your domain to authorized origins</li>
                      <li>Create sheets: "Transactions" and "Data"</li>
                      <li>In "Data" sheet, add accounts in column E with balances in column G</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-900">Connected Successfully!</p>
                        <p className="text-sm text-green-700">
                          {transactions.length} transactions loaded • {Object.keys(balances).length} accounts found • Last synced: {sheetsConfig.lastSync ? new Date(sheetsConfig.lastSync).toLocaleTimeString() : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={manualSync}
                      disabled={syncStatus === 'syncing'}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                    >
                      {syncStatus === 'syncing' ? (
                        <div className="flex items-center justify-center space-x-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Syncing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <RefreshCw className="w-4 h-4" />
                          <span>Sync Now</span>
                        </div>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setSheetsConfig({ 
                          spreadsheetId: '', 
                          apiKey: '', 
                          clientId: '', 
                          isConnected: false, 
                          lastSync: null 
                        });
                        setTransactions([]);
                        setBalances({});
                        setMasterData(prev => ({ ...prev, accounts: [] }));
                      }}
                      className="px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
