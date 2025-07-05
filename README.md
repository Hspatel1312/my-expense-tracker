# Personal Expense Tracker

A modern, responsive expense tracking application built with React that syncs with Google Sheets.

## Features

- 📊 **Dashboard Analytics** - Visual overview of your finances
- 💰 **Real-time Balance Tracking** - Monitor account balances across multiple accounts
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- ☁️ **Google Sheets Integration** - Automatic sync with your spreadsheet
- 🏷️ **Smart Categorization** - Automatic transaction type detection
- 🔍 **Advanced Filtering** - Search and filter transactions easily
- 📈 **Visual Analytics** - Pie charts and expense distribution

## Quick Start

### Prerequisites
- Node.js 16+ 
- A Google account with Sheets API access
- Google Sheets spreadsheet set up with proper structure

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd expense-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Google API credentials:
   ```
   REACT_APP_GOOGLE_SHEETS_API_KEY=your_api_key
   REACT_APP_GOOGLE_SHEETS_CLIENT_ID=your_client_id  
   REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Google Sheets Setup

Your Google Sheets document should have:

### Transactions Sheet (columns A-I):
- A: Date
- B: Amount  
- C: Category
- D: Description
- E: Tag
- F: Account
- G: (Reserved)
- H: (Reserved)
- I: Type

### Data Sheet (columns E-G):
- E: Account Names
- F: Starting Balance
- G: Ending Balance

## Deployment

### Netlify Deployment

1. **Connect your GitHub repository to Netlify**

2. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `build`

3. **Set environment variables in Netlify:**
   - `REACT_APP_GOOGLE_SHEETS_API_KEY`
   - `REACT_APP_GOOGLE_SHEETS_CLIENT_ID`
   - `REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID`

4. **Deploy!**

## Tech Stack

- **Frontend:** React 18, Tailwind CSS
- **Charts:** Recharts
- **Icons:** Lucide React
- **Backend:** Google Sheets API
- **Hosting:** Netlify

## Project Structure

```
src/
├── components/          # Reusable UI components
├── constants/          # App configuration and constants
├── hooks/             # Custom React hooks
├── utils/             # Helper functions
├── App.jsx            # Main application component
├── index.js           # React entry point
└── index.css          # Global styles
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please file an issue on GitHub.
