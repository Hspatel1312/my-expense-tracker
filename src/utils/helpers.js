export const getTransactionType = (category) => {
  if (category.includes('Income')) return 'Income';
  if (category.includes('Transfer')) return 'Transfer';
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

export const formatDateForInput = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
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
