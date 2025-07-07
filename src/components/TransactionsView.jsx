import React from 'react';
import { Search, Filter, Edit, Trash2, Calendar, DollarSign, Tag, CreditCard, X, ChevronDown } from 'lucide-react';
import { parseCategory, months, getYears } from '../utils/helpers';

const TransactionsView = ({ expenseTracker, onEditTransaction }) => {
  const {
    filteredTransactions,
    filters,
    setFilters,
    showFilters,
    setShowFilters,
    clearFilters,
    deleteTransaction,
    masterData,
    uniqueMainCategories,
    getCategoryColor
  } = expenseTracker;

  const uniqueAccounts = [...new Set(filteredTransactions.map(t => t.account))];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search and Filter Bar - Mobile Optimized */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 border border-white/50">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        
        {/* Filter Toggle and Clear */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 flex-1 justify-center ${
              showFilters ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          {(filters.search || filters.category || filters.account || filters.type || filters.month || filters.year) && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-4 py-2.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl transition-all duration-200"
            >
              <X className="w-4 h-4" />
              <span className="text-sm font-medium">Clear</span>
            </button>
          )}
        </div>

        {/* Filter Panel - Mobile Stack */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Categories</option>
                  {uniqueMainCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account</label>
                <select
                  value={filters.account}
                  onChange={(e) => setFilters({...filters, account: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Accounts</option>
                  {uniqueAccounts.map(acc => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Types</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                  <option value="Transfer">Transfer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters({...filters, month: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Months</option>
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction List - Mobile Optimized */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg border border-white/50 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50/50">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">
            Transactions ({filteredTransactions.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-100">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-base sm:text-lg">No transactions found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or add some transactions</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => {
              const categoryData = parseCategory(transaction.category);
              const categoryColor = getCategoryColor(categoryData.main);
              
              return (
                <div key={transaction.id} className="p-4 sm:p-6 hover:bg-gray-50/80 transition-colors duration-200">
                  {/* Mobile Layout */}
                  <div className="block sm:hidden">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: categoryColor }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{transaction.description}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(transaction.date).toLocaleDateString('en-IN')}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {categoryData.main} • {transaction.account}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-lg font-bold ${
                          transaction.type === 'Income' ? 'text-green-600' : 
                          transaction.type === 'Transfer' ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'Income' ? '+' : transaction.type === 'Transfer' ? '↔' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          {transaction.type}
                        </div>
                      </div>
                    </div>
                    
                    {transaction.tag && (
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Tag className="w-3 h-3 mr-1" />
                          {transaction.tag}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onEditTransaction(transaction)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: categoryColor }}
                      ></div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-1">
                          <p className="font-semibold text-gray-900 truncate">{transaction.description}</p>
                          {transaction.tag && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Tag className="w-3 h-3 mr-1" />
                              {transaction.tag}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(transaction.date).toLocaleDateString('en-IN')}
                          </span>
                          <span>{categoryData.main} • {categoryData.sub}</span>
                          <span className="flex items-center">
                            <CreditCard className="w-4 h-4 mr-1" />
                            {transaction.account}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          transaction.type === 'Income' ? 'text-green-600' : 
                          transaction.type === 'Transfer' ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'Income' ? '+' : transaction.type === 'Transfer' ? '↔' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          {transaction.type}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onEditTransaction(transaction)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsView;
