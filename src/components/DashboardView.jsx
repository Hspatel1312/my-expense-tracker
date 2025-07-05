import React from 'react';
import { DollarSign, TrendingUp, ArrowUpDown, Target, Star, AlertTriangle, Wallet, Award } from 'lucide-react';
import { categoryColors } from '../constants/categories';

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
    topCategories
  } = expenseTracker;

  return (
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
            {Object.entries(balances).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {googleSheets.gapiLoaded ? 'No accounts found. Connect to Google Sheets to load account balances.' : 'Loading Google API...'}
                </p>
              </div>
            ) : (
              Object.entries(balances).map(([account, balance]) => (
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
            {topCategories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No expenses found for this month.</p>
              </div>
            ) : (
              topCategories.map(([category, amount], index) => {
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
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
