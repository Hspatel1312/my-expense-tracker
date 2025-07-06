import React from 'react';
import { DollarSign, TrendingUp, ArrowUpDown, Target, Star, AlertTriangle, Wallet, Award, Eye, EyeOff, Zap, CreditCard, Banknote, PiggyBank } from 'lucide-react';
import { categoryColors } from '../constants/categories';
import { parseCategory } from '../utils/helpers';

const DashboardView = ({ 
  expenseTracker, 
  googleSheets 
}) => {
  const {
    balanceVisible,
    setBalanceVisible,
    totalBalance,
    currentMonthIncome,
    currentMonthExpenses,
    savingsRate,
    balances,
    transactions = []
  } = expenseTracker;

  // Enhanced topCategories calculation
  const topCategories = React.useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthExpenses = transactions.filter(t => {
      const date = new Date(t.date);
      const isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      const isExpense = t.type === 'Expense';
      return isCurrentMonth && isExpense;
    });

    let transactionsToUse = currentMonthExpenses;

    if (transactionsToUse.length === 0) {
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

    return Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  }, [transactions]);

  const totalExpensesForCategories = React.useMemo(() => {
    return topCategories.reduce((sum, [, amount]) => sum + amount, 0);
  }, [topCategories]);

  const netWorth = currentMonthIncome - currentMonthExpenses;
  const isPositiveFlow = netWorth >= 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Section - Enhanced Financial Overview */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl sm:rounded-4xl p-6 sm:p-8 text-white shadow-2xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Financial Overview</h1>
              <p className="text-purple-200 text-sm sm:text-base opacity-90">
                {googleSheets.sheetsConfig.isConnected ? '🔄 Synced with Google Sheets' : '💾 Local Data'} • 
                {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl transition-all duration-300 hover:scale-105"
            >
              {balanceVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>

          {/* Main Balance Display */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Total Balance */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-emerald-500/20 rounded-xl">
                    <Wallet className="w-6 h-6 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-200 font-medium">Total Balance</p>
                    <div className="text-2xl sm:text-3xl font-bold">
                      {balanceVisible ? `₹${totalBalance.toLocaleString('en-IN')}` : '••••••••'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Flow */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="p-2 bg-green-500/20 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-green-300" />
                      </div>
                    </div>
                    <p className="text-xs text-purple-200 mb-1">Income</p>
                    <p className="text-lg font-bold text-green-300">₹{currentMonthIncome.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="p-2 bg-red-500/20 rounded-xl">
                        <ArrowUpDown className="w-5 h-5 text-red-300" />
                      </div>
                    </div>
                    <p className="text-xs text-purple-200 mb-1">Expenses</p>
                    <p className="text-lg font-bold text-red-300">₹{currentMonthExpenses.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className={`p-2 rounded-xl ${isPositiveFlow ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                        {isPositiveFlow ? 
                          <PiggyBank className="w-5 h-5 text-emerald-300" /> : 
                          <AlertTriangle className="w-5 h-5 text-amber-300" />
                        }
                      </div>
                    </div>
                    <p className="text-xs text-purple-200 mb-1">Net Flow</p>
                    <p className={`text-lg font-bold ${isPositiveFlow ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {isPositiveFlow ? '+' : ''}₹{netWorth.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Savings Rate Indicator */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-purple-300" />
                <span className="text-sm font-medium text-purple-200">Savings Rate</span>
              </div>
              <div className="flex items-center space-x-2">
                {savingsRate > 20 ? 
                  <Star className="w-4 h-4 text-yellow-400" /> : 
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                }
                <span className="text-lg font-bold">{savingsRate.toFixed(1)}%</span>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${
                  savingsRate > 20 ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 
                  savingsRate > 10 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                  'bg-gradient-to-r from-red-400 to-red-500'
                }`}
                style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        {/* Account Balances - Enhanced */}
        <div className="xl:col-span-2">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-8 border border-white/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Account Portfolio
                </h3>
                <p className="text-gray-500 text-sm">Real-time balance overview</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="space-y-4">
              {Object.entries(balances).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Banknote className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    {googleSheets.gapiLoaded ? 'Connect to Google Sheets to load accounts' : 'Loading account data...'}
                  </p>
                </div>
              ) : (
                Object.entries(balances).map(([account, balance], index) => (
                  <div key={account} className="group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                    <div className="relative bg-white border-2 border-gray-100 hover:border-blue-200 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                              balance >= 0 ? 'bg-gradient-to-br from-emerald-100 to-green-100' : 'bg-gradient-to-br from-red-100 to-orange-100'
                            }`}>
                              <div className={`w-3 h-3 rounded-full ${balance >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-gray-900 text-lg truncate">{account}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                balance >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {balance >= 0 ? '✓ Active' : '⚠ Credit Used'}
                              </span>
                              <span className="text-xs text-gray-400">Account #{index + 1}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-xl sm:text-2xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {balanceVisible ? `₹${Math.abs(balance).toLocaleString('en-IN')}` : '••••••'}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {balance >= 0 ? 'Available' : 'Outstanding'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Top Categories - Enhanced */}
        <div className="xl:col-span-1">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-8 border border-white/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Top Expenses
                </h3>
                <p className="text-gray-500 text-sm">Current spending breakdown</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="space-y-4">
              {topCategories.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">No expenses found</p>
                </div>
              ) : (
                topCategories.map(([category, amount], index) => {
                  const percentage = totalExpensesForCategories > 0 ? (amount / totalExpensesForCategories) * 100 : 0;
                  const categoryColor = categoryColors[category] || '#9CA3AF';
                  
                  return (
                    <div key={category} className="group relative">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm`}
                                 style={{ background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)` }}>
                              #{index + 1}
                            </div>
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: categoryColor }}></div>
                          </div>
                          <span className="font-semibold text-gray-900 truncate">{category}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-gray-900">₹{amount.toLocaleString('en-IN')}</div>
                          <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      
                      {/* Enhanced Progress Bar */}
                      <div className="relative">
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div 
                            className="h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                            style={{ 
                              width: `${percentage}%`,
                              background: `linear-gradient(90deg, ${categoryColor}, ${categoryColor}cc)`
                            }}
                          >
                            <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="absolute inset-0 rounded-full ring-1 ring-gray-200"></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Quick Stats */}
            {topCategories.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3">
                    <div className="text-lg font-bold text-gray-900">{topCategories.length}</div>
                    <div className="text-xs text-gray-500 font-medium">Categories</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3">
                    <div className="text-lg font-bold text-gray-900">₹{totalExpensesForCategories.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-gray-500 font-medium">Total</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .rounded-4xl {
          border-radius: 2rem;
        }

        @media (max-width: 640px) {
          .rounded-4xl {
            border-radius: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardView;
