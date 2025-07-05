export const SHEETS_CONFIG = {
  spreadsheetId: process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID || '1F_dHrcPRz4KFISVQFnOPYD37VWZBKlkIgyLLm66Enlg',
  apiKey: process.env.REACT_APP_GOOGLE_SHEETS_API_KEY || 'AIzaSyCxpGczSKU6rtG36mPAlU7I8QuG3Z-gMeo',
  clientId: process.env.REACT_APP_GOOGLE_SHEETS_CLIENT_ID || '130621204284-j2gk44qb30mvkd4pm7soav68nphtfkok.apps.googleusercontent.com',
  TRANSACTIONS_RANGE: 'Transactions!A:I',
  ACCOUNTS_RANGE: 'Data!E:G'
};
