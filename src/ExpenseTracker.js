className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"transition-colors"
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
                <p className="text-gray-600 font-medium">Smart financial insights with Google Sheets sync</p>
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
              Transactions
            </button>
          </nav>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard */}
        {currentView === 'dashboard' && (
          <div className="space-y-8">
            {/* Sync Status Banner */}
            {syncStatus !== 'idle' && (
              <div className={`p-4 rounded-xl border ${
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
                    <p className="text-gray-600">
                      {sheetsConfig.isConnected ? 'Synced with Google Sheets' : 'Local storage only'}
                    </p>
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
                    {Object.keys(categoryColors).map(cat => (
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
                    <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-8 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {filteredTransactions.map((transaction, index) => {
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
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Add Button & Modals */}
      <QuickAddButton />
      <QuickAddModal />
      <GoogleSheetsModal />
    </div>
  );
};

export default ExpenseTracker;import React, { useState, useEffect } from 'react';
import { PlusCircle, BarChart3, CreditCard, TrendingUp, Search, DollarSign, ArrowUpDown, Wallet, Eye, EyeOff, ChevronRight, Sparkles, Target, PieChart, Activity, AlertTriangle, CheckCircle, ArrowUp, ArrowDown, Zap, Star, Award, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts';

const ExpenseTracker = () => {
  // Google Sheets Configuration
  const [sheetsConfig, setSheetsConfig] = useState({
    spreadsheetId: '',
    apiKey: '',
    isConnected: false,
    lastSync: null
  });

  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [showSyncModal, setShowSyncModal] = useState(false);

  // Data from your Google Sheets "Data" sheet - categories and accounts
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
    accounts: ['Kotak', 'ICICI Credit Card', 'HDFC Credit Card']
  });

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

  const transactionTypes = ['Expense', 'Income', 'Transfer'];

  // Transactions from Google Sheets
  const [transactions, setTransactions] = useState([
    { id: 1, date: '2025-01-15', amount: 1200, category: 'Food > Food', description: 'Lunch at restaurant', account: 'Kotak', type: 'Expense', tag: 'dining', synced: true },
    { id: 2, date: '2025-01-14', amount: 5200, category: 'Fuel > Honda City', description: 'Petrol fill-up', account: 'Kotak', type: 'Expense', tag: 'fuel', synced: true },
    { id: 3, date: '2025-01-13', amount: 50000, category: 'Income > Income', description: 'Salary credit', account: 'Kotak', type: 'Income', tag: 'salary', synced: true },
  ]);

  const [balances, setBalances] = useState({
    'Kotak': 25890.7,
    'ICICI Credit Card': 0,
    'HDFC Credit Card': 0
  });

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);

  // Form state with autocomplete
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    description: '',
    account: 'Kotak',
    tag: ''
  });

  // Autocomplete states
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [accountSearch, setAccountSearch] = useState('Kotak');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const [currentView, setCurrentView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Filter categories based on search
  const filteredCategories = masterData.categories.filter(cat =>
    cat.combined.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredAccounts = masterData.accounts.filter(acc =>
    acc.toLowerCase().includes(accountSearch.toLowerCase())
  );

  // Parse category to get main and sub
  const parseCategory = (categoryString) => {
    const parts = categoryString.split(' > ');
    return {
      main: parts[0] || '',
      sub: parts[1] || parts[0] || '',
      combined: categoryString
    };
  };

  // Auto-determine transaction type based on category
  const getTransactionType = (category) => {
    const mainCategory = parseCategory(category).main;
    return mainCategory === 'Income' ? 'Income' : 'Expense';
  };

  // Google Sheets API Functions (Simulated)
  const connectToGoogleSheets = async (spreadsheetId, apiKey) => {
    setSyncStatus('syncing');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSheetsConfig({
        spreadsheetId,
        apiKey,
        isConnected: true,
        lastSync: new Date().toISOString()
      });
      setSyncStatus('success');
      
      // Load existing data from sheets
      await loadDataFromSheets();
      
    } catch (error) {
      setSyncStatus('error');
      console.error('Failed to connect to Google Sheets:', error);
    }
  };

  const loadDataFromSheets = async () => {
    try {
      // Simulate loading your actual Google Sheets data
      const sheetsData = [
        { id: 101, date: '2025-06-01', amount: 3700, category: 'Household > House Help', description: 'Maid', account: 'Kotak', type: 'Expense', tag: '', synced: true },
        { id: 102, date: '2025-06-02', amount: 2370, category: 'Household > Grocery', description: 'Momaji Grocery', account: 'Kotak', type: 'Expense', tag: '', synced: true },
        { id: 103, date: '2025-05-31', amount: 40000, category: 'Income > Income', description: 'Monthly Load', account: 'Kotak', type: 'Income', tag: '', synced: true },
        { id: 104, date: '2025-06-03', amount: 325, category: 'Subscriptions > Subscriptions', description: 'Global Machining Website', account: 'Kotak', type: 'Expense', tag: '', synced: true },
        { id: 105, date: '2025-06-04', amount: 527, category: 'Fuel > Honda City', description: 'City CNG', account: 'Kotak', type: 'Expense', tag: '', synced: true },
      ];
      
      setTransactions(prev => [...sheetsData, ...prev.filter(t => !t.synced)]);
      
    } catch (error) {
      console.error('Failed to load data from sheets:', error);
    }
  };

  const syncToGoogleSheets = async (transaction) => {
    if (!sheetsConfig.isConnected) return;
    
    try {
      // Simulate API call to append to Google Sheets
      // This would map to your Transactions sheet columns:
      // A: Date, B: Amount, C: Category (combined), D: Description, E: Tag, F: Account
      // G-M: Auto-populated columns (Main Category, Subcategory, Type, Balance, etc.)
      
      const categoryData = parseCategory(transaction.category);
      const transactionType = getTransactionType(transaction.category);
      
      const sheetRow = {
        date: transaction.date,
        amount: transaction.amount,
        category: categoryData.combined,
        description: transaction.description,
        tag: transaction.tag || '',
        account: transaction.account,
        // These would be auto-populated in your sheet:
        mainCategory: categoryData.main,
        subcategory: categoryData.sub,
        type: transactionType,
        // balance, monthYear, year would be calculated by formulas
      };
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mark as synced
      setTransactions(prev => 
        prev.map(t => t.id === transaction.id ? { ...t, synced: true } : t)
      );
      
      setSheetsConfig(prev => ({ ...prev, lastSync: new Date().toISOString() }));
      
    } catch (error) {
      console.error('Failed to sync to Google Sheets:', error);
    }
  };

  const manualSync = async () => {
    if (!sheetsConfig.isConnected) return;
    
    setSyncStatus('syncing');
    try {
      // Sync unsynced transactions
      const unsyncedTransactions = transactions.filter(t => !t.synced);
      
      for (const transaction of unsyncedTransactions) {
        await syncToGoogleSheets(transaction);
      }
      
      // Pull any new data from sheets
      await loadDataFromSheets();
      
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
      
    } catch (error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  // Add transaction
  const addTransaction = async () => {
    if (!formData.amount || !formData.category || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    const categoryData = parseCategory(formData.category);
    const transactionType = getTransactionType(formData.category);

    const newTransaction = {
      id: Date.now(),
      date: formData.date,
      amount: parseFloat(formData.amount),
      category: categoryData.combined,
      description: formData.description,
      account: formData.account,
      type: transactionType,
      tag: formData.tag || '',
      timestamp: new Date().toISOString(),
      synced: false
    };

    setTransactions([newTransaction, ...transactions]);

    // Update balance
    const amount = parseFloat(formData.amount);
    setBalances(prev => ({
      ...prev,
      [formData.account]: transactionType === 'Income' 
        ? prev[formData.account] + amount
        : prev[formData.account] - amount
    }));

    // Auto-sync to Google Sheets if connected
    if (sheetsConfig.isConnected) {
      await syncToGoogleSheets(newTransaction);
    }

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: '',
      description: '',
      account: 'Kotak',
      tag: ''
    });
    setCategorySearch('');
    setAccountSearch('Kotak');

    setIsFormVisible(false);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || t.category.includes(filterCategory);
    return matchesSearch && matchesCategory;
  });

  // Calculate analytics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
  });

  const currentMonthExpenses = currentMonthTransactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentMonthIncome = currentMonthTransactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);

  // Category breakdown for charts
  const categoryTotals = {};
  currentMonthTransactions.forEach(t => {
    if (t.type === 'Expense') {
      const mainCategory = parseCategory(t.category).main;
      categoryTotals[mainCategory] = (categoryTotals[mainCategory] || 0) + t.amount;
    }
  });

  const pieChartData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
    color: categoryColors[name]
  }));

  const totalBalance = Object.values(balances).reduce((sum, balance) => sum + balance, 0);
  const savingsRate = currentMonthIncome > 0 ? ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 100 : 0;

  // Top spending categories
  const topCategories = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const GoogleSheetsModal = () => (
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {!sheetsConfig.isConnected ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Spreadsheet ID</label>
                  <input
                    type="text"
                    placeholder="Enter your Google Sheets ID"
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    onChange={(e) => setSheetsConfig(prev => ({ ...prev, spreadsheetId: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Found in your Google Sheets URL</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
                  <input
                    type="password"
                    placeholder="Enter your Google API key"
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    onChange={(e) => setSheetsConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">From Google Cloud Console</p>
                </div>
                
                <button
                  onClick={() => connectToGoogleSheets(sheetsConfig.spreadsheetId, sheetsConfig.apiKey)}
                  disabled={!sheetsConfig.spreadsheetId || !sheetsConfig.apiKey || syncStatus === 'syncing'}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncStatus === 'syncing' ? (
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    'Connect to Google Sheets'
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Connected Successfully!</p>
                      <p className="text-sm text-green-700">
                        Last synced: {sheetsConfig.lastSync ? new Date(sheetsConfig.lastSync).toLocaleTimeString() : 'Never'}
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
                    onClick={() => setSheetsConfig({ spreadsheetId: '', apiKey: '', isConnected: false, lastSync: null })}
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
  );

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
                  <p className="text-gray-500">
                    {sheetsConfig.isConnected ? 'Will sync to Google Sheets automatically' : 'Add to local storage'}
                  </p>
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
              
              <div className="space-y-2 relative">
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
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
                  placeholder="Start typing category..."
                />
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
              
              <div className="space-y-2 relative">
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
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
                  placeholder="Select account..."
                />
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
                        className="w-full text-left px-4 py-3 hover:bg-gray-50
