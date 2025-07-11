import React, { useState, useEffect } from 'react';
import { PlusCircle, BarChart3, CreditCard, PieChart, RefreshCw, CheckCircle, AlertTriangle, X } from 'lucide-react';

import Header from './components/Header';
import DashboardView from './components/DashboardView';
import AnalyticsView from './components/AnalyticsView';
import TransactionsView from './components/TransactionsView';
import TransactionForm from './components/TransactionForm';
import SyncModal from './components/SyncModal';
import { useExpenseTracker } from './hooks/useExpenseTracker';
import { useGoogleSheets } from './hooks/useGoogleSheets';

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Custom hooks
  const expenseTracker = useExpenseTracker();
  const googleSheets = useGoogleSheets();

  // Function to update app state with data
  const updateAppState = (data) => {
    if (!data) return;
    
    console.log('📊 Updating app state with data:', data);
    
    if (data.balances) {
      expenseTracker.setBalances(data.balances);
    }
    
    if (data.accounts) {
      expenseTracker.updateMasterData({ accounts: data.accounts });
    }
    
    if (data.categories) {
      console.log('📂 Setting categories:', data.categories.length, 'categories');
      expenseTracker.updateMasterData({ categories: data.categories });
    }
    
    if (data.transactions) {
      expenseTracker.setTransactions(data.transactions);
    }
    
    setDataLoaded(true);
    console.log('✅ App state updated successfully');
  };

  // Handle connection success with immediate data
  useEffect(() => {
    // Check for data loaded during connection
    if (window.expenseTrackerData && !dataLoaded) {
      console.log('🎯 Found data from connection, using immediately...');
      const data = window.expenseTrackerData;
      updateAppState(data);
      // Clear the temporary storage
      delete window.expenseTrackerData;
    }
  }, [dataLoaded]);

  // Handle connection state changes
  useEffect(() => {
    const handleConnectionChange = async () => {
      if (googleSheets.sheetsConfig.isConnected && !dataLoaded && !window.expenseTrackerData) {
        console.log('🔄 Connection established, syncing data...');
        try {
          const data = await googleSheets.manualSync();
          updateAppState(data);
        } catch (error) {
          console.error('❌ Sync failed:', error);
          setError('Failed to sync with Google Sheets');
        }
      }
    };

    handleConnectionChange();
  }, [googleSheets.sheetsConfig.isConnected, googleSheets.manualSync, dataLoaded]);

  // Handle form submission
  const handleAddTransaction = async () => {
    const success = await expenseTracker.addTransaction(
      googleSheets.addTransactionToSheets
    );
    
    if (success) {
      setIsFormVisible(false);
    }
  };

  // Handle delete transaction with sheets integration
  const handleDeleteTransaction = async (transactionId) => {
    console.log('🗑️ App: handleDeleteTransaction called with ID:', transactionId);
    
    const transaction = expenseTracker.transactions.find(t => t.id === transactionId);
    
    console.log('🔍 App: Found transaction:', {
      id: transactionId,
      transaction: transaction,
      description: transaction?.description,
      sheetRow: transaction?.sheetRow,
      source: transaction?.source,
      synced: transaction?.synced
    });
    
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      console.log('🚫 App: User cancelled deletion');
      return;
    }
    
    console.log('✅ App: User confirmed deletion, proceeding...');
    
    // Try to delete from sheets if it's a synced transaction with a sheet row
    if (transaction?.sheetRow && (transaction?.synced || transaction?.source === 'sheets')) {
      console.log('🔗 App: Attempting to delete from Google Sheets...');
      console.log('🔗 App: Google Sheets hook available:', !!googleSheets.deleteTransactionFromSheets);
      
      try {
        const sheetsDeleteResult = await googleSheets.deleteTransactionFromSheets(transaction);
        console.log('📊 App: Sheets deletion result:', sheetsDeleteResult);
        
        if (sheetsDeleteResult) {
          console.log('✅ App: Successfully deleted from Google Sheets');
        } else {
          console.log('⚠️ App: Failed to delete from Google Sheets, but continuing with local deletion');
        }
      } catch (error) {
        console.error('❌ App: Error during sheets deletion:', error);
        // Continue with local deletion even if sheets deletion fails
      }
    } else {
      console.log('ℹ️ App: Skipping sheets deletion because:', {
        hasSheetRow: !!transaction?.sheetRow,
        isSynced: !!transaction?.synced,
        isFromSheets: transaction?.source === 'sheets',
        reason: !transaction?.sheetRow ? 'No sheet row' : 
                (!transaction?.synced && transaction?.source !== 'sheets') ? 'Not synced or from sheets' : 
                'Unknown'
      });
    }
    
    // Delete from local state
    console.log('🏠 App: Calling expenseTracker.deleteTransaction...');
    const localDeleteResult = expenseTracker.deleteTransaction(transactionId);
    console.log('🏠 App: Local deletion result:', localDeleteResult);
    console.log('✅ App: Deletion process completed');
  };

  // Handle manual sync
  const handleManualSync = async () => {
    try {
      console.log('🔄 Manual sync requested...');
      const data = await googleSheets.manualSync();
      updateAppState(data);
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
      setError('Failed to sync with Google Sheets');
    }
  };

  // Handle connection with data loading
  const handleConnect = async () => {
    try {
      console.log('🔄 Connecting to Google Sheets...');
      const data = await googleSheets.connectToGoogleSheets();
      updateAppState(data);
    } catch (error) {
      console.error('❌ Connection failed:', error);
      setError('Failed to connect to Google Sheets');
    }
  };

  // Handle edit transaction
  const handleEditTransaction = (transaction) => {
    expenseTracker.editTransaction(transaction);
    setIsFormVisible(true);
  };

  // Navigation items
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      component: <DashboardView expenseTracker={expenseTracker} googleSheets={googleSheets} />
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: PieChart,
      component: <AnalyticsView expenseTracker={expenseTracker} />
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: CreditCard,
      count: expenseTracker.filteredTransactions.length,
      component: <TransactionsView expenseTracker={expenseTracker} onEditTransaction={handleEditTransaction} />
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Add mobile-specific styles */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Ensure viewport meta tag behavior */
        @media (max-width: 640px) {
          body {
            overflow-x: hidden;
          }
        }
      `}</style>

      {/* Loading Overlay */}
      {googleSheets.isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl mx-4">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-base sm:text-lg font-medium">
                {expenseTracker.editingTransaction ? 'Updating transaction...' : 'Syncing with Google Sheets...'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 z-50 max-w-md sm:w-full">
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800 ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Loading Status */}
      {dataLoaded && expenseTracker.masterData.categories.length === 0 && googleSheets.sheetsConfig.isConnected && (
        <div className="fixed top-20 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 z-40 max-w-md sm:w-full">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl shadow-lg">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
              <span className="font-medium text-sm">Loading categories from Google Sheets...</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <Header 
        transactions={expenseTracker.transactions}
        sheetsConfig={googleSheets.sheetsConfig}
        gapiLoaded={googleSheets.gapiLoaded}
        balanceVisible={expenseTracker.balanceVisible}
        totalBalance={expenseTracker.totalBalance}
        setBalanceVisible={expenseTracker.setBalanceVisible}
        setShowSyncModal={setShowSyncModal}
      />

      {/* Navigation - Fixed Sticky Navigation */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Navigation - Horizontal Scroll */}
          <nav className="flex space-x-1 sm:space-x-8 overflow-x-auto scrollbar-hide py-2 sm:py-0">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    console.log('🔄 Navigation: Switching from', currentView, 'to', item.id);
                    setCurrentView(item.id);
                  }}
                  className={`py-3 sm:py-4 px-4 sm:px-1 border-b-2 font-semibold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 min-w-0 ${
                    currentView === item.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50/80'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
                    <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="truncate">
                      {item.label}
                      {item.count !== undefined && (
                        <span className="ml-1 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                          {item.count}
                        </span>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pt-6 sm:pt-8">
        {/* Sync Status Banner */}
        {googleSheets.syncStatus !== 'idle' && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border text-sm sm:text-base ${
            googleSheets.syncStatus === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            googleSheets.syncStatus === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                {googleSheets.syncStatus === 'syncing' && <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />}
                {googleSheets.syncStatus === 'success' && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />}
                {googleSheets.syncStatus === 'error' && <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />}
                <span className="font-medium">
                  {googleSheets.syncStatus === 'syncing' && 'Syncing with Google Sheets...'}
                  {googleSheets.syncStatus === 'success' && `Successfully synced! ${expenseTracker.masterData.categories.length} categories loaded.`}
                  {googleSheets.syncStatus === 'error' && 'Failed to sync with Google Sheets. Please try again.'}
                </span>
              </div>
              {googleSheets.syncStatus === 'error' && (
                <button
                  onClick={handleManualSync}
                  className="px-2 sm:px-3 py-1 bg-red-600 text-white rounded-lg text-xs sm:text-sm hover:bg-red-700 transition-colors flex-shrink-0"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        {/* Data Status Info */}
        {dataLoaded && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-800 font-medium">
                📊 Data Status: {expenseTracker.transactions.length} transactions, {expenseTracker.masterData.categories.length} categories, {Object.keys(expenseTracker.balances).length} accounts
              </span>
              {!googleSheets.sheetsConfig.isConnected && (
                <button
                  onClick={handleConnect}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
                >
                  Connect Sheets
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="relative">
          {currentView === 'dashboard' && (
            <div key="dashboard-view">
              <DashboardView expenseTracker={expenseTracker} googleSheets={googleSheets} />
            </div>
          )}
          {currentView === 'analytics' && (
            <div key="analytics-view">
              <AnalyticsView expenseTracker={expenseTracker} />
            </div>
          )}
          {currentView === 'transactions' && (
            <div key="transactions-view">
              <TransactionsView 
                expenseTracker={expenseTracker} 
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            </div>
          )}
          
          {/* Debug info */}
          <div className="fixed bottom-4 left-4 bg-black text-white px-2 py-1 rounded text-xs opacity-50">
            Current View: {currentView}
          </div>
        </div>
      </div>

      {/* Quick Add Button - Mobile Optimized */}
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50">
        <button
          onClick={() => setIsFormVisible(true)}
          className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3 sm:p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 border-2 border-white/20"
        >
          <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          
          {/* Mobile Label */}
          <span className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap sm:hidden">
            Add Transaction
          </span>
        </button>
      </div>

      {/* Transaction Form Modal */}
      <TransactionForm
        isVisible={isFormVisible}
        onClose={() => setIsFormVisible(false)}
        expenseTracker={expenseTracker}
        googleSheets={googleSheets}
        onSubmit={handleAddTransaction}
      />

      {/* Google Sheets Sync Modal */}
      <SyncModal
        isVisible={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        googleSheets={googleSheets}
        expenseTracker={expenseTracker}
        onConnect={handleConnect}
        onManualSync={handleManualSync}
      />
    </div>
  );
};

export default App;
