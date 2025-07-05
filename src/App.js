import React, { useState, useEffect } from 'react';
import { PlusCircle, BarChart3, CreditCard, PieChart, Activity, AlertTriangle, X, RefreshCw, CheckCircle, Cloud, Sparkles, DollarSign, TrendingUp, ArrowUpDown, Target, Star, Award, Wallet, Search, Edit, Trash2, Filter } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import Header from './components/Header';
import { useExpenseTracker } from './hooks/useExpenseTracker';
import { useGoogleSheets } from './hooks/useGoogleSheets';
import { categoryColors } from './constants/categories';
import { parseCategory, months, getYears } from './utils/helpers';

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [error, setError] = useState(null);

  // Custom hooks
  const expenseTracker = useExpenseTracker();
  const googleSheets = useGoogleSheets();

  // Form states for modal
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const years = getYears();

  // Filtered data for dropdowns
  const filteredCategories = expenseTracker.masterData.categories.filter(cat =>
    cat.combined.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredAccounts = expenseTracker.masterData.accounts.filter(acc =>
    acc.toLowerCase().includes(accountSearch.toLowerCase())
  );

  // Sync data when Google Sheets connects
  useEffect(() => {
    if (googleSheets.sheetsConfig.isConnected) {
      googleSheets.manualSync()
        .then(data => {
          if (data) {
            expenseTracker.setBalances(data.balances);
            expenseTracker.setMasterData(prev => ({ 
              ...prev, 
              accounts: data.accounts 
            }));
            expenseTracker.setTransactions(data.transactions);
          }
        })
        .catch(console.error);
    }
  }, [googleSheets.sheetsConfig.isConnected]);

  // Handle form submission
  const handleAddTransaction = async () => {
    const success = await expenseTracker.addTransaction(
      googleSheets.addTransactionToSheets
    );
    
    if (success) {
      setIsFormVisible(false);
      setCategorySearch('');
      setAccountSearch('');
    }
  };

  // Handle edit transaction
  const handleEditTransaction = (transaction) => {
    expenseTracker.editTransaction(transaction);
    setCategorySearch(transaction.category);
    setAccountSearch(transaction.account);
    setIsFormVisible(true);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Loading Overlay */}
      {googleSheets.isLoading && (
        <div className="fixe
