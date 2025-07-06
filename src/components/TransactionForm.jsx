import React, { useState, useEffect } from 'react';
import { X, Sparkles, RefreshCw } from 'lucide-react';
import { categoryColors } from '../constants/categories';
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
    resetForm
  } = expenseTracker;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isVisible) {
      // Store original body overflow
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      return () => {
        // Restore original body scroll
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = '';
        document.body.style.height = '';
      };
    }
  }, [isVisible]);

  // Filtered data for dropdowns
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
    <>
      {/* Enhanced Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
          onClick={handleClose}
        />
        
        {/* Modal Container - Fixed positioning for mobile */}
        <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl transform transition-all duration-500 scale-100 translate-y-0 border border-gray-200 overflow-hidden">
          
          {/* Modal Header - Fixed */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-100 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {googleSheets.sheetsConfig.isConnected ? 'Will sync to Google Sheets automatically' : 'Will be saved locally'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-110"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] scrollbar-hide">
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Date Field */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <span>Date</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className={`w-full px-4 py-3 bg-gray-50/80 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                      validationErrors.date ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                  {validationErrors.date && (
                    <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{validationErrors.date}</span>
                    </p>
                  )}
                </div>
                
                {/* Amount Field */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <span>Amount (₹)</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className={`w-full px-4 py-3 bg-gray-50/80 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                      validationErrors.amount ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {validationErrors.amount && (
                    <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{validationErrors.amount}</span>
                    </p>
                  )}
                </div>
                
                {/* Category Field */}
                <div className="space-y-2 relative category-dropdown">
                  <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <span>Category</span>
                    <span className="text-red-400">*</span>
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
                    className={`w-full px-4 py-3 bg-gray-50/80 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                      validationErrors.category ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Start typing category..."
                  />
                  {validationErrors.category && (
                    <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{validationErrors.category}</span>
                    </p>
                  )}
                  {showCategoryDropdown && filteredCategories.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-20 mt-1">
                      {filteredCategories.slice(0, 10).map((cat, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setCategorySearch(cat.combined);
                            setFormData({...formData, category: cat.combined});
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center space-x-3 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          <div 
                            className="w-3 h-3 rounded-full shadow-sm" 
                            style={{ backgroundColor: categoryColors[cat.main] || '#9CA3AF' }}
                          ></div>
                          <span className="text-sm font-medium">{cat.combined}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Account Field */}
                <div className="space-y-2 relative account-dropdown">
                  <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <span>Account</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountSearch}
                    onChange={(e) => {
                      setAccountSearch(e.target.value);
                      setFormData({...formData, account: e.target.value});
                      setShowAccountDropdown(true);
                    }}
                    onFocus={() => setShowAccountDropdown(true)}
                    className={`w-full px-4 py-3 bg-gray-50/80 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                      validationErrors.account ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Select account..."
                  />
                  {validationErrors.account && (
                    <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{validationErrors.account}</span>
                    </p>
                  )}
                  {showAccountDropdown && filteredAccounts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-32 overflow-y-auto z-20 mt-1">
                      {filteredAccounts.map((acc, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setAccountSearch(acc);
                            setFormData({...formData, account: acc});
                            setShowAccountDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-sm font-medium first:rounded-t-xl last:rounded-b-xl"
                        >
                          {acc}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Description Field - Full Width */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <span>Description</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className={`w-full px-4 py-3 bg-gray-50/80 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 ${
                      validationErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Enter description..."
                  />
                  {validationErrors.description && (
                    <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{validationErrors.description}</span>
                    </p>
                  )}
                </div>
                
                {/* Tag Field */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Tag (Optional)</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({...formData, tag: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 hover:border-gray-300"
                    placeholder="Enter tag..."
                  />
                </div>
                
                {/* Auto-detected Info */}
                {formData.category && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Auto-detected</label>
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
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
            </div>
          </div>
          
          {/* Fixed Footer with Actions */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleClose}
                className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={googleSheets.isLoading}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {googleSheets.isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{editingTransaction ? 'Updating...' : 'Adding...'}</span>
                  </div>
                ) : (
                  editingTransaction ? 'Update Transaction' : 'Add Transaction'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

export default TransactionForm;
