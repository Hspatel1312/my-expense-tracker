import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import { useExpenseTracker } from './hooks/useExpenseTracker';
import { useGoogleSheets } from './hooks/useGoogleSheets';

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [showSyncModal, setShowSyncModal] = useState(false);

  const expenseTracker = useExpenseTracker();
  const googleSheets = useGoogleSheets();

  // Sync data when Google Sheets connects
  useEffect(() => {
    if (googleSheets.sheetsConfig.isConnected) {
      googleSheets.manualSync()
        .then(data => {
          if (data) {
            expenseTracker.setBalances(data.balances);
            expenseTracker.setMasterData(prev => ({ 
              ...prev, 
              accounts: data.accounts 
            }));
            expenseTracker.setTransactions(data.transactions);
          }
        })
        .catch(console.error);
    }
  }, [googleSheets.sheetsConfig.isConnected]);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <Header 
        transactions={expenseTracker.transactions}
        sheetsConfig={googleSheets.sheetsConfig}
        gapiLoaded={googleSheets.gapiLoaded}
        balanceVisible={expenseTracker.balanceVisible}
        totalBalance={expenseTracker.totalBalance}
        setBalanceVisible={expenseTracker.setBalanceVisible}
        setShowSyncModal={setShowSyncModal}
      />
      
      {/* Add other components here */}
      <div className="p-8">
        <h2>Current View: {currentView}</h2>
        <p>Transactions: {expenseTracker.transactions.length}</p>
        <p>Connected: {googleSheets.sheetsConfig.isConnected ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
};

export default App;
