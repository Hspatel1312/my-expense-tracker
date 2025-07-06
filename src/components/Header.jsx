import React from 'react';
import { Wallet, Eye, EyeOff, Cloud, CloudOff } from 'lucide-react';

const Header = ({ 
  transactions, 
  sheetsConfig, 
  gapiLoaded, 
  balanceVisible, 
  totalBalance, 
  setBalanceVisible, 
  setShowSyncModal 
}) => {
  return (
    <div className="relative bg-white/80 backdrop-blur-2xl border-b border-gray-200/30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 sm:py-6">
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            {/* Top Row - Logo and Balance Toggle */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Expense Tracker</h1>
                  <p className="text-xs text-gray-600">
                    {transactions.length} transactions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg transition-all duration-200"
              >
                {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Balance Display */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 mb-3 border border-blue-100">
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 mb-1">Total Balance</div>
                <div className="text-2xl font-bold text-gray-900">
                  {balanceVisible ? `₹${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '••••••••'}
                </div>
              </div>
            </div>
            
            {/* Sync Status and Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${sheetsConfig.isConnected ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                <span className="text-xs text-gray-600">
                  {sheetsConfig.isConnected ? 'Synced with Google Sheets' : 
                   gapiLoaded ? 'Not connected' : 'Loading...'}
                </span>
              </div>
              <button
                onClick={() => setShowSyncModal(true)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  sheetsConfig.isConnected 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {sheetsConfig.isConnected ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
                <span>{sheetsConfig.isConnected ? 'Connected' : 'Connect'}</span>
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Expense Tracker</h1>
                <p className="text-gray-600 font-medium">
                  {transactions.length} transactions • {
                    sheetsConfig.isConnected ? 'Synced with Google Sheets' : 
                    gapiLoaded ? 'Connecting...' : 'Loading Google API...'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setShowSyncModal(true)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                  sheetsConfig.isConnected 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {sheetsConfig.isConnected ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
                <span className="text-sm font-medium">
                  {sheetsConfig.isConnected ? 'Connected' : 'Connect Sheets'}
                </span>
              </button>
              
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="p-3 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-xl transition-all duration-200"
              >
                {balanceVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-500">Total Balance</div>
                <div className="text-3xl font-bold text-gray-900">
                  {balanceVisible ? `₹${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '••••••••'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
