import React from 'react';
import { X, Cloud, RefreshCw, CheckCircle } from 'lucide-react';

const SyncModal = ({ 
  isVisible, 
  onClose, 
  googleSheets, 
  expenseTracker 
}) => {
  const {
    gapiLoaded,
    sheetsConfig,
    syncStatus,
    isLoading,
    connectToGoogleSheets,
    manualSync
  } = googleSheets;

  const { masterData, transactions, balances } = expenseTracker;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 transition-all duration-300 opacity-100 visible">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose}></div>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-500 scale-100 translate-y-0 border border-white/20">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl">
                  <Cloud className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Google Sheets Sync</h2>
                  <p className="text-gray-500">Connection status</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-gray-700 mb-2">Status:</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Google API Loaded:</span>
                  <span className={gapiLoaded ? 'text-green-600' : 'text-red-600'}>
                    {gapiLoaded ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sheets Connected:</span>
                  <span className={sheetsConfig.isConnected ? 'text-green-600' : 'text-red-600'}>
                    {sheetsConfig.isConnected ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sync Status:</span>
                  <span className={syncStatus === 'success' ? 'text-green-600' : syncStatus === 'error' ? 'text-red-600' : 'text-blue-600'}>
                    {syncStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Accounts:</span>
                  <span>{masterData.accounts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transactions:</span>
                  <span>{transactions.length}</span>
                </div>
              </div>
            </div>

            {!sheetsConfig.isConnected ? (
              <div className="space-y-4">
                <button
                  onClick={connectToGoogleSheets}
                  disabled={isLoading || !gapiLoaded}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Connecting...</span>
                    </div>
                  ) : !gapiLoaded ? (
                    'Loading Google API...'
                  ) : (
                    'Connect to Google Sheets'
                  )}
                </button>
                
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800 mb-2">
                    <strong>Note:</strong>
                  </p>
                  <p className="text-sm text-amber-700">
                    You'll be prompted to sign in to Google and authorize access to your spreadsheet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Connected Successfully!</p>
                      <p className="text-sm text-green-700">
                        {transactions.length} transactions loaded • {Object.keys(balances).length} accounts found
                      </p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={manualSync}
                  disabled={syncStatus === 'syncing'}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {syncStatus === 'syncing' ? (
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Syncing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4" />
                      <span>Sync Now</span>
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
