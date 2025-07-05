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
    
    // Actions
    clearFilters,
    resetForm
  };
};
