return (
    <div className="space-y-4 sm:space-y-8">
      {/* Current Month Expense Distribution */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-8 border border-white/50">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              {pieChartData.length > 0 ? 'Current Month Expense Distribution' : 'All-Time Expense Distribution'}
            </h3>
            <p className="text-sm text-gray-600 hidden sm:block">
              {pieChartData.length > 0 ? 'How your money is allocated across categories this month' : 'Overall expense allocation across all transactions'}
            </p>
          </div>
          <div className="p-2 sm:p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl sm:rounded-2xl">
            <PieChart className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
        
        {pieChartData.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <PieChart className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg sm:text-xl font-medium">No expense data available</p>
            <p className="text-gray-400 text-sm mt-2">Add some expenses to see the distribution</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Chart */}
            <div className="h-64 sm:h-80 order-2 lg:order-1">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
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
            
            {/* Legend */}
            <div className="space-y-2 sm:space-y-4 order-1 lg:order-2">
              {pieChartData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-bold text-gray-400 flex-shrink-0">#{index + 1}</div>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                    <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.name}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-gray-900 text-sm sm:text-base">₹{item.value.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-gray-500">
                      {pieChartData.length > 0 ? 
                        ((item.value / pieChartData.reduce((sum, cat) => sum + cat.value, 0)) * 100).toFixed(1) + '%' :
                        '0%'
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Expense Trend */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-8 border border-white/50">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Monthly Expense & Income Trend</h3>
            <p className="text-sm text-gray-600 hidden sm:block">Your financial flow over the last 12 months</p>
          </div>
          <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl sm:rounded-2xl">
            <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
        
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyExpenseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value, name) => [
                  `₹${value.toLocaleString('en-IN')}`, 
                  name === 'expenses' ? 'Expenses' : 'Income'
                ]} 
              />
              <Bar dataKey="income" fill="#10B981" name="income" />
              <Bar dataKey="expenses" fill="#EF4444" name="expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Trend Analysis */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-8 border border-white/50">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Category Spending Trends</h3>
            <p className="text-sm text-gray-600 hidden sm:block">Track how your spending patterns change over time</p>
          </div>
          <div className="p-2 sm:p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl sm:rounded-2xl">
            <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
        
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={categoryTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip formatter={(value, name) => [`₹${value.toLocaleString('en-IN')}`, name]} />
              {topCategories.map((category, index) => (
                <Line 
                  key={category.name}
                  type="monotone" 
                  dataKey={category.name} 
                  stroke={category.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend for mobile */}
        <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4">
          {topCategories.map((category) => (
            <div key={category.name} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: category.color }}
              ></div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{category.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );import React, { useMemo } from 'react';
import { PieChart, BarChart3, TrendingUp, Calendar } from 'lucide-react';
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

  // Debug component to check transaction data
  const DebugInfo = ({ transactions }) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const expenses = transactions?.filter(t => t.type === 'Expense') || [];
    const currentMonthExpenses = expenses.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
        <h4 className="font-bold text-yellow-800 mb-2">Debug Info:</h4>
        <div className="text-sm space-y-1">
          <p>Total transactions: {transactions?.length || 0}</p>
          <p>Total expenses: {expenses.length}</p>
          <p>Current month ({currentMonth + 1}/{currentYear}) expenses: {currentMonthExpenses.length}</p>
          <p>Sample expense: {expenses[0] ? JSON.stringify(expenses[0]) : 'None'}</p>
          <p>Sample current month expense: {currentMonthExpenses[0] ? JSON.stringify(currentMonthExpenses[0]) : 'None'}</p>
        </div>
      </div>
    );
  };

  // Category-wise expense distribution (current month)
  const pieChartData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    console.log('🔍 Debug - Current month:', currentMonth, 'Current year:', currentYear);
    console.log('🔍 Debug - Total transactions:', transactions?.length || 0);
    
    const categoryTotals = {};
    
    // First try current month
    let filteredTransactions = transactions
      .filter(t => {
        const date = new Date(t.date);
        const isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        const isExpense = t.type === 'Expense';
        return isExpense && isCurrentMonth;
      });
    
    // If no current month data, use all-time data
    if (filteredTransactions.length === 0) {
      console.log('🔍 No current month data, using all-time expenses');
      filteredTransactions = transactions.filter(t => t.type === 'Expense');
    }
    
    console.log('🔍 Debug - Filtered transactions:', filteredTransactions.length);
    
    filteredTransactions.forEach(t => {
      const categoryData = parseCategory(t.category);
      const main = categoryData.main || 'Unknown';
      categoryTotals[main] = (categoryTotals[main] || 0) + t.amount;
    });
    
    console.log('🔍 Debug - Category totals:', categoryTotals);
    
    const result = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        color: categoryColors[category] || '#9CA3AF'
      }))
      .sort((a, b) => b.value - a.value);
    
    console.log('🔍 Debug - Pie chart data:', result);
    return result;
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
      .slice(0, 5); // Top 5 categories
    
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
    <div className="space-y-8">
      {/* Current Month Expense Distribution */}
      {/* Debug Info - Remove this after fixing */}
      <DebugInfo transactions={transactions} />
      
      {/* Current Month Expense Distribution */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-white/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {pieChartData.length > 0 ? 'Current Month Expense Distribution' : 'All-Time Expense Distribution'}
            </h3>
            <p className="text-gray-600">
              {pieChartData.length > 0 ? 'How your money is allocated across categories this month' : 'Overall expense allocation across all transactions'}
            </p>
          </div>
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl">
            <PieChart className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {pieChartData.length === 0 ? (
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
                    <div className="text-sm font-bold text-gray-400">#{index + 1}</div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">₹{item.value.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-gray-500">
                      {pieChartData.length > 0 ? 
                        ((item.value / pieChartData.reduce((sum, cat) => sum + cat.value, 0)) * 100).toFixed(1) + '%' :
                        '0%'
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Expense Trend */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-white/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Monthly Expense & Income Trend</h3>
            <p className="text-gray-600">Your financial flow over the last 12 months</p>
          </div>
          <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyExpenseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
              <Tooltip 
                formatter={(value, name) => [
                  `₹${value.toLocaleString('en-IN')}`, 
                  name === 'expenses' ? 'Expenses' : 'Income'
                ]} 
              />
              <Bar dataKey="income" fill="#10B981" name="income" />
              <Bar dataKey="expenses" fill="#EF4444" name="expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Trend Analysis */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-8 border border-white/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Category Spending Trends</h3>
            <p className="text-gray-600">Track how your spending patterns change over time</p>
          </div>
          <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl">
            <Calendar className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={categoryTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
              <Tooltip formatter={(value, name) => [`₹${value.toLocaleString('en-IN')}`, name]} />
              {topCategories.map((category, index) => (
                <Line 
                  key={category.name}
                  type="monotone" 
                  dataKey={category.name} 
                  stroke={category.color}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 flex flex-wrap gap-4">
          {topCategories.map((category) => (
            <div key={category.name} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: category.color }}
              ></div>
              <span className="text-sm font-medium text-gray-700">{category.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
