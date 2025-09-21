import crypto from 'crypto';

/**
 * Generate a unique order ID
 * Format: EDU-YYYY-MMDD-XXXX (where X is random alphanumeric)
 */
export const generateOrderId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  
  return `EDU-${year}-${month}${day}-${random}`;
};

/**
 * Calculate total amount from installments
 */
export const calculateTotalAmount = (installments) => {
  return installments.reduce((sum, installment) => sum + installment.amount, 0);
};

/**
 * Validate installment dates
 * - All dates must be in the future
 * - Dates must be in ascending order
 */
export const validateInstallmentDates = (installments) => {
  const now = new Date();
  const dates = installments.map(i => new Date(i.dueDate));
  
  // Check if all dates are in the future
  const allFuture = dates.every(date => date > now);
  if (!allFuture) {
    throw new Error('All installment dates must be in the future');
  }
  
  // Check if dates are in ascending order
  for (let i = 1; i < dates.length; i++) {
    if (dates[i] <= dates[i-1]) {
      throw new Error('Installment dates must be in ascending order');
    }
  }
  
  return true;
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

/**
 * Format date to local string
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Calculate progress percentage
 */
export const calculateProgress = (completed, total) => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}; 