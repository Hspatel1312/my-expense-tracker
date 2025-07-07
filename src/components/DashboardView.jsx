import React from 'react';
import { DollarSign, TrendingUp, ArrowUpDown, Target, Star, AlertTriangle, Wallet, Award, ChevronRight } from 'lucide-react';

const DashboardView = ({ 
  expenseTracker, 
  googleSheets 
}) => {
  const {
    balanceVisible,
    totalBalance,
    currentMonthIncome,
    currentMonthExpenses,
    savingsRate,
    balances,
    topCategories,
    getCategoryColor
  } = expenseTracker;

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Debug Header */}
      <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-4">
        <h2 className="text-green-800 font-bold">🏠 DASHBOARD VIEW - This should show metrics, balances, and top categories</h2>
      </div>

      {/* Key Metrics - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Total Balance */}
        <div className="group relative bg-white/80 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/50 col-span-2 lg:col-span-1">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl sm:rounded-2xl shadow-lg">
                <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                {googleSheets.sheetsConfig.isConnected ? 'Synced' : 'Local'}
              </div>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Total Balance</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">
              {balanceVisible ? `₹${totalBalance.toLocaleString('en-IN')}` : '••••••'}
            </p>
          </div>
        </div>
        
        {/* Income */}
        <div className="group relative bg-white/80 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/50">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-cyan-400/10 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl shadow-lg">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                Month
              </div>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Income</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">₹{currentMonthIncome.toLocaleString('en-IN')}</p>
          </div>
        </div>
        
        {/* Expenses */}
        <div className="group relative bg-white/80 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/50">
          <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-pink-400/10 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl sm:rounded-2xl shadow-lg">
                <ArrowUpDown className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                Monthly
              </div>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Expenses</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">₹{currentMonthExpenses.toLocaleString('en-IN')}</p>
          </div>
        </div>
        
        {/* Savings Rate */}
        <div className="group relative bg-white/80 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/50">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-indigo-400/10 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl sm:rounded-2xl shadow-lg">
                <Target className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                savingsRate > 20 ? 'text-green-600 bg-green-100' : 'text-orange-600 bg-orange-100'
              }`}>
                {savingsRate > 20 ? <Star className="w-2 h-2 sm:w-3 sm:h-3 inline mr-1" /> : <AlertTriangle className="w-2 h-2 sm:w-3 sm:h-3 inline mr-1" />}
                {savingsRate.toFixed(1)}%
              </div>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Savings</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">₹{(currentMonthIncome - currentMonthExpenses).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Account Balances & Top Categories - Mobile Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Account Balances */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-8 border border-white/50">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Account Balances</h3>
              <p className="text-sm text-gray-600 hidden sm:block">Current status of all accounts</p>
            </div>
            <div className="p-2 sm:p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl sm:rounded-2xl">
              <Wallet className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {Object.entries(balances).length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className="text-gray-500 text-sm">
                  {googleSheets.gapiLoaded ? 'No accounts found. Connect to Google Sheets to load account balances.' : 'Loading Google API...'}
                </p>
              </div>
            ) : (
              Object.entries(balances).map(([account, balance]) => (
                <div key={account} className="group relative bg-gradient-to-r from-gray-50 to-gray-100 hover:from-white hover:to-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 hover:shadow-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${balance >= 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base truncate block">{account}</span>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {balance >= 0 ? 'Active' : 'Credit Used'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-sm sm:text-lg font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {balanceVisible ? `₹${Math.abs(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '••••••'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-8 border border-white/50">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Top Categories</h3>
              <p className="text-sm text-gray-600 hidden sm:block">Your biggest expenses this month</p>
            </div>
            <div className="p-2 sm:p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl sm:rounded-2xl">
              <Award className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {topCategories.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className="text-gray-500 text-sm">No expenses found for this month.</p>
              </div>
            ) : (
              topCategories.map(([category, amount], index) => {
                const percentage = currentMonthExpenses > 0 ? (amount / currentMonthExpenses) * 100 : 0;
                const categoryColor = getCategoryColor ? getCategoryColor(category) : '#9CA3AF';
                
                return (
                  <div key={category} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="text-sm sm:text-lg font-bold text-gray-400 flex-shrink-0">#{index + 1}</div>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColor }}></div>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">{category}</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm sm:text-base flex-shrink-0">₹{amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                      <div 
                        className="h-1.5 sm:h-2 rounded-full transition-all duration-500 group-hover:shadow-lg"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: categoryColor
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
  );
};

export default DashboardView;
