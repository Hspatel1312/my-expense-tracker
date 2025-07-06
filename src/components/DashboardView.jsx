import React from 'react';
import { DollarSign, TrendingUp, ArrowUpDown, Target, Star, AlertTriangle, Wallet, Award, ChevronRight } from 'lucide-react';
import { categoryColors } from '../constants/categories';
import { parseCategory } from '../utils/helpers';

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
    transactions = [] // Add default to prevent undefined errors
  } = expenseTracker;

  // Debug: Log transaction data
  React.useEffect(() => {
    console.log('🔍 DASHBOARD DEBUG - Total transactions:', transactions.length);
    console.log('🔍 DASHBOARD DEBUG - Current month income:', currentMonthIncome);
    console.log('🔍 DASHBOARD DEBUG - Current month expenses:', currentMonthExpenses);
    
    // Log current month transactions
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthTrans = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    console.log('🔍 DASHBOARD DEBUG - Current month transactions:', currentMonthTrans.length);
    currentMonthTrans.forEach(t => {
      console.log(`  - ${t.description}: ₹${t.amount} (${t.type}) - ${t.category}`);
    });
  }, [transactions, currentMonthIncome, currentMonthExpenses]);

  // Enhanced topCategories calculation with detailed debugging
  const topCategories = React.useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    console.log('🔍 DASHBOARD - Calculating top categories for month:', currentMonth + 1, 'year:', currentYear);

    // Get current month expenses
    const currentMonthExpenses = transactions.filter(t => {
      const date = new Date(t.date);
      const isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      const isExpense = t.type === 'Expense';
      
      if (isCurrentMonth && isExpense) {
        console.log(`🔍 DASHBOARD - Including expense: ${t.description} - ₹${t.amount} (${t.category})`);
      }
      
      return isCurrentMonth && isExpense;
    });

    console.log('🔍 DASHBOARD - Current month expenses found:', currentMonthExpenses.length);

    let transactionsToUse = currentMonthExpenses;

    // If no current month data, fall back to recent expenses
    if (transactionsToUse.length === 0) {
      console.log('🔍 DASHBOARD - No current month data, using recent expenses...');
      
      // Get last 30 days of expenses
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      transactionsToUse = transactions.filter(t => {
        const date = new Date(t.date);
        return t.type === 'Expense' && date >= thirtyDaysAgo;
      });
      
      console.log('🔍 DASHBOARD - Recent expenses (last 30 days):', transactionsToUse.length);
    }

    // Aggregate by main category
    const categoryTotals = {};
    transactionsToUse.forEach(t => {
      const categoryData = parseCategory(t.category);
      const main = categoryData.main || 'Unknown';
      
      categoryTotals[main] = (categoryTotals[main] || 0) + t.amount;
      
      console.log(`🔍 DASHBOARD - Adding ₹${t.amount} to category "${main}" (total: ₹${categoryTotals[main]})`);
    });

    console.log('🔍 DASHBOARD - Final category totals:', categoryTotals);

    const result = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    console.log('🔍 DASHBOARD - Top 5 categories:', result);
    return result;
  }, [transactions]);

  // Calculate total expenses for percentage calculations
  const totalExpensesForCategories = React.useMemo(() => {
    return topCategories.reduce((sum, [, amount]) => sum + amount, 0);
  }, [topCategories]);

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Debug Panel - Remove this in production */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
        <h4 className="font-bold text-blue-800 mb-2">Dashboard Debug Info:</h4>
        <div className="grid grid-cols-2 gap-4 text-blue-700">
          <div>
            <div>Total transactions: {transactions.length}</div>
            <div>Current month income: ₹{currentMonthIncome.toLocaleString('en-IN')}</div>
            <div>Current month expenses: ₹{currentMonthExpenses.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div>Top categories count: {topCategories.length}</div>
            <div>Category total: ₹{totalExpensesForCategories.toLocaleString('en-IN')}</div>
            <div>Month/Year: {new Date().getMonth() + 1}/{new Date().getFullYear()}</div>
          </div>
        </div>
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
              <p className="text-sm text-gray-600 hidden sm:block">
                {topCategories.length > 0 && totalExpensesForCategories === currentMonthExpenses ? 
                  'Your biggest expenses this month' : 
                  'Your recent biggest expenses'
                }
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl sm:rounded-2xl">
              <Award className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {topCategories.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className="text-gray-500 text-sm">No expenses found.</p>
              </div>
            ) : (
              topCategories.map(([category, amount], index) => {
                const percentage = totalExpensesForCategories > 0 ? (amount / totalExpensesForCategories) * 100 : 0;
                return (
                  <div key={category} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="text-sm sm:text-lg font-bold text-gray-400 flex-shrink-0">#{index + 1}</div>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColors[category] || '#9CA3AF' }}></div>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">{category}</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm sm:text-base flex-shrink-0">₹{amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                      <div 
                        className="h-1.5 sm:h-2 rounded-full transition-all duration-500 group-hover:shadow-lg"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: categoryColors[category] || '#9CA3AF'
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
