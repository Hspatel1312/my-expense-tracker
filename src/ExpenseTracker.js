import { useState, useMemo } from 'react';
import { categoryColors } from '../constants/categories';
import { getTransactionType, parseCategory } from '../utils/helpers';

export const useExpenseTracker = () => {
  const [transactions, setTransactions] = useState([]);
  const [balances, setBalances] = useState({});
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [masterData, setMasterData] = useState({
    categories: [], // Will be loaded dynamically from Google Sheets
    accounts: []
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    description: '',
    account: '',
    tag: ''
  });

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
  const [validationErrors, setValidationErrors] = useState({});

  // Helper function to generate category colors dynamically
  const getCategoryColor = (mainCategory) => {
    // Use predefined colors if available, otherwise generate a consistent color
    if (categoryColors[mainCategory]) {
      return categoryColors[mainCategory];
    }
    
    // Generate a consistent color based on category name
    let hash = 0;
    for (let i = 0; i < mainCategory.length; i++) {
      hash = mainCategory.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert hash to HSL color (good saturation and lightness)
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 55%)`;
  };

  // Computed values
  const totalBalance = useMemo(() => {
    return Object.values(balances).reduce((sum, balance) => sum + balance, 0);
  }, [balances]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
  }, [transactions, currentMonth, currentYear]);

  const currentMonthIncome = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const currentMonthExpenses = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const savingsRate = useMemo(() => {
    if (currentMonthIncome === 0) return 0;
    return ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 100;
  }, [currentMonthIncome, currentMonthExpenses]);

  // Top categories using main category for grouping
  const topCategories = useMemo(() => {
    const categoryTotals = {};
    currentMonthTransactions
      .filter(t => t.type === 'Expense')
      .forEach(t => {
        const categoryData = parseCategory(t.category);
        const main = categoryData.main || 'Unknown';
        categoryTotals[main] = (categoryTotals[main] || 0) + t.amount;
      });
    
    return Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  }, [currentMonthTransactions]);

  // Pie chart data with dynamic colors
  const pieChartData = useMemo(() => {
    return topCategories.map(([category, amount]) => ({
      name: category,
      value: amount,
      color: getCategoryColor(category)
    }));
  }, [topCategories]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = !filters.search || 
        transaction.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        (transaction.tag && transaction.tag.toLowerCase().includes(filters.search.toLowerCase()));
      
      const matchesCategory = !filters.category || 
        parseCategory(transaction.category).main === filters.category;
      
      const matchesAccount = !filters.account || transaction.account === filters.account;
      const matchesType = !filters.type || transaction.type === filters.type;
      
      const transactionDate = new Date(transaction.date);
      const matchesMonth = !filters.month || transactionDate.getMonth() + 1 === parseInt(filters.month);
      const matchesYear = !filters.year || transactionDate.getFullYear() === parseInt(filters.year);
      
      const matchesDateFrom = !filters.dateFrom || transactionDate >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || transactionDate <= new Date(filters.dateTo);
      
      return matchesSearch && matchesCategory && matchesAccount && matchesType && 
             matchesMonth && matchesYear && matchesDateFrom && matchesDateTo;
    });
  }, [transactions, filters]);

  // Get unique main categories for filtering (from actual transactions)
  const uniqueMainCategories = useMemo(() => {
    const categories = new Set();
    transactions.forEach(t => {
      const categoryData = parseCategory(t.category);
      if (categoryData.main) {
        categories.add(categoryData.main);
      }
    });
    return Array.from(categories).sort();
  }, [transactions]);

  // Actions
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

  const resetForm = () => {
    setEditingTransaction(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: '',
      description: '',
      account: masterData.accounts[0] || '',
      tag: ''
    });
    setValidationErrors({});
  };

  // Validation function
  const validateForm = (data) => {
    const errors = {};
    
    if (!data.date) errors.date = 'Date is required';
    if (!data.amount || parseFloat(data.amount) <= 0) errors.amount = 'Valid amount is required';
    if (!data.category) errors.category = 'Category is required';
    if (!data.description.trim()) errors.description = 'Description is required';
    if (!data.account) errors.account = 'Account is required';
    
    return {
      errors,
      isValid: Object.keys(errors).length === 0
    };
  };

  const addTransaction = async (addToSheets) => {
    const { errors, isValid } = validateForm(formData);
    
    if (!isValid) {
      setValidationErrors(errors);
      return false;
    }

    const newTransaction = {
      id: editingTransaction ? editingTransaction.id : `local_${Date.now()}_${Math.random()}`,
      date: formData.date,
      amount: parseFloat(formData.amount),
      category: formData.category, // This will be the combined format from dropdown
      description: formData.description.trim(),
      account: formData.account,
      tag: formData.tag.trim(),
      type: getTransactionType(formData.category),
      synced: false,
      source: 'local',
      sheetRow: editingTransaction?.sheetRow // Preserve the sheet row for edits
    };

    // Try to sync to Google Sheets if function provided
    if (addToSheets) {
      const syncSuccess = await addToSheets(newTransaction);
      if (syncSuccess) {
        newTransaction.synced = true;
        newTransaction.source = 'sheets';
      }
    }

    // Update local state
    if (editingTransaction) {
      console.log('📝 Updating local transaction:', editingTransaction.id, 'with sheetRow:', editingTransaction.sheetRow);
      setTransactions(prev => prev.map(t => 
        t.id === editingTransaction.id ? newTransaction : t
      ));
    } else {
      setTransactions(prev => [...prev, newTransaction]);
    }

    resetForm();
    return true;
  };

  const editTransaction = (transaction) => {
    console.log('✏️ Editing transaction:', transaction.id, 'sheetRow:', transaction.sheetRow);
    setEditingTransaction(transaction);
    setFormData({
      date: transaction.date,
      amount: transaction.amount.toString(),
      category: transaction.category, // This should be the combined format
      description: transaction.description,
      account: transaction.account,
      tag: transaction.tag || ''
    });
  };

  const deleteTransaction = (transactionId) => {
    console.log('🏠 ExpenseTracker: deleteTransaction called with ID:', transactionId);
    console.log('🏠 ExpenseTracker: Current transactions count:', transactions.length);
    
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    console.log('🏠 ExpenseTracker: Transaction to delete:', transactionToDelete);
    
    if (!transactionToDelete) {
      console.error('❌ ExpenseTracker: Transaction not found for deletion:', transactionId);
      return false;
    }
    
    const updatedTransactions = transactions.filter(t => t.id !== transactionId);
    console.log('🏠 ExpenseTracker: Transactions after deletion:', {
      before: transactions.length,
      after: updatedTransactions.length,
      removed: transactions.length - updatedTransactions.length
    });
    
    setTransactions(updatedTransactions);
    console.log('✅ ExpenseTracker: Transaction deleted from local state');
    return true;
  };

  // Update master data with categories from Google Sheets
  const updateMasterData = (newData) => {
    setMasterData(prev => ({
      ...prev,
      ...newData
    }));
  };

  return {
    // State
    transactions,
    setTransactions,
    balances,
    setBalances,
    masterData,
    setMasterData,
    updateMasterData, // New function to update master data
    formData,
    setFormData,
    editingTransaction,
    setEditingTransaction,
    validationErrors,
    setValidationErrors,
    filters,
    setFilters,
    showFilters,
    setShowFilters,
    balanceVisible,
    setBalanceVisible,
    
    // Computed
    totalBalance,
    currentMonthIncome,
    currentMonthExpenses,
    savingsRate,
    topCategories,
    pieChartData,
    filteredTransactions,
    uniqueMainCategories, // For filter dropdown
    getCategoryColor, // Helper for consistent colors
    
    // Actions
    clearFilters,
    resetForm,
    addTransaction,
    editTransaction,
    deleteTransaction
  };
};
