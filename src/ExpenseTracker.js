import React, { useState, useEffect } from 'react';
import { PlusCircle, BarChart3, CreditCard, TrendingUp, Calendar, Filter, Search, DollarSign, ArrowUpDown, Wallet, Eye, EyeOff, ChevronRight, Sparkles, Target, PieChart, Activity, TrendingDown, AlertTriangle, CheckCircle, ArrowUp, ArrowDown, Zap, Star, Award } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Area, AreaChart } from 'recharts';

const ExpenseTracker = () => {
  // Categories from your Google Sheet
  const categories = {
    'Food': ['Food'],
    'Social Life': ['Social Life'],
    'Entertainment': ['Entertainment'],
    'Fuel': ['Eon', 'Honda City', 'Aviator'],
    'Culture': ['Culture'],
    'Household': ['Grocery', 'Laundry', 'House Help', 'Appliances', 'Bills'],
    'Apparel': ['Apparel'],
    'Beauty': ['Beauty'],
    'Health': ['Preventive', 'Medical'],
    'Education': ['Education'],
    'Transportation': ['Maintenance', 'Insurance'],
    'Vyomi': ['Vyomi'],
    'Vacation': ['Family', 'Own'],
    'Subscriptions': ['Subscriptions'],
    'Misc': ['Misc'],
    'Income': ['Income']
  };

  const categoryColors = {
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
  };

  const accounts = ['Kotak', 'ICICI Credit Card', 'HDFC Credit Card'];
  const transactionTypes = ['Expense', 'Income', 'Transfer'];

  // Sample data for better demo
  const [transactions, setTransactions] = useState([
    { id: 1, date: '2025-01-15', amount: 1200, category: 'Food', subcategory: 'Food', description: 'Lunch at restaurant', account: 'Kotak', type: 'Expense', tag: 'dining' },
    { id: 2, date: '2025-01-14', amount: 5200, category: 'Fuel', subcategory: 'Honda City', description: 'Petrol fill-up', account: 'Kotak', type: 'Expense', tag: 'fuel' },
    { id: 3, date: '2025-01-13', amount: 50000, category: 'Income', subcategory: 'Income', description: 'Salary credit', account: 'Kotak', type: 'Income', tag: 'salary' },
    { id: 4, date: '2025-01-12', amount: 8500, category: 'Household', subcategory: 'Grocery', description: 'Monthly groceries', account: 'Kotak', type: 'Expense', tag: 'grocery' },
    { id: 5, date: '2025-01-11', amount: 2500, category: 'Entertainment', subcategory: 'Entertainment', description: 'Movie tickets', account: 'ICICI Credit Card', type: 'Expense', tag: 'movies' },
    { id: 6, date: '2025-01-10', amount: 15000, category: 'Education', subcategory: 'Education', description: 'Course fee', account: 'Kotak', type: 'Expense', tag: 'learning' },
  ]);

  const [balances, setBalances] = useState({
    'Kotak': 45890.7,
    'ICICI Credit Card': -2500,
    'HDFC Credit Card': 0
  });

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    subcategory: '',
    description: '',
    account: 'Kotak',
    type: 'Expense',
    tag: ''
  });

  const [currentView, setCurrentView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Add transaction
  const addTransaction = () => {
    if (!formData.amount || !formData.category || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    const newTransaction = {
      id: Date.now(),
      ...formData,
      amount: parseFloat(formData.amount),
      timestamp: new Date().toISOString()
    };

    setTransactions([newTransaction, ...transactions]);

    // Update balance
    const amount = parseFloat(formData.amount);
    setBalances(prev => ({
      ...prev,
      [formData.account]: formData.type === 'Income' 
        ? prev[formData.account] + amount
        : prev[formData.account] - amount
    }));

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: '',
      subcategory: '',
      description: '',
      account: 'Kotak',
      type: 'Expense',
      tag: ''
    });

    setIsFormVisible(false);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate analytics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentMonthTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
  });

  const lastMonthTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === lastMonth && tDate.getFullYear() === lastMonthYear;
  });

  const currentMonthExpenses = currentMonthTransactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const lastMonthExpenses = lastMonthTransactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseChange = lastMonthExpenses > 0 ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;

  const currentMonthIncome = currentMonthTransactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);

  // Category breakdown for charts
  const categoryTotals = {};
  currentMonthTransactions.forEach(t => {
    if (t.type === 'Expense') {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }
  });

  const pieChartData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
    color: categoryColors[name]
  }));

  // Weekly spending trend
  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.toDateString() === date.toDateString() && t.type === 'Expense';
    });
    const total = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
    weeklyData.push({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      amount: total,
      date: date.toISOString().split('T')[0]
    });
  }

  const totalBalance = Object.values(balances).reduce((sum, balance) => sum + balance, 0);
  const savingsRate = currentMonthIncome > 0 ? ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 100 : 0;

  // Top spending categories
  const topCategories = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const QuickAddButton = () => (
    <div className="fixed bottom-8 right-8 z-50">
      <button
        onClick={() => setIsFormVisible(true)}
        className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 border-2 border-white/20"
        style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        <PlusCircle className="w-6 h-6" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity duration-300 -z-10"></div>
      </button>
    </div>
  );

  const QuickAddModal = () => (
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
                  <h2 className="text-2xl font-bold text-gray-900">Add Transaction</h2>
                  <p className="text-gray-500">Track your expenses with ease</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormVisible(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Amount (₹)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
                >
                  {transactionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Account</label>
                <select
                  value={formData.account}
                  onChange={(e) => setFormData({...formData, account: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
                >
                  {accounts.map(account => (
                    <option key={account} value={account}>{account}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value, subcategory: ''})}
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
                >
                  <option value="">Select Category</option>
                  {Object.keys(categories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Subcategory</label>
                <select
                  value={formData.subcategory}
                  onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
                  disabled={!formData.category}
                >
                  <option value="">Select Subcategory</option>
                  {formData.category && categories[formData.category].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-gray-700">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
                  placeholder="Enter description..."
                />
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
            </div>
            
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => setIsFormVisible(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={addTransaction}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/30 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400/30 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-pink-400/30 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

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
                <p className="text-gray-600 font-medium">Smart financial insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
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
              Transactions
            </button>
          </nav>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                      Active
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
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                      expenseChange < 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                    }`}>
                      {expenseChange < 0 ? <ArrowDown className="w-3 h-3 inline mr-1" /> : <ArrowUp className="w-3 h-3 inline mr-1" />}
                      {Math.abs(expenseChange).toFixed(1)}%
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

            {/* Weekly Spending Trend */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-white/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Weekly Spending Trend</h3>
                  <p className="text-gray-600">Your expense pattern over the last 7 days</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl">
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: 'none', 
                        borderRadius: '12px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                      }}
                      formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#667eea" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorAmount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
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
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
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

            {/* Smart Insights */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-white/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Smart Insights</h3>
                  <p className="text-gray-600">AI-powered financial recommendations</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <span className="font-semibold text-green-900">Good Job!</span>
                  </div>
                  <p className="text-sm text-green-700">Your savings rate is healthy at {savingsRate.toFixed(1)}%</p>
                </div>
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    <span className="font-semibold text-blue-900">Trend Alert</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {expenseChange < 0 ? 'Expenses decreased' : 'Expenses increased'} by {Math.abs(expenseChange).toFixed(1)}% vs last month
                  </p>
                </div>
                <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <Target className="w-6 h-6 text-purple-600" />
                    <span className="font-semibold text-purple-900">Top Expense</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    {topCategories[0] ? `${topCategories[0][0]} is your biggest expense` : 'No expenses recorded'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics View */}
        {currentView === 'analytics' && (
          <div className="space-y-8">
            {/* Category Distribution Pie Chart */}
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

            {/* Monthly Comparison */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-white/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Monthly Comparison</h3>
                  <p className="text-gray-600">Current vs previous month breakdown</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">This Month</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                      <span className="text-green-700 font-medium">Income</span>
                      <span className="text-green-900 font-bold">₹{currentMonthIncome.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                      <span className="text-red-700 font-medium">Expenses</span>
                      <span className="text-red-900 font-bold">₹{currentMonthExpenses.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                      <span className="text-blue-700 font-medium">Net Savings</span>
                      <span className="text-blue-900 font-bold">₹{(currentMonthIncome - currentMonthExpenses).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Last Month</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700 font-medium">Income</span>
                      <span className="text-gray-900 font-bold">₹0</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700 font-medium">Expenses</span>
                      <span className="text-gray-900 font-bold">₹{lastMonthExpenses.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700 font-medium">Net Savings</span>
                      <span className="text-gray-900 font-bold">₹{(0 - lastMonthExpenses).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        {currentView === 'transactions' && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50">
            <div className="p-8 border-b border-gray-200/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
                    <p className="text-gray-600">Complete record of all your transactions</p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">All Categories</option>
                    {Object.keys(categories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
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
                    <th className="px-8 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {filteredTransactions.map((transaction, index) => (
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
                          <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: categoryColors[transaction.category] }}></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{transaction.category}</div>
                            {transaction.subcategory && transaction.subcategory !== transaction.category && (
                              <div className="text-xs text-gray-500">{transaction.subcategory}</div>
                            )}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredTransactions.length === 0 && (
              <div className="text-center py-16">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-6">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-xl font-medium">No transactions found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Add Button & Modal */}
      <QuickAddButton />
      <QuickAddModal />
    </div>
  );
};

export default ExpenseTracker;
