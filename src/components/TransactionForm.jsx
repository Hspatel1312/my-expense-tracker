import React, { useState, useEffect } from 'react';
import { X, Sparkles, RefreshCw } from 'lucide-react';
import { parseCategory, getTransactionType } from '../utils/helpers';

const TransactionForm = ({ 
  isVisible, 
  onClose, 
  expenseTracker, 
  googleSheets, 
  onSubmit 
}) => {
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const {
    formData,
    setFormData,
    validationErrors,
    editingTransaction,
    masterData,
    resetForm,
    getCategoryColor
  } = expenseTracker;

  // Filtered data for dropdowns - using combined format for categories
  const filteredCategories = masterData.categories.filter(cat =>
    cat.combined.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredAccounts = masterData.accounts.filter(acc =>
    acc.toLowerCase().includes(accountSearch.toLowerCase())
  );

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

  // Update search fields when editing
  useEffect(() => {
    if (editingTransaction) {
      setCategorySearch(editingTransaction.category);
      setAccountSearch(editingTransaction.account);
    }
  }, [editingTransaction]);

  const handleClose = () => {
    onClose();
    resetForm();
    setCategorySearch('');
    setAccountSearch('');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 transition-all duration-300 opacity-100 visible">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose}></div>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-500 scale-100 translate-y-0 border border-gray-300">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {googleSheets.sheetsConfig.isConnected ? 
                      `Will sync to Google Sheets automatically • ${masterData.categories.length} categories available` : 
                      'Will be saved locally'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                    validationErrors.date ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {validationErrors.date && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.date}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Amount (₹)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                    validationErrors.amount ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="0.00"
                />
                {validationErrors.amount && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.amount}</p>
                )}
              </div>
              
              <div className="space-y-2 relative category-dropdown">
                <label className="text-sm font-semibold text-gray-700">
                  Category 
                  {masterData.categories.length > 0 && (
                    <span className="text-xs text-gray-500 ml-1">({masterData.categories.length} available)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => {
                    setCategorySearch(e.target.value);
                    setFormData({...formData, category: e.target.value});
                    setShowCategoryDropdown(true);
                  }}
                  onFocus={() => setShowCategoryDropdown(true)}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                    validationErrors.category ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder={masterData.categories.length > 0 ? "Start typing category..." : "Connect to Google Sheets to load categories"}
                  disabled={masterData.categories.length === 0}
                />
                {validationErrors.category && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.category}</p>
                )}
                
                {/* Category Dropdown */}
                {showCategoryDropdown && filteredCategories.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                    {filteredCategories.slice(0, 10).map((cat, index) => {
                      const categoryData = parseCategory(cat.combined);
                      return (
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
                            style={{ backgroundColor: getCategoryColor(categoryData.main) }}
                          ></div>
                          <div className="flex-1">
                            <span className="text-sm font-medium">{cat.combined}</span>
                            <div className="text-xs text-gray-500">
                              {categoryData.main} → {categoryData.sub}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    
                    {/* Show message if no categories loaded */}
                    {masterData.categories.length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        Connect to Google Sheets to load categories
                      </div>
                    )}
                  </div>
                )}
                
                {/* No categories warning */}
                {masterData.categories.length === 0 && googleSheets.sheetsConfig.isConnected && (
                  <p className="text-amber-600 text-xs mt-1">
                    No categories found in Google Sheets. Check the Data sheet columns A-C.
                  </p>
                )}
              </div>
              
              <div className="space-y-2 relative account-dropdown">
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
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                    validationErrors.account ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Select account..."
                />
                {validationErrors.account && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.account}</p>
                )}
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
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm">{acc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-gray-700">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                    validationErrors.description ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Enter description..."
                />
                {validationErrors.description && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.description}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Tag (Optional)</label>
                <input
                  type="text"
                  value={formData.tag}
                  onChange={(e) => setFormData({...formData, tag: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
                  placeholder="Enter tag..."
                />
              </div>
              
              {formData.category && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Auto-detected</label>
                  <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getCategoryColor(parseCategory(formData.category).main) }}
                      ></div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-blue-900">
                          Type: {getTransactionType(formData.category)}
                        </span>
                        <div className="text-xs text-blue-600 mt-1">
                          {parseCategory(formData.category).main} → {parseCategory(formData.category).sub}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-6 sm:mt-8">
              <button
                onClick={handleClose}
                className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={googleSheets.isLoading || masterData.categories.length === 0}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleSheets.isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{editingTransaction ? 'Updating...' : 'Adding...'}</span>
                  </div>
                ) : masterData.categories.length === 0 ? (
                  'Connect to Google Sheets first'
                ) : (
                  editingTransaction ? 'Update Transaction' : 'Add Transaction'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;
