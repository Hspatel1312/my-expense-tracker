import { useState, useMemo } from 'react';
import { masterCategories, categoryColors } from '../constants/categories';
import { getTransactionType, parseCategory, validateForm } from '../utils/helpers';

export const useExpenseTracker = () => {
  const [transactions, setTransactions] = useState([]);
  const [balances, setBalances] = useState({});
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [masterData, setMasterData] = useState({
    categories: masterCategories,
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

  // Computed values
  const totalBalance = useMemo(() => {
    return Object.values(balances).reduce((sum, balance) => sum + balance, 0);
  }, [balances]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Debug current month calculations
  const currentMonthTransactions = useMemo(() => {
    const filtered = transactions.filter(t => {
      const date = new Date(t.date);
      const isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      
      if (isCurrentMonth) {
        console.log(`🔍 HOOK - Current month transaction: ${t.description} (${t.type}) - ₹${t.amount}`);
      }
      
      return isCurrentMonth;
    });
    
    console.log(`🔍 HOOK - Current month transactions (${currentMonth + 1}/${currentYear}):`, filtered.length);
    return filtered;
  }, [transactions, currentMonth, currentYear]);

  const currentMonthIncome = useMemo(() => {
    const income = currentMonthTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    console.log('🔍 HOOK - Current month income:', income);
    return income;
  }, [currentMonthTransactions]);

  const currentMonthExpenses = useMemo(() => {
    const expenses = currentMonthTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    console.log('🔍 HOOK - Current month expenses:', expenses);
    return expenses;
  }, [currentMonthTransactions]);

  const savingsRate = useMemo(() => {
    if (currentMonthIncome === 0) return 0;
    const rate = ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 100;
    console.log('🔍 HOOK - Savings rate:', rate);
    return rate;
  }, [currentMonthIncome, currentMonthExpenses]);

  // Fixed topCategories calculation with better debugging
  const topCategories = useMemo(() => {
    console.log('🔍 HOOK - Calculating top categories...');
    
    // Get current month expense transactions
    const currentMonthExpenseTransactions = currentMonthTransactions.filter(t => t.type === 'Expense');
    
    console.log('🔍 HOOK - Current month expense transactions:', currentMonthExpenseTransactions.length);
    
    // Use current month expenses, or fall back to recent if none
    let transactionsToUse = currentMonthExpenseTransactions;
    
    if (transactionsToUse.length === 0) {
      console.log('🔍 HOOK - No current month expenses, using recent...');
      // Get expenses from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      transactionsToUse = transactions.filter(t => {
        const date = new Date(t.date);
        return t.type === 'Expense' && date >= thirtyDaysAgo;
      });
      
      console.log('🔍 HOOK - Recent expenses (30 days):', transactionsToUse.length);
    }
    
    const categoryTotals = {};
    
    transactionsToUse.forEach(t => {
      const categoryData = parseCategory(t.category);
      const main = categoryData.main || 'Unknown';
      categoryTotals[main] = (categoryTotals[main] || 0) + t.amount;
      
      console.log(`🔍 HOOK - Adding ₹${t.amount} to "${main}" category (now: ₹${categoryTotals[main]})`);
    });
    
    const result = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    console.log('🔍 HOOK - Final top categories:', result);
    return result;
  }, [currentMonthTransactions, transactions]);

  const pieChartData = useMemo(() => {
    return topCategories.map(([category, amount]) => ({
      name: category,
      value: amount,
      color: categoryColors[category] || '#9CA3AF'
    }));
  }, [topCategories]);

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
      category: formData.category,
      description: formData.description.trim(),
      account: formData.account,
      tag: formData.tag.trim(),
      type: getTransactionType(formData.category),
      synced: false,
      source: 'local',
      sheetRow: editingTransaction?.sheetRow
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
    setEditingTransaction(transaction);
    setFormData({
      date: transaction.date,
      amount: transaction.amount.toString(),
      category: transaction.category,
      description: transaction.description,
      account: transaction.account,
      tag: transaction.tag || ''
    });
  };

  const deleteTransaction = (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return false;
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    return true;
  };

  return {
    // State
    transactions,
    setTransactions,
    balances,
    setBalances,
    masterData,
    setMasterData,
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
    currentMonthTransactions, // Add this for debugging
    
    // Actions
    clearFilters,
    resetForm,
    addTransaction,
    editTransaction,
    deleteTransaction
  };
};
