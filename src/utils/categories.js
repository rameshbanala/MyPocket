export const EXPENSE_CATEGORIES = [
  { id: 'rent', name: 'Rent / Accommodation', icon: '🏠', color: '#EF4444' },
  { id: 'food', name: 'Food & Groceries', icon: '🍔', color: '#F97316' },
  { id: 'travel', name: 'Travel & Transport', icon: '🚗', color: '#3B82F6' },
  { id: 'mobile', name: 'Mobile & Internet', icon: '📱', color: '#8B5CF6' },
  { id: 'utilities', name: 'Utilities', icon: '💡', color: '#EAB308' },
  { id: 'health', name: 'Health & Medical', icon: '🏥', color: '#EC4899' },
  { id: 'shopping', name: 'Shopping (Personal)', icon: '🛒', color: '#06B6D4' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#84CC16' },
  {
    id: 'education',
    name: 'Education / Courses',
    icon: '📚',
    color: '#6366F1',
  },
  { id: 'gifts', name: 'Gifts & Donations', icon: '🎁', color: '#F43F5E' },
  { id: 'emergency', name: 'Emergency', icon: '⚠️', color: '#DC2626' },
  {
    id: 'savings',
    name: 'Savings / Investments',
    icon: '💰',
    color: '#059669',
  },
  { id: 'cash', name: 'Cash Withdrawals', icon: '💳', color: '#64748B' },
  { id: 'miscellaneous', name: 'Miscellaneous', icon: '📦', color: '#6B7280' },
];

export const INCOME_CATEGORIES = [
  { id: 'salary', name: 'Salary / Wage', icon: '💼', color: '#059669' },
  { id: 'freelance', name: 'Freelancing', icon: '💻', color: '#3B82F6' },
  { id: 'business', name: 'Business Income', icon: '🏢', color: '#DC2626' },
  {
    id: 'investment',
    name: 'Investment Returns',
    icon: '📈',
    color: '#7C3AED',
  },
  { id: 'rental', name: 'Rental Income', icon: '🏠', color: '#059669' },
  { id: 'bonus', name: 'Bonus / Commission', icon: '🎯', color: '#EA580C' },
  { id: 'gift', name: 'Gifts Received', icon: '🎁', color: '#EC4899' },
  { id: 'refund', name: 'Refunds', icon: '🔄', color: '#0891B2' },
  { id: 'cashback', name: 'Cashback / Rewards', icon: '💳', color: '#65A30D' },
  {
    id: 'scholarship',
    name: 'Scholarship / Grant',
    icon: '🎓',
    color: '#7C2D12',
  },
  { id: 'family', name: 'Family Support', icon: '👨‍👩‍👧‍👦', color: '#BE185D' },
  { id: 'others', name: 'Other Income', icon: '💡', color: '#6B7280' },
];

export const getCategoryById = (categories, id) => {
  return categories.find(category => category.id === id);
};

export const getCategoryColor = (categories, id) => {
  const category = getCategoryById(categories, id);
  return category ? category.color : '#6B7280';
};
