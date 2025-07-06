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

  // Prevent body scroll when modal is open - Enhanced for mobile
  useEffect(() => {
    if (isVisible) {
      // Get current scroll position
      const scrollY = window.scrollY;
      
      // Prevent body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore body scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
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
      {/* Fixed Modal Overlay - Mobile Optimized */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
          onClick={handleClose}
        />
        
        {/* Modal Container - Mobile: Full screen, Desktop: Centered */}
        <div className="relative w-full h-full sm:w-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] bg-white sm:rounded-3xl shadow-2xl transform transition-all duration-500 scale-100 translate-y-0 border-t-4 sm:border-t-0 sm:border border-gray-200 flex flex-col">
          
          {/* Modal Header - Fixed at top */}
          <div className="flex-shrink-0 bg-white sm:bg-white/95 sm:backdrop-blur-xl border-b border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl sm:rounded-2xl shadow-lg">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    {googleSheets.sheetsConfig.isConnected ? 'Will sync to Google Sheets automatically' : 'Will be saved locally'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-110"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
          
          {/* Scrollable Content Area - This is the key fix */}
          <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pb-24 sm:pb-6">
              
              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                
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
                    inputMode="decimal"
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
          
          {/* Fixed Footer with Actions - Mobile: Floating at bottom */}
          <div className="flex-shrink-0 fixed sm:sticky bottom-0 left-0 right-0 sm:relative bg-white/95 backdrop-blur-xl border-t border-gray-200 p-4 sm:p-6 shadow-lg sm:shadow-none">
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleClose}
                className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={googleSheets.isLoading}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none order-1 sm:order-2"
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

      {/* Custom Styles */}
      <style jsx>{`
        /* Ensure smooth scrolling on iOS */
        .overscroll-contain {
          overscroll-behavior: contain;
        }
        
        /* Custom scrollbar for webkit browsers */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        /* Mobile specific adjustments */
        @media (max-width: 640px) {
          .modal-container {
            height: 100vh;
            height: 100dvh; /* Dynamic viewport height for mobile */
          }
        }
      `}</style>
    </>
  );
};

export default TransactionForm;
