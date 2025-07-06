export const getTransactionType = (category) => {
  if (!category) return 'Expense'; // Default to Expense if no category
  
  const categoryLower = category.toLowerCase();
  
  // Check for income keywords
  if (categoryLower.includes('income') || 
      categoryLower.includes('salary') || 
      categoryLower.includes('reload') ||
      categoryLower.includes('refund')) {
    return 'Income';
  }
  
  // Check for transfer keywords
  if (categoryLower.includes('transfer') || 
      categoryLower.includes('withdrawal') ||
      categoryLower.includes('deposit')) {
    return 'Transfer';
  }
  
  // Default to Expense for all other categories
  return 'Expense';
};

export const parseCategory = (categoryString) => {
  if (!categoryString) return { main: '', sub: '' };
  const parts = categoryString.split('>').map(part => part.trim());
  return {
    main: parts[0] || '',
    sub: parts[1] || parts[0] || ''
  };
};

// FIXED: Timezone-safe date parsing function
export const formatDateForInput = (dateString) => {
  try {
    console.log('🔍 Date parsing - Input:', dateString);
    
    if (!dateString) {
      return new Date().toISOString().split('T')[0];
    }
    
    let date;
    
    // Handle different date formats with timezone safety
    if (dateString.includes('/') || dateString.includes('-')) {
      const separator = dateString.includes('/') ? '/' : '-';
      const parts = dateString.split(separator);
      
      if (parts.length === 3) {
        // Parse as DD/MM/YYYY or DD-MM-YYYY format
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
        const year = parseInt(parts[2]);
        
        // Handle 2-digit years (assume 20xx)
        const fullYear = year < 100 ? 2000 + year : year;
        
        console.log(`🔍 Parsed DD/MM/YYYY: ${day}/${month + 1}/${fullYear}`);
        
        // CRITICAL FIX: Create date in local timezone, not UTC
        // This prevents the timezone shift issue
        date = new Date(fullYear, month, day, 12, 0, 0, 0); // Set to noon to avoid DST issues
        
      } else {
        // Fallback: try to parse, but fix timezone
        const tempDate = new Date(dateString);
        // Extract just the date parts to avoid timezone issues
        date = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate(), 12, 0, 0, 0);
      }
    } else {
      // Try standard Date parsing but fix timezone
      const tempDate = new Date(dateString);
      // Extract just the date parts to avoid timezone issues  
      date = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate(), 12, 0, 0, 0);
    }
    
    // Validate the date
    if (isNaN(date.getTime())) {
      console.warn('⚠️ Invalid date, using current date');
      date = new Date();
      // Set to noon to avoid DST issues
      date.setHours(12, 0, 0, 0);
    }
    
    const result = date.toISOString().split('T')[0];
    console.log('🔍 Date parsing - Output:', result);
    console.log('🔍 Date object created:', date.toString());
    console.log('🔍 Date in local timezone:', date.toLocaleDateString('en-IN'));
    
    return result;
  } catch (error) {
    console.error('❌ Date parsing error:', error);
    const fallbackDate = new Date();
    fallbackDate.setHours(12, 0, 0, 0);
    return fallbackDate.toISOString().split('T')[0];
  }
};

// Alternative function specifically for Google Sheets date parsing
export const parseGoogleSheetsDate = (dateString) => {
  try {
    console.log('🔍 Google Sheets date parsing - Input:', dateString);
    
    if (!dateString) {
      return new Date().toISOString().split('T')[0];
    }
    
    // Handle DD/MM/YYYY format specifically (common in Google Sheets)
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // 0-indexed
        const year = parseInt(parts[2]);
        
        // Handle 2-digit years
        const fullYear = year < 100 ? 2000 + year : year;
        
        // Create date in local timezone at noon (avoids DST issues)
        const date = new Date(fullYear, month, day, 12, 0, 0, 0);
        
        console.log(`🔍 Google Sheets parsed: ${day}/${month + 1}/${fullYear} → ${date.toLocaleDateString('en-IN')}`);
        
        return date.toISOString().split('T')[0];
      }
    }
    
    // Fallback to the general function
    return formatDateForInput(dateString);
    
  } catch (error) {
    console.error('❌ Google Sheets date parsing error:', error);
    return formatDateForInput(dateString);
  }
};

export const validateForm = (formData) => {
  const errors = {};
  
  if (!formData.date) errors.date = 'Date is required';
  if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = 'Valid amount is required';
  if (!formData.category) errors.category = 'Category is required';
  if (!formData.description.trim()) errors.description = 'Description is required';
  if (!formData.account) errors.account = 'Account is required';
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

export const months = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' }, { value: '4', label: 'April' },
  { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' },
  { value: '9', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' }
];

export const getYears = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - i);
};
