// Fixed config.js - ensure no ID duplication
export const SHEETS_CONFIG = {
  spreadsheetId: process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID || '1F_dHrcPRz4KFISVQFnOPYD37VWZBKlkIgyLLm66Enlg',
  apiKey: process.env.REACT_APP_GOOGLE_SHEETS_API_KEY || 'AIzaSyCxpGczSKU6rtG36mPAlU7I8QuG3Z-gMeo',
  clientId: process.env.REACT_APP_GOOGLE_SHEETS_CLIENT_ID || '130621204284-j2gk44qb30mvkd4pm7soav68nphtfkok.apps.googleusercontent.com',
  TRANSACTIONS_RANGE: 'Transactions!A:I',
  ACCOUNTS_RANGE: 'Data!E:G'
};

// Debug: Log configuration with safety checks
console.log('🔧 Debug - Google Sheets Configuration:');
console.log('Spreadsheet ID:', SHEETS_CONFIG.spreadsheetId);
console.log('Spreadsheet ID Length:', SHEETS_CONFIG.spreadsheetId?.length);
console.log('API Key:', SHEETS_CONFIG.apiKey ? `${SHEETS_CONFIG.apiKey.substring(0, 10)}...` : 'NOT SET');
console.log('Client ID:', SHEETS_CONFIG.clientId ? `${SHEETS_CONFIG.clientId.substring(0, 15)}...` : 'NOT SET');

// Validate spreadsheet ID format
if (SHEETS_CONFIG.spreadsheetId) {
  const expectedLength = 44; // Standard Google Sheets ID length
  if (SHEETS_CONFIG.spreadsheetId.length !== expectedLength) {
    console.error('❌ WARNING: Spreadsheet ID length is incorrect!');
    console.error('Expected length:', expectedLength);
    console.error('Actual length:', SHEETS_CONFIG.spreadsheetId.length);
    console.error('ID:', SHEETS_CONFIG.spreadsheetId);
  } else {
    console.log('✅ Spreadsheet ID format looks correct');
  }
}
