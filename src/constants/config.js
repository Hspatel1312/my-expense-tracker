export const SHEETS_CONFIG = {
  spreadsheetId: process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID || '1F_dHrcPRz4KFISVQFnOPYD37VWZBKlkIgyLLm66Enlg',
  apiKey: process.env.REACT_APP_GOOGLE_SHEETS_API_KEY || 'AIzaSyCxpGczSKU6rtG36mPAlU7I8QuG3Z-gMeo',
  clientId: process.env.REACT_APP_GOOGLE_SHEETS_CLIENT_ID || '130621204284-j2gk44qb30mvkd4pm7soav68nphtfkok.apps.googleusercontent.com',
  TRANSACTIONS_RANGE: 'Transactions!A:I',
  ACCOUNTS_RANGE: 'Data!E:G'
};

// Debug: Log configuration (remove after testing)
console.log('🔧 Debug - Google Sheets Configuration:');
console.log('API Key:', SHEETS_CONFIG.apiKey ? `${SHEETS_CONFIG.apiKey.substring(0, 10)}...` : 'NOT SET');
console.log('Client ID:', SHEETS_CONFIG.clientId ? `${SHEETS_CONFIG.clientId.substring(0, 15)}...` : 'NOT SET');
console.log('Spreadsheet ID:', SHEETS_CONFIG.spreadsheetId ? `${SHEETS_CONFIG.spreadsheetId.substring(0, 15)}...` : 'NOT SET');
console.log('Environment Variables:');
console.log('- REACT_APP_GOOGLE_SHEETS_API_KEY:', process.env.REACT_APP_GOOGLE_SHEETS_API_KEY ? 'SET' : 'NOT SET');
console.log('- REACT_APP_GOOGLE_SHEETS_CLIENT_ID:', process.env.REACT_APP_GOOGLE_SHEETS_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('- REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID:', process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID ? 'SET' : 'NOT SET');
