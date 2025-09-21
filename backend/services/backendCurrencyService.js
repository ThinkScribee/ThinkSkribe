import axios from 'axios';

class BackendCurrencyService {
  constructor() {
    this.exchangeRates = {};
    this.lastUpdateTime = null;
    this.updateInterval = 60 * 60 * 1000; // 1 hour
    this.baseCurrency = 'usd';
    
    // Initialize with fallback rates
    this.setFallbackRates();
  }

  // Supported currencies
  getSupportedCurrencies() {
    return {
      'usd': { name: 'US Dollar', symbol: '$', decimals: 2 },
      'eur': { name: 'Euro', symbol: '€', decimals: 2 },
      'gbp': { name: 'British Pound', symbol: '£', decimals: 2 },
      'ngn': { name: 'Nigerian Naira', symbol: '₦', decimals: 2 },
      'ghs': { name: 'Ghanaian Cedi', symbol: '₵', decimals: 2 },
      'kes': { name: 'Kenyan Shilling', symbol: 'KSh', decimals: 2 },
      'zar': { name: 'South African Rand', symbol: 'R', decimals: 2 },
      'ugx': { name: 'Ugandan Shilling', symbol: 'USh', decimals: 0 },
      'tzs': { name: 'Tanzanian Shilling', symbol: 'TSh', decimals: 2 },
      'rwf': { name: 'Rwandan Franc', symbol: 'FRw', decimals: 0 },
      'zmw': { name: 'Zambian Kwacha', symbol: 'ZK', decimals: 2 },
      'egp': { name: 'Egyptian Pound', symbol: 'E£', decimals: 2 },
      'mad': { name: 'Moroccan Dirham', symbol: 'MAD', decimals: 2 },
      'inr': { name: 'Indian Rupee', symbol: '₹', decimals: 2 },
      'cny': { name: 'Chinese Yuan', symbol: '¥', decimals: 2 },
      'jpy': { name: 'Japanese Yen', symbol: '¥', decimals: 0 },
      'cad': { name: 'Canadian Dollar', symbol: 'C$', decimals: 2 },
      'aud': { name: 'Australian Dollar', symbol: 'A$', decimals: 2 }
    };
  }

  // Set fallback exchange rates
  setFallbackRates() {
    this.exchangeRates = {
      'usd': 1.0, 'eur': 0.85, 'gbp': 0.73, 'cad': 1.35, 'aud': 1.50,
      'jpy': 110.0, 'inr': 83.0, 'cny': 7.2,
      'ngn': 1530.0, 'ghs': 12.0, 'kes': 108.0, 'zar': 18.5, 'ugx': 3700.0,
      'tzs': 2300.0, 'rwf': 1000.0, 'zmw': 18.0, 'egp': 31.0, 'mad': 10.0
    };
    this.lastUpdateTime = Date.now();
  }

  // Update exchange rates from API
  async updateExchangeRates() {
    if (this.lastUpdateTime && Date.now() - this.lastUpdateTime < this.updateInterval) {
      return this.exchangeRates;
    }

    try {
      const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${this.baseCurrency}`, {
        timeout: 10000
      });
      
      if (response.data && response.data.rates) {
        this.exchangeRates = { ...this.exchangeRates, ...response.data.rates };
        this.lastUpdateTime = Date.now();
        console.log('💱 Exchange rates updated successfully');
      }
    } catch (error) {
      console.warn('⚠️ Failed to update exchange rates, using fallback rates');
    }

    return this.exchangeRates;
  }

  // Convert currency
  async convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return { amount, rate: 1 };
    }

    await this.updateExchangeRates();
    
    const fromRate = this.exchangeRates[fromCurrency.toLowerCase()] || 1;
    const toRate = this.exchangeRates[toCurrency.toLowerCase()] || 1;
    
    const baseAmount = amount / fromRate;
    const convertedAmount = baseAmount * toRate;
    const exchangeRate = toRate / fromRate;
    
    return {
      amount: convertedAmount,
      rate: exchangeRate
    };
  }

  // Format currency
  formatCurrency(amount, currency) {
    const currencies = this.getSupportedCurrencies();
    const currencyInfo = currencies[currency.toLowerCase()];
    
    if (!currencyInfo) {
      return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
    }

    const decimals = currencyInfo.decimals;
    const symbol = currencyInfo.symbol;
    
    return `${symbol}${amount.toFixed(decimals)}`;
  }

  // Get currency info
  getCurrencyInfo(currency) {
    const currencies = this.getSupportedCurrencies();
    return currencies[currency.toLowerCase()] || null;
  }

  // Validate currency
  isSupportedCurrency(currency) {
    const currencies = this.getSupportedCurrencies();
    return currency.toLowerCase() in currencies;
  }

  // Get all exchange rates
  async getExchangeRates() {
    await this.updateExchangeRates();
    return this.exchangeRates;
  }

  // Get exchange rate
  async getExchangeRate(fromCurrency, toCurrency) {
    await this.updateExchangeRates();
    
    const fromRate = this.exchangeRates[fromCurrency.toLowerCase()] || 1;
    const toRate = this.exchangeRates[toCurrency.toLowerCase()] || 1;
    
    return toRate / fromRate;
  }
}

export default new BackendCurrencyService(); 