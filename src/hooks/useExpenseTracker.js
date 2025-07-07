import { useState, useMemo } from 'react';
import { masterCategories, categoryColors } from '../constants/categories';
import { parseCategory, validateForm } from '../utils/helpers';

export const useExpenseTracker = () => {
  const [transactions, setTransactions] = useState([]);
  const [balances, setBalances] = useState({});
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // 🔥 UPDATED: Initialize with fallback categories, will be updated from Google Sheets
  const [masterData, setMasterData] = useState({
    categories: masterCategories, // Will be replaced with Google Sheets data
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

  // Enhanced transaction type detection based on categories
  const getTransactionTypeFromCategory = (category, categoriesList = masterData.categories) => {
    if (!category) return 'Expense';
    
    const categoryLower = category.toLowerCase();
    
    // Check if this category exists in our categories list and contains income-related terms
    const categoryInfo = categoriesList.find(cat => 
      cat.combined.toLowerCase() === categoryLower ||
      cat.main.toLowerCase() === categoryLower ||
      cat.sub.toLowerCase() === categoryLower
    );
    
    // Check for income keywords in the category
    if (categoryLower.includes('income') || 
        categoryLower.includes('salary') || 
        categoryLower.includes('reload') ||
        categoryLower.includes('refund') ||
        categoryLower.includes('bonus') ||
        categoryLower.includes('dividend') ||
        (categoryLower.includes('others') && categoryLower.includes('income'))) {
      return 'Income';
    }
    
    // Check for transfer keywords
    if (categoryLower.includes('transfer') || 
        categoryLower.includes('withdrawal') ||
        categoryLower.includes('deposit')) {
      return 'Transfer';
    }
    
    // Default to Expense for all other categories
    return 'Expense';
  };

  // Computed values
  const totalBalance = useMemo(() => {
    return Object.values(balances).reduce((sum, balance) => sum + balance, 0);
  }, [balances]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTransactions = useMemo(() => {
    const filtered = transactions.filter(t => {
      const date = new Date(t.date);
      const isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      return isCurrentMonth;
    });
    
    return filtered;
  }, [transactions, currentMonth, currentYear]);

  const currentMonthIncome = useMemo(() => {
    const income = currentMonthTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return income;
  }, [currentMonthTransactions]);

  const currentMonthExpenses = useMemo(() => {
    const expenses = currentMonthTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return expenses;
  }, [currentMonthTransactions]);

  const savingsRate = useMemo(() => {
    if (currentMonthIncome === 0) return 0;
    const rate = ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 100;
    return rate;
  }, [currentMonthIncome, currentMonthExpenses]);

  // Fixed topCategories calculation
  const topCategories = useMemo(() => {
    // Get current month expense transactions
    const currentMonthExpenseTransactions = currentMonthTransactions.filter(t => t.type === 'Expense');
    
    // Use current month expenses, or fall back to recent if none
    let transactionsToUse = currentMonthExpenseTransactions;
    
    if (transactionsToUse.length === 0) {
      // Get expenses from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      transactionsToUse = transactions.filter(t => {
        const date = new Date(t.date);
        return t.type === 'Expense' && date >= thirtyDaysAgo;
      });
    }
    
    const categoryTotals = {};
    
    transactionsToUse.forEach(t => {
      const categoryData = parseCategory(t.category);
      const main = categoryData.main || 'Unknown';
      categoryTotals[main] = (categoryTotals[main] || 0) + t.amount;
    });
    
    const result = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
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

  // 🔥 CRITICAL FIX: Enhanced addTransaction with detailed logging and proper sync
  const addTransaction = async (sheetsOperations) => {
    const { errors, isValid } = validateForm(formData);
    
    if (!isValid) {
      setValidationErrors(errors);
      return false;
    }

    // Determine transaction type from category using Google Sheets logic
    const transactionType = sheetsOperations?.getTransactionTypeFromCategory 
      ? sheetsOperations.getTransactionTypeFromCategory(formData.category)
      : getTransactionTypeFromCategory(formData.category);

    const newTransaction = {
      id: editingTransaction ? editingTransaction.id : `local_${Date.now()}_${Math.random()}`,
      date: formData.date,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description.trim(),
      account: formData.account,
      tag: formData.tag.trim(),
      type: transactionType,
      synced: false,
      source: 'local',
      sheetRow: editingTransaction?.sheetRow // 🔥 CRITICAL: Preserve sheet row for edits
    };

    console.log('📝 🔥 TRANSACTION PROCESSING:', {
      isEdit: !!editingTransaction,
      originalTransaction: editingTransaction,
      newTransaction: newTransaction,
      hasSheetRow: !!newTransaction.sheetRow,
      sheetsConnected: sheetsOperations ? 'YES' : 'NO'
    });

    // Handle Google Sheets operations
    if (sheetsOperations) {
      let syncSuccess = false;
      
      if (editingTransaction && editingTransaction.sheetRow) {
        // 🔥 EDIT: Update existing transaction in sheets
        console.log('📝 🔥 EDITING transaction - calling updateTransactionInSheets');
        console.log('📝 🔥 Edit data:', {
          sheetRow: newTransaction.sheetRow,
          category: newTransaction.category,
          amount: newTransaction.amount,
          description: newTransaction.description
        });
        
        syncSuccess = await sheetsOperations.updateTransactionInSheets(newTransaction);
        console.log('📝 🔥 Edit sync result:', syncSuccess);
      } else {
        // 🔥 ADD: Add new transaction to sheets
        console.log('📝 🔥 ADDING new transaction - calling addTransactionToSheets');
        syncSuccess = await sheetsOperations.addTransactionToSheets(newTransaction);
        console.log('📝 🔥 Add sync result:', syncSuccess);
      }
      
      if (syncSuccess) {
        newTransaction.synced = true;
        newTransaction.source = 'sheets';
        console.log('✅ 🔥 Transaction synced to sheets successfully');
      } else {
        console.log('⚠️ 🔥 Failed to sync to sheets, keeping local copy');
      }
    }

    // Update local state
    if (editingTransaction) {
      // 🔥 EDIT: Update existing transaction
      setTransactions(prev => prev.map(t => 
        t.id === editingTransaction.id ? newTransaction : t
      ));
      console.log('✅ 🔥 Transaction updated locally');
    } else {
      // 🔥 ADD: Add new transaction
      setTransactions(prev => [...prev, newTransaction]);
      console.log('✅ 🔥 Transaction added locally');
    }

    resetForm();
    return true;
  };

  const editTransaction = (transaction) => {
    console.log('📝 🔥 SETTING UP EDIT for transaction:', transaction);
    console.log('📝 🔥 Sheet row:', transaction.sheetRow);
    console.log('📝 🔥 Transaction source:', transaction.source);
    
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

  // Enhanced deleteTransaction with sheets sync
  const deleteTransaction = async (transactionId, sheetsOperations) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return false;
    }

    // Find the transaction to delete
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) {
      console.error('❌ Transaction not found for deletion:', transactionId);
      return false;
    }

    console.log('🗑️ Deleting transaction:', transactionToDelete);

    // Handle Google Sheets deletion
    if (sheetsOperations && transactionToDelete.source === 'sheets') {
      console.log('📝 Deleting from Google Sheets...');
      const deleteSuccess = await sheetsOperations.deleteTransactionFromSheets(transactionToDelete);
      
      if (deleteSuccess) {
        console.log('✅ Transaction deleted from sheets successfully');
      } else {
        console.log('⚠️ Failed to delete from sheets, but removing locally');
      }
    }

    // Remove from local state
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    console.log('✅ Transaction deleted locally');
    
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
    currentMonthTransactions,
    
    // Actions
    clearFilters,
    resetForm,
    addTransaction,
    editTransaction,
    deleteTransaction,
    getTransactionTypeFromCategory
  };
};
