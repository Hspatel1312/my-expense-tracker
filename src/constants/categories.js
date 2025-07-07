export const categoryColors = {
  'Food': '#FF6B6B',
  'Social Life': '#4ECDC4',
  'Entertainment': '#45B7D1',
  'Fuel': '#FFA726',
  'Culture': '#66BB6A',
  'Household': '#42A5F5',
  'Apparel': '#AB47BC',
  'Beauty': '#EC407A',
  'Health': '#26A69A',
  'Education': '#5C6BC0',
  'Transportation': '#78909C',
  'Vyomi': '#26C6DA',
  'Vacation': '#FF7043',
  'Subscriptions': '#9CCC65',
  'Misc': '#8D6E63',
  'Income': '#66BB6A'
};

// 🔥 UPDATED: Fallback categories (will be replaced by Google Sheets data)
export const masterCategories = [
  { main: 'Food', sub: 'Food', combined: 'Food > Food' },
  { main: 'Social Life', sub: 'Social Life', combined: 'Social Life > Social Life' },
  { main: 'Entertainment', sub: 'Entertainment', combined: 'Entertainment > Entertainment' },
  { main: 'Fuel', sub: 'Eon', combined: 'Fuel > Eon' },
  { main: 'Fuel', sub: 'Honda City', combined: 'Fuel > Honda City' },
  { main: 'Fuel', sub: 'Aviator', combined: 'Fuel > Aviator' },
  { main: 'Culture', sub: 'Culture', combined: 'Culture > Culture' },
  { main: 'Household', sub: 'Grocery', combined: 'Household > Grocery' },
  { main: 'Household', sub: 'Laundry', combined: 'Household > Laundry' },
  { main: 'Household', sub: 'House Help', combined: 'Household > House Help' },
  { main: 'Household', sub: 'Appliances', combined: 'Household > Appliances' },
  { main: 'Household', sub: 'Bills', combined: 'Household > Bills' },
  { main: 'Apparel', sub: 'Apparel', combined: 'Apparel > Apparel' },
  { main: 'Beauty', sub: 'Beauty', combined: 'Beauty > Beauty' },
  { main: 'Health', sub: 'Preventive', combined: 'Health > Preventive' },
  { main: 'Health', sub: 'Medical', combined: 'Health > Medical' },
  { main: 'Education', sub: 'Education', combined: 'Education > Education' },
  { main: 'Transportation', sub: 'Maintenance', combined: 'Transportation > Maintenance' },
  { main: 'Transportation', sub: 'Insurance', combined: 'Transportation > Insurance' },
  { main: 'Vyomi', sub: 'Vyomi', combined: 'Vyomi > Vyomi' },
  { main: 'Vacation', sub: 'Family', combined: 'Vacation > Family' },
  { main: 'Vacation', sub: 'Own', combined: 'Vacation > Own' },
  { main: 'Subscriptions', sub: 'Subscriptions', combined: 'Subscriptions > Subscriptions' },
  { main: 'Misc', sub: 'Misc', combined: 'Misc > Misc' },
  { main: 'Income', sub: 'Income', combined: 'Income > Income' },
  { main: 'Income', sub: 'Reload', combined: 'Income > Reload' },
  { main: 'Income', sub: 'Others', combined: 'Income > Others' }
];

// 🔥 NEW: Function to process categories from Google Sheets
export const processCategoriesFromSheets = (sheetsData) => {
  if (!sheetsData || !Array.isArray(sheetsData)) {
    console.log('📋 No valid sheets data, using fallback categories');
    return masterCategories;
  }

  const categories = [];
  
  sheetsData.forEach((row, index) => {
    if (row && row.length >= 3) {
      const main = row[0] ? row[0].toString().trim() : '';
      const sub = row[1] ? row[1].toString().trim() : '';
      const combined = row[2] ? row[2].toString().trim() : '';
      
      if (main && sub && combined) {
        categories.push({
          main: main,
          sub: sub,
          combined: combined
        });
        
        console.log(`📋 Processed category ${index + 1}:`, { main, sub, combined });
      }
    }
  });
  
  console.log('📋 Total categories processed from sheets:', categories.length);
  
  // If no categories were processed, return fallback
  return categories.length > 0 ? categories : masterCategories;
};
