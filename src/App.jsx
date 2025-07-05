import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, BarChart3, CreditCard, PieChart, Activity, AlertTriangle, X, RefreshCw, CheckCircle, Cloud, Sparkles, DollarSign, TrendingUp, ArrowUpDown, Target, Star, Award, Wallet, Search, Edit, Trash2, Filter } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import Header from './components/Header';
import { useExpenseTracker } from './hooks/useExpenseTracker';
import { useGoogleSheets } from './hooks/useGoogleSheets';
import { categoryColors } from './constants/categories';
import { parseCategory, getTransactionType } from './utils/helpers';

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

  // Filtered data for dropdowns
  const filteredCategories = expenseTracker.masterData.categories.filter(cat =>
    cat.combined.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredAccounts = expenseTracker.masterData.accounts.filter(acc =>
    acc.toLowerCase().includes(accountSearch.toLowerCase())
  );

  // Sync data when Google Sheets connects
  const syncData = useCallback(async () => {
    if (googleSheets.sheetsConfig.isConnected) {
      try {
        const data = await googleSheets.manualSync();
        if (data) {
          expenseTracker.setBalances(data.balances);
          expenseTracker.setMasterData(prev => ({ 
            ...prev, 
            accounts: data.accounts 
          }));
          expenseTracker.setTransactions(data.transactions);
        }
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }, [googleSheets.sheetsConfig.isConnected, googleSheets.manualSync, expenseTracker.setBalances, expenseTracker.setMasterData, expenseTracker.setTransactions]);

  useEffect(() => {
    syncData();
  }, [syncData]);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.category-dropdown')) {
        setShowCategoryDropdown(false);
      }
      if (!event.target.closest('.account-dropdown')) {
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Loading Overlay */}
      {googleSheets.isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-lg font-medium">
                {expenseTracker.editingTransaction ? 'Updating transaction...' : 'Syncing with Google Sheets...'}
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
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <Header 
        transactions={expenseTracker.transactions}
        sheetsConfig={googleSheets.sheetsConfig}
        gapiLoaded={googleSheets.gapiLoaded}
        balanceVisible={expenseTracker.balanceVisible}
        totalBalance={expenseTracker.totalBalance}
        setBalanceVisible={expenseTracker.setBalanceVisible}
        setShowSyncModal={setShowSyncModal}
      />

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
              Transactions ({expenseTracker.filteredTransactions.length})
            </button>
          </nav>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sync Status Banner */}
        {googleSheets.syncStatus !== 'idle' && (
          <div className={`mb-6 p-4 rounded-xl border ${
            googleSheets.syncStatus === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            googleSheets.syncStatus === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center space-x-3">
              {googleSheets.syncStatus === 'syncing' && <RefreshCw className="w-5 h-5 animate-spin" />}
              {googleSheets.syncStatus === 'success' && <CheckCircle className="w-5 h-5" />}
              {googleSheets.syncStatus === 'error' && <AlertTriangle className="w-5 h-5" />}
              <span className="font-medium">
                {googleSheets.syncStatus === 'syncing' && 'Syncing with Google Sheets...'}
                {googleSheets.syncStatus === 'success' && 'Successfully synced with Google Sheets!'}
                {googleSheets.syncStatus === 'error' && 'Failed to sync with Google Sheets. Please try again.'}
              </span>
            </div>
          </div>
        )}

        {/* Dashboard View */}
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
                      {googleSheets.sheetsConfig.isConnected ? 'Synced' : 'Local'}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {expenseTracker.balanceVisible ? `₹${expenseTracker.totalBalance.toLocaleString('en-IN')}` : '••••••'}
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
                  <p className="text-2xl font-bold text-gray-900">₹{expenseTracker.currentMonthIncome.toLocaleString('en-IN')}</p>
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
                  <p className="text-2xl font-bold text-gray-900">₹{expenseTracker.currentMonthExpenses.toLocaleString('en-IN')}</p>
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
                      expenseTracker.savingsRate > 20 ? 'text-green-600 bg-green-100' : 'text-orange-600 bg-orange-100'
                    }`}>
                      {expenseTracker.savingsRate > 20 ? <Star className="w-3 h-3 inline mr-1" /> : <AlertTriangle className="w-3 h-3 inline mr-1" />}
                      {expenseTracker.savingsRate.toFixed(1)}%
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Savings Rate</p>
                  <p className="text-2xl font-bold text-gray-900">₹{(expenseTracker.currentMonthIncome - expenseTracker.currentMonthExpenses).toLocaleString('en-IN')}</p>
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
                  {Object.entries(expenseTracker.balances).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        {googleSheets.gapiLoaded ? 'No accounts found. Connect to Google Sheets to load account balances.' : 'Loading Google API...'}
                      </p>
                    </div>
                  ) : (
                    Object.entries(expenseTracker.balances).map(([account, balance]) => (
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
                              {expenseTracker.balanceVisible ? `₹${Math.abs(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '••••••'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Categories */}
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
                  {expenseTracker.topCategories.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No expenses found for this month.</p>
                    </div>
                  ) : (
                    expenseTracker.topCategories.map(([category, amount], index) => {
                      const percentage = expenseTracker.currentMonthExpenses > 0 ? (amount / expenseTracker.currentMonthExpenses) * 100 : 0;
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
                    })
                  )}
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
              {expenseTracker.pieChartData.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-6">
                    <PieChart className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-xl font-medium">No expense data available</p>
                  <p className="text-gray-400 text-sm mt-2">Add some expenses to see the distribution</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={expenseTracker.pieChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {expenseTracker.pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    {expenseTracker.pieChartData.map((item) => (
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
              )}
            </div>
          </div>
        )}

        {/* Transactions View */}
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
                      Showing {expenseTracker.filteredTransactions.length} of {expenseTracker.transactions.length} transactions
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => expenseTracker.setShowFilters(!expenseTracker.showFilters)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-200 ${
                      expenseTracker.showFilters ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                  </button>
                  {Object.values(expenseTracker.filters).some(v => v !== '') && (
                    <button
                      onClick={expenseTracker.clearFilters}
                      className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Filters */}
              {expenseTracker.showFilters && (
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
                          value={expenseTracker.filters.search}
                          onChange={(e) => expenseTracker.setFilters({...expenseTracker.filters, search: e.target.value})}
                          className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={expenseTracker.filters.category}
                        onChange={(e) => expenseTracker.setFilters({...expenseTracker.filters, category: e.target.value})}
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
                        value={expenseTracker.filters.account}
                        onChange={(e) => expenseTracker.setFilters({...expenseTracker.filters, account: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Accounts</option>
                        {expenseTracker.masterData.accounts.map(acc => (
                          <option key={acc} value={acc}>{acc}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={expenseTracker.filters.type}
                        onChange={(e) => expenseTracker.setFilters({...expenseTracker.filters, type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Types</option>
                        <option value="Expense">Expense</option>
                        <option value="Income">Income</option>
                        <option value="Transfer">Transfer</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Account</th>
                   <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                   <th className="px-8 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                   <th className="px-8 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200/50">
                 {expenseTracker.filteredTransactions.map((transaction) => {
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
                       <td className="px-8 py-5 whitespace-nowrap text-sm text-right font-bold">
                         <span className={`${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'} group-hover:scale-105 transition-transform duration-200 inline-block`}>
                           {transaction.type === 'Income' ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                         </span>
                       </td>
                       <td className="px-8 py-5 whitespace-nowrap text-center">
                         <div className="flex items-center justify-center space-x-2">
                           <button
                             onClick={() => handleEditTransaction(transaction)}
                             className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                             title="Edit"
                           >
                             <Edit className="w-4 h-4" />
                           </button>
                           <button
                             onClick={() => expenseTracker.deleteTransaction(transaction.id)}
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
           {expenseTracker.filteredTransactions.length === 0 && (
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

     {/* Add/Edit Transaction Modal */}
     {isFormVisible && (
       <div className="fixed inset-0 z-50 transition-all duration-300 opacity-100 visible">
         <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsFormVisible(false)}></div>
         <div className="flex items-center justify-center min-h-screen p-4">
           <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl transform transition-all duration-500 scale-100 translate-y-0 border border-white/20">
             <div className="p-8">
               <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center space-x-3">
                   <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl">
                     <Sparkles className="w-6 h-6 text-white" />
                   </div>
                   <div>
                     <h2 className="text-2xl font-bold text-gray-900">
                       {expenseTracker.editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                     </h2>
                     <p className="text-gray-500">
                       {googleSheets.sheetsConfig.isConnected ? 'Will sync to Google Sheets automatically' : 'Will be saved locally'}
                     </p>
                   </div>
                 </div>
                 <button
                   onClick={() => {
                     setIsFormVisible(false);
                     expenseTracker.resetForm();
                     setCategorySearch('');
                     setAccountSearch('');
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
                     value={expenseTracker.formData.date}
                     onChange={(e) => expenseTracker.setFormData({...expenseTracker.formData, date: e.target.value})}
                     className={`w-full px-4 py-3 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                       expenseTracker.validationErrors.date ? 'border-red-300' : 'border-gray-200'
                     }`}
                   />
                   {expenseTracker.validationErrors.date && (
                     <p className="text-red-500 text-xs mt-1">{expenseTracker.validationErrors.date}</p>
                   )}
                 </div>
                 
                 <div className="space-y-2">
                   <label className="text-sm font-semibold text-gray-700">Amount (₹)</label>
                   <input
                     type="number"
                     value={expenseTracker.formData.amount}
                     onChange={(e) => expenseTracker.setFormData({...expenseTracker.formData, amount: e.target.value})}
                     className={`w-full px-4 py-3 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                       expenseTracker.validationErrors.amount ? 'border-red-300' : 'border-gray-200'
                     }`}
                     placeholder="0.00"
                   />
                   {expenseTracker.validationErrors.amount && (
                     <p className="text-red-500 text-xs mt-1">{expenseTracker.validationErrors.amount}</p>
                   )}
                 </div>
                 
                 <div className="space-y-2 relative category-dropdown">
                   <label className="text-sm font-semibold text-gray-700">Category</label>
                   <input
                     type="text"
                     value={categorySearch}
                     onChange={(e) => {
                       setCategorySearch(e.target.value);
                       expenseTracker.setFormData({...expenseTracker.formData, category: e.target.value});
                       setShowCategoryDropdown(true);
                     }}
                     onFocus={() => setShowCategoryDropdown(true)}
                     className={`w-full px-4 py-3 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                       expenseTracker.validationErrors.category ? 'border-red-300' : 'border-gray-200'
                     }`}
                     placeholder="Start typing category..."
                   />
                   {expenseTracker.validationErrors.category && (
                     <p className="text-red-500 text-xs mt-1">{expenseTracker.validationErrors.category}</p>
                   )}
                   {showCategoryDropdown && filteredCategories.length > 0 && (
                     <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                       {filteredCategories.slice(0, 10).map((cat, index) => (
                         <button
                           key={index}
                           type="button"
                           onClick={() => {
                             setCategorySearch(cat.combined);
                             expenseTracker.setFormData({...expenseTracker.formData, category: cat.combined});
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
                       expenseTracker.setFormData({...expenseTracker.formData, account: e.target.value});
                       setShowAccountDropdown(true);
                     }}
                     onFocus={() => setShowAccountDropdown(true)}
                     className={`w-full px-4 py-3 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                       expenseTracker.validationErrors.account ? 'border-red-300' : 'border-gray-200'
                     }`}
                     placeholder="Select account..."
                   />
                   {expenseTracker.validationErrors.account && (
                     <p className="text-red-500 text-xs mt-1">{expenseTracker.validationErrors.account}</p>
                   )}
                   {showAccountDropdown && filteredAccounts.length > 0 && (
                     <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg max-h-32 overflow-y-auto z-10">
                       {filteredAccounts.map((acc, index) => (
                         <button
                           key={index}
                           type="button"
                           onClick={() => {
                             setAccountSearch(acc);
                             expenseTracker.setFormData({...expenseTracker.formData, account: acc});
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
                     value={expenseTracker.formData.description}
                     onChange={(e) => expenseTracker.setFormData({...expenseTracker.formData, description: e.target.value})}
                     className={`w-full px-4 py-3 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                       expenseTracker.validationErrors.description ? 'border-red-300' : 'border-gray-200'
                     }`}
                     placeholder="Enter description..."
                   />
                   {expenseTracker.validationErrors.description && (
                     <p className="text-red-500 text-xs mt-1">{expenseTracker.validationErrors.description}</p>
                   )}
                 </div>
                 
                 <div className="space-y-2">
                   <label className="text-sm font-semibold text-gray-700">Tag (Optional)</label>
                   <input
                     type="text"
                     value={expenseTracker.formData.tag}
                     onChange={(e) => expenseTracker.setFormData({...expenseTracker.formData, tag: e.target.value})}
                     className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
                     placeholder="Enter tag..."
                   />
                 </div>
                 
                 {expenseTracker.formData.category && (
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-gray-700">Auto-detected</label>
                     <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                       <div className="flex items-center space-x-2">
                         <span className="text-sm font-medium text-blue-900">
                           Type: {getTransactionType(expenseTracker.formData.category)}
                         </span>
                         <span className="text-xs text-blue-600">
                           • {parseCategory(expenseTracker.formData.category).main} → {parseCategory(expenseTracker.formData.category).sub}
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
                     expenseTracker.resetForm();
                     setCategorySearch('');
                     setAccountSearch('');
                   }}
                   className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleAddTransaction}
                   disabled={googleSheets.isLoading}
                   className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {googleSheets.isLoading ? (
                     <div className="flex items-center space-x-2">
                       <RefreshCw className="w-4 h-4 animate-spin" />
                       <span>{expenseTracker.editingTransaction ? 'Updating...' : 'Adding...'}</span>
                     </div>
                   ) : (
                     expenseTracker.editingTransaction ? 'Update Transaction' : 'Add Transaction'
                   )}
                 </button>
               </div>
             </div>
           </div>
         </div>
       </div>
     )}

     {/* Google Sheets Sync Modal */}
     {showSyncModal && (
       <div className="fixed inset-0 z-50 transition-all duration-300 opacity-100 visible">
         <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setShowSyncModal(false)}></div>
         <div className="flex items-center justify-center min-h-screen p-4">
           <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-500 scale-100 translate-y-0 border border-white/20">
             <div className="p-8">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center space-x-3">
                   <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl">
                     <Cloud className="w-6 h-6 text-white" />
                   </div>
                   <div>
                     <h2 className="text-xl font-bold text-gray-900">Google Sheets Sync</h2>
                     <p className="text-gray-500">Connection status</p>
                   </div>
                 </div>
                 <button
                   onClick={() => setShowSyncModal(false)}
                   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                 <h4 className="font-semibold text-gray-700 mb-2">Status:</h4>
                 <div className="text-sm space-y-1">
                   <div className="flex justify-between">
                     <span>Google API Loaded:</span>
                     <span className={googleSheets.gapiLoaded ? 'text-green-600' : 'text-red-600'}>
                       {googleSheets.gapiLoaded ? '✅ Yes' : '❌ No'}
                     </span>
                   </div>
                   <div className="flex justify-between">
                     <span>Sheets Connected:</span>
                     <span className={googleSheets.sheetsConfig.isConnected ? 'text-green-600' : 'text-red-600'}>
                       {googleSheets.sheetsConfig.isConnected ? '✅ Yes' : '❌ No'}
                     </span>
                   </div>
                   <div className="flex justify-between">
                     <span>Sync Status:</span>
                     <span className={googleSheets.syncStatus === 'success' ? 'text-green-600' : googleSheets.syncStatus === 'error' ? 'text-red-600' : 'text-blue-600'}>
                       {googleSheets.syncStatus}
                     </span>
                   </div>
                   <div className="flex justify-between">
                     <span>Accounts:</span>
                     <span>{expenseTracker.masterData.accounts.length}</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Transactions:</span>
                     <span>{expenseTracker.transactions.length}</span>
                   </div>
                 </div>
               </div>

               {!googleSheets.sheetsConfig.isConnected ? (
                 <div className="space-y-4">
                   <button
                     onClick={googleSheets.connectToGoogleSheets}
                     disabled={googleSheets.isLoading || !googleSheets.gapiLoaded}
                     className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {googleSheets.isLoading ? (
                       <div className="flex items-center justify-center space-x-2">
                         <RefreshCw className="w-4 h-4 animate-spin" />
                         <span>Connecting...</span>
                       </div>
                     ) : !googleSheets.gapiLoaded ? (
                       'Loading Google API...'
                     ) : (
                       'Connect to Google Sheets'
                     )}
                   </button>
                   
                   <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                     <p className="text-sm text-amber-800 mb-2">
                       <strong>Note:</strong>
                     </p>
                     <p className="text-sm text-amber-700">
                       You'll be prompted to sign in to Google and authorize access to your spreadsheet.
                     </p>
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
                           {expenseTracker.transactions.length} transactions loaded • {Object.keys(expenseTracker.balances).length} accounts found
                         </p>
                       </div>
                     </div>
                   </div>
                   
                   <button
                     onClick={googleSheets.manualSync}
                     disabled={googleSheets.syncStatus === 'syncing'}
                     className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                   >
                     {googleSheets.syncStatus === 'syncing' ? (
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
                 </div>
               )}
             </div>
           </div>
         </div>
       </div>
     )}
   </div>
 );
};

export default App;
