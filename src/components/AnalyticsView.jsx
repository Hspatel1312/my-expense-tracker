import React, { useMemo } from 'react';
import { PieChart, BarChart3, TrendingUp, Calendar, Activity, Zap } from 'lucide-react';
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { categoryColors } from '../constants/categories';
import { parseCategory } from '../utils/helpers';

const AnalyticsView = ({ expenseTracker }) => {
  const { transactions = [], currentMonthExpenses = 0 } = expenseTracker || {};

  // Category-wise expense distribution with enhanced logic
  const pieChartData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const categoryTotals = {};
    
    // Get current month expenses
    const currentMonthExpenses = transactions.filter(t => {
      const date = new Date(t.date);
      const isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      const isExpense = t.type === 'Expense';
      return isCurrentMonth && isExpense;
    });
    
    // If insufficient current month data, use recent expenses
    let filteredTransactions = currentMonthExpenses;
    if (filteredTransactions.length <= 2) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(currentMonth - 3);
      
      filteredTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return t.type === 'Expense' && date >= threeMonthsAgo;
      });
    }
    
    filteredTransactions.forEach(t => {
      const categoryData = parseCategory(t.category);
      const main = categoryData.main || 'Unknown';
      categoryTotals[main] = (categoryTotals[main] || 0) + t.amount;
    });
    
    const result = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        color: categoryColors[category] || '#9CA3AF'
      }))
      .sort((a, b) => b.value - a.value);
    
    return result;
  }, [transactions]);

  // Determine what period we're showing
  const displayPeriod = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthExpenses = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && 
             date.getFullYear() === currentYear && 
             t.type === 'Expense';
    });
    
    return currentMonthExpenses.length > 2 ? 'Current Month' : 'Recent';
  }, [transactions]);

  // Month-wise expense trend (last 12 months)
  const monthlyExpenseData = useMemo(() => {
    const monthlyTotals = {};
    const currentDate = new Date();
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      monthlyTotals[key] = { month: monthName, expenses: 0, income: 0 };
    }
    
    // Aggregate transactions by month
    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyTotals[key]) {
        if (t.type === 'Expense') {
          monthlyTotals[key].expenses += t.amount;
        } else if (t.type === 'Income') {
          monthlyTotals[key].income += t.amount;
        }
      }
    });
    
    return Object.values(monthlyTotals);
  }, [transactions]);

  // Category-wise spending over time (last 6 months)
  const categoryTrendData = useMemo(() => {
    const currentDate = new Date();
    const months = [];
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString('en-IN', { month: 'short' }),
        year: date.getFullYear(),
        monthNum: date.getMonth()
      });
    }
    
    const topCategories = [...new Set(transactions
      .filter(t => t.type === 'Expense')
      .map(t => parseCategory(t.category).main))]
      .slice(0, 5);
    
    return months.map(({ month, year, monthNum }) => {
      const monthData = { month };
      
      topCategories.forEach(category => {
        monthData[category] = transactions
          .filter(t => {
            const date = new Date(t.date);
            return t.type === 'Expense' && 
                   date.getMonth() === monthNum && 
                   date.getFullYear() === year &&
                   parseCategory(t.category).main === category;
          })
          .reduce((sum, t) => sum + t.amount, 0);
      });
      
      return monthData;
    });
  }, [transactions]);

  const topCategories = pieChartData.slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Transactions</p>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Categories</p>
              <p className="text-2xl font-bold">{pieChartData.length}</p>
            </div>
            <PieChart className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Data Quality</p>
              <p className="text-2xl font-bold">
                {transactions.length > 0 ? Math.round((transactions.filter(t => t.synced).length / transactions.length) * 100) : 0}%
              </p>
            </div>
            <Zap className="w-8 h-8 text-emerald-200" />
          </div>
        </div>
      </div>

      {/* Expense Distribution Chart */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-8 border border-white/50">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {displayPeriod} Expense Distribution
            </h3>
            <p className="text-gray-500 mt-1">
              {displayPeriod === 'Current Month' ? 
                'How your money is allocated across categories this month' : 
                'Recent expense allocation across categories'
              }
            </p>
          </div>
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
            <PieChart className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {pieChartData.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <PieChart className="w-10 h-10 text-gray-400" />
            </div>
            <h4 className="text-xl font-bold text-gray-500 mb-2">No expense data available</h4>
            <p className="text-gray-400">Add some expenses to see the distribution</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            {/* Enhanced Chart */}
            <div className="h-80 sm:h-96 order-2 lg:order-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius="85%"
                    innerRadius="40%"
                    fill="#8884d8"
                    dataKey="value"
                    stroke="none"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              {/* Center Label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{pieChartData.reduce((sum, cat) => sum + cat.value, 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-gray-500 font-medium">Total</p>
                </div>
              </div>
            </div>
            
            {/* Enhanced Legend */}
            <div className="space-y-3 sm:space-y-4 order-1 lg:order-2">
              {pieChartData.map((item, index) => (
                <div key={item.name} className="group hover:bg-gray-50 rounded-2xl p-4 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm`}
                             style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)` }}>
                          #{index + 1}
                        </div>
                        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                      </div>
                      <span className="font-semibold text-gray-900 text-base truncate">{item.name}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-gray-900 text-base">₹{item.value.toLocaleString('en-IN')}</div>
                      <div className="text-sm text-gray-500">
                        {((item.value / pieChartData.reduce((sum, cat) => sum + cat.value, 0)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-8 border border-white/50">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Monthly Financial Flow
            </h3>
            <p className="text-gray-500 mt-1">Income vs expenses over the last 12 months</p>
          </div>
          <div className="p-3 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyExpenseData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                formatter={(value, name) => [
                  `₹${value.toLocaleString('en-IN')}`, 
                  name === 'expenses' ? 'Expenses' : 'Income'
                ]}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="income" fill="url(#incomeGradient)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="url(#expenseGradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="100%" stopColor="#DC2626" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Trends */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-8 border border-white/50">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Category Spending Trends
            </h3>
            <p className="text-gray-500 mt-1">Track spending patterns across top categories</p>
          </div>
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={categoryTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                formatter={(value, name) => [`₹${value.toLocaleString('en-IN')}`, name]}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                }}
              />
              {topCategories.map((category, index) => (
                <Line 
                  key={category.name}
                  type="monotone" 
                  dataKey={category.name} 
                  stroke={category.color}
                  strokeWidth={3}
                  dot={{ r: 4, fill: category.color, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, stroke: category.color, strokeWidth: 2 }}
                />
