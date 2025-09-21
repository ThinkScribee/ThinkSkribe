import axios from 'axios';

class CurrencyService {
  constructor() {
    this.exchangeRates = {};
    this.lastUpdateTime = null;
    this.updateInterval = 60 * 60 * 1000; // 1 hour
    this.baseCurrency = 'usd'; // Base currency for conversions
    this.exchangeRateHistory = new Map(); // Store rate history with timestamps
    
    // Initialize exchange rates
    this.initializeExchangeRates();
  }

  // Supported currencies with their details
  getSupportedCurrencies() {
    return {
      // Major currencies
      'usd': { name: 'US Dollar', symbol: '$', decimals: 2, region: 'Global' },
      'eur': { name: 'Euro', symbol: '€', decimals: 2, region: 'Europe' },
      'gbp': { name: 'British Pound', symbol: '£', decimals: 2, region: 'Europe' },
      'cad': { name: 'Canadian Dollar', symbol: 'C$', decimals: 2, region: 'North America' },
      'aud': { name: 'Australian Dollar', symbol: 'A$', decimals: 2, region: 'Oceania' },
      'jpy': { name: 'Japanese Yen', symbol: '¥', decimals: 0, region: 'Asia' },
      'chf': { name: 'Swiss Franc', symbol: 'CHF', decimals: 2, region: 'Europe' },
      'sek': { name: 'Swedish Krona', symbol: 'kr', decimals: 2, region: 'Europe' },
      'nok': { name: 'Norwegian Krone', symbol: 'kr', decimals: 2, region: 'Europe' },
      'dkk': { name: 'Danish Krone', symbol: 'kr', decimals: 2, region: 'Europe' },

      // African currencies
      'ngn': { name: 'Nigerian Naira', symbol: '₦', decimals: 2, region: 'Africa' },
      'ghs': { name: 'Ghanaian Cedi', symbol: '₵', decimals: 2, region: 'Africa' },
      'kes': { name: 'Kenyan Shilling', symbol: 'KSh', decimals: 2, region: 'Africa' },
      'zar': { name: 'South African Rand', symbol: 'R', decimals: 2, region: 'Africa' },
      'ugx': { name: 'Ugandan Shilling', symbol: 'USh', decimals: 0, region: 'Africa' },
      'tzs': { name: 'Tanzanian Shilling', symbol: 'TSh', decimals: 2, region: 'Africa' },
      'rwf': { name: 'Rwandan Franc', symbol: 'FRw', decimals: 0, region: 'Africa' },
      'zmw': { name: 'Zambian Kwacha', symbol: 'ZK', decimals: 2, region: 'Africa' },
      'bwp': { name: 'Botswana Pula', symbol: 'P', decimals: 2, region: 'Africa' },
      'mur': { name: 'Mauritian Rupee', symbol: '₨', decimals: 2, region: 'Africa' },
      'egp': { name: 'Egyptian Pound', symbol: 'E£', decimals: 2, region: 'Africa' },
      'mad': { name: 'Moroccan Dirham', symbol: 'MAD', decimals: 2, region: 'Africa' },
      'dza': { name: 'Algerian Dinar', symbol: 'DA', decimals: 2, region: 'Africa' },
      'tnd': { name: 'Tunisian Dinar', symbol: 'TD', decimals: 3, region: 'Africa' },
      'xaf': { name: 'Central African CFA Franc', symbol: 'FCFA', decimals: 0, region: 'Africa' },
      'xof': { name: 'West African CFA Franc', symbol: 'CFA', decimals: 0, region: 'Africa' },
      'etb': { name: 'Ethiopian Birr', symbol: 'Br', decimals: 2, region: 'Africa' },
      'aoa': { name: 'Angolan Kwanza', symbol: 'Kz', decimals: 2, region: 'Africa' },
      'mzn': { name: 'Mozambican Metical', symbol: 'MT', decimals: 2, region: 'Africa' },
      'sll': { name: 'Sierra Leonean Leone', symbol: 'Le', decimals: 2, region: 'Africa' },
      'lrd': { name: 'Liberian Dollar', symbol: 'L$', decimals: 2, region: 'Africa' },
      'gnf': { name: 'Guinean Franc', symbol: 'FG', decimals: 0, region: 'Africa' },
      'cdf': { name: 'Congolese Franc', symbol: 'FC', decimals: 2, region: 'Africa' },
      'mga': { name: 'Malagasy Ariary', symbol: 'Ar', decimals: 0, region: 'Africa' },
      'kmf': { name: 'Comorian Franc', symbol: 'CF', decimals: 0, region: 'Africa' },
      'djf': { name: 'Djiboutian Franc', symbol: 'Fdj', decimals: 0, region: 'Africa' },
      'sos': { name: 'Somali Shilling', symbol: 'Sh', decimals: 2, region: 'Africa' },
      'stn': { name: 'São Tomé and Príncipe Dobra', symbol: 'Db', decimals: 2, region: 'Africa' },
      'cve': { name: 'Cape Verdean Escudo', symbol: '$', decimals: 2, region: 'Africa' },
      'gmd': { name: 'Gambian Dalasi', symbol: 'D', decimals: 2, region: 'Africa' },

      // Asian currencies
      'inr': { name: 'Indian Rupee', symbol: '₹', decimals: 2, region: 'Asia' },
      'cny': { name: 'Chinese Yuan', symbol: '¥', decimals: 2, region: 'Asia' },
      'krw': { name: 'South Korean Won', symbol: '₩', decimals: 0, region: 'Asia' },
      'sgd': { name: 'Singapore Dollar', symbol: 'S$', decimals: 2, region: 'Asia' },
      'hkd': { name: 'Hong Kong Dollar', symbol: 'HK$', decimals: 2, region: 'Asia' },
      'myr': { name: 'Malaysian Ringgit', symbol: 'RM', decimals: 2, region: 'Asia' },
      'thb': { name: 'Thai Baht', symbol: '฿', decimals: 2, region: 'Asia' },
      'php': { name: 'Philippine Peso', symbol: '₱', decimals: 2, region: 'Asia' },
      'idr': { name: 'Indonesian Rupiah', symbol: 'Rp', decimals: 0, region: 'Asia' },
      'vnd': { name: 'Vietnamese Dong', symbol: '₫', decimals: 0, region: 'Asia' }
    };
  }

  // Initialize exchange rates on service start
  async initializeExchangeRates() {
    try {
      await this.updateExchangeRates();
      console.log('💱 Currency service initialized with exchange rates');
    } catch (error) {
      console.error('⚠️ Failed to initialize exchange rates:', error.message);
      this.setFallbackRates();
    }
  }

  // Update exchange rates from APIs
  async updateExchangeRates() {
    if (this.lastUpdateTime && Date.now() - this.lastUpdateTime < this.updateInterval) {
      return this.exchangeRates;
    }

    const apis = [
      () => this.fetchFromExchangeRateAPI(),
      () => this.fetchFromFixer(),
      () => this.fetchFromCurrencyLayer(),
      () => this.fetchFromFreeCurrencyAPI()
    ];

    for (const api of apis) {
      try {
        const rates = await api();
        if (rates && Object.keys(rates).length > 0) {
          this.exchangeRates = rates;
          this.lastUpdateTime = Date.now();
          console.log(`💱 Exchange rates updated from API: ${Object.keys(rates).length} currencies`);
          return rates;
        }
      } catch (error) {
        console.warn(`⚠️ Exchange rate API failed: ${error.message}`);
        continue;
      }
    }

    throw new Error('All exchange rate APIs failed');
  }

  // Fetch from exchangerate-api.com
  async fetchFromExchangeRateAPI() {
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${this.baseCurrency}`, {
      timeout: 10000
    });
    
    if (response.data && response.data.rates) {
      return response.data.rates;
    }
    
    throw new Error('Invalid response from exchangerate-api.com');
  }

  // Fetch from fixer.io (requires API key)
  async fetchFromFixer() {
    const apiKey = process.env.FIXER_API_KEY;
    if (!apiKey) {
      throw new Error('Fixer API key not configured');
    }

    const response = await axios.get(`https://api.fixer.io/latest?access_key=${apiKey}&base=${this.baseCurrency.toUpperCase()}`, {
      timeout: 10000
    });
    
    if (response.data && response.data.rates) {
      return response.data.rates;
    }
    
    throw new Error('Invalid response from fixer.io');
  }

  // Fetch from currencylayer.com (requires API key)
  async fetchFromCurrencyLayer() {
    const apiKey = process.env.CURRENCY_LAYER_API_KEY;
    if (!apiKey) {
      throw new Error('Currency Layer API key not configured');
    }

    const response = await axios.get(`https://api.currencylayer.com/live?access_key=${apiKey}&source=${this.baseCurrency.toUpperCase()}`, {
      timeout: 10000
    });
    
    if (response.data && response.data.quotes) {
      const rates = {};
      for (const [key, value] of Object.entries(response.data.quotes)) {
        const currency = key.substring(3).toLowerCase();
        rates[currency] = value;
      }
      return rates;
    }
    
    throw new Error('Invalid response from currencylayer.com');
  }

  // Fetch from free currency API
  async fetchFromFreeCurrencyAPI() {
    const response = await axios.get(`https://api.freecurrencyapi.com/v1/latest?apikey=${process.env.FREE_CURRENCY_API_KEY}&base_currency=${this.baseCurrency.toUpperCase()}`, {
      timeout: 10000
    });
    
    if (response.data && response.data.data) {
      const rates = {};
      for (const [key, value] of Object.entries(response.data.data)) {
        rates[key.toLowerCase()] = value;
      }
      return rates;
    }
    
    throw new Error('Invalid response from freecurrencyapi.com');
  }

  // Set fallback rates when APIs fail
  setFallbackRates() {
    this.exchangeRates = {
      // Major currencies (approximate rates)
      'usd': 1.0,
      'eur': 0.85,
      'gbp': 0.73,
      'cad': 1.35,
      'aud': 1.50,
      'jpy': 110.0,
      'chf': 0.92,
      'sek': 8.5,
      'nok': 8.8,
      'dkk': 6.3,

      // African currencies (approximate rates)
      'ngn': 1530.0,
      'ghs': 12.0,
      'kes': 108.0,
      'zar': 18.5,
      'ugx': 3700.0,
      'tzs': 2300.0,
      'rwf': 1000.0,
      'zmw': 18.0,
      'bwp': 11.0,
      'mur': 44.0,
      'egp': 31.0,
      'mad': 10.0,
      'dza': 135.0,
      'tnd': 3.1,
      'xaf': 585.0,
      'xof': 585.0,
      'etb': 55.0,
      'aoa': 830.0,
      'mzn': 64.0,
      'sll': 13000.0,
      'lrd': 155.0,
      'gnf': 8600.0,
      'cdf': 2000.0,
      'mga': 4500.0,
      'kmf': 415.0,
      'djf': 178.0,
      'sos': 570.0,
      'stn': 22.0,
      'cve': 98.0,
      'gmd': 54.0,

      // Asian currencies (approximate rates)
      'inr': 83.0,
      'cny': 7.2,
      'krw': 1320.0,
      'sgd': 1.35,
      'hkd': 7.8,
      'myr': 4.7,
      'thb': 35.0,
      'php': 56.0,
      'idr': 15000.0,
      'vnd': 24000.0
    };
    
    console.log('💱 Using fallback exchange rates');
  }

  // Get current exchange rates
  async getExchangeRates() {
    if (!this.exchangeRates || Object.keys(this.exchangeRates).length === 0) {
      await this.updateExchangeRates();
    }
    return this.exchangeRates;
  }

  // Convert amount between currencies
  async convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return { amount, rate: 1 };
    }

    const rates = await this.getExchangeRates();
    const fromRate = rates[fromCurrency.toLowerCase()] || 1;
    const toRate = rates[toCurrency.toLowerCase()] || 1;
    
    // Convert to base currency first, then to target currency
    const baseAmount = amount / fromRate;
    const convertedAmount = baseAmount * toRate;
    const exchangeRate = toRate / fromRate;
    
    return {
      amount: convertedAmount,
      rate: exchangeRate
    };
  }

  // Format currency amount
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

  // Get currencies by region
  getCurrenciesByRegion(region) {
    const currencies = this.getSupportedCurrencies();
    return Object.entries(currencies)
      .filter(([code, info]) => info.region === region)
      .reduce((acc, [code, info]) => {
        acc[code] = info;
        return acc;
      }, {});
  }

  // Get popular currencies for a region
  getPopularCurrencies(region = 'Global') {
    const regionCurrencies = {
      'Global': ['usd', 'eur', 'gbp', 'jpy', 'cad', 'aud'],
      'Africa': ['ngn', 'ghs', 'kes', 'zar', 'ugx', 'tzs', 'rwf', 'zmw', 'egp', 'mad'],
      'Asia': ['inr', 'cny', 'krw', 'sgd', 'hkd', 'myr', 'thb', 'php', 'idr', 'vnd'],
      'Europe': ['eur', 'gbp', 'chf', 'sek', 'nok', 'dkk']
    };

    return regionCurrencies[region] || regionCurrencies['Global'];
  }

  // Refresh exchange rates manually
  async refreshExchangeRates() {
    this.lastUpdateTime = null;
    return await this.updateExchangeRates();
  }

  // Get exchange rate for specific currency pair
  async getExchangeRate(fromCurrency, toCurrency) {
    const rates = await this.getExchangeRates();
    const fromRate = rates[fromCurrency.toLowerCase()] || 1;
    const toRate = rates[toCurrency.toLowerCase()] || 1;
    
    return toRate / fromRate;
  }

  // Validate currency code
  isSupportedCurrency(currency) {
    const currencies = this.getSupportedCurrencies();
    return currency.toLowerCase() in currencies;
  }

  // Get currency symbol
  getCurrencySymbol(currency) {
    const currencyInfo = this.getCurrencyInfo(currency);
    return currencyInfo ? currencyInfo.symbol : currency.toUpperCase();
  }

  // Get currency name
  getCurrencyName(currency) {
    const currencyInfo = this.getCurrencyInfo(currency);
    return currencyInfo ? currencyInfo.name : currency.toUpperCase();
  }

  // Store exchange rate with timestamp for historical tracking
  storeExchangeRateHistory(fromCurrency, toCurrency, rate) {
    const key = `${fromCurrency.toLowerCase()}_${toCurrency.toLowerCase()}`;
    const timestamp = new Date().toISOString();
    
    if (!this.exchangeRateHistory.has(key)) {
      this.exchangeRateHistory.set(key, []);
    }
    
    const history = this.exchangeRateHistory.get(key);
    history.push({ rate, timestamp });
    
    // Keep only last 100 entries to prevent memory issues
    if (history.length > 100) {
      history.shift();
    }
  }

  // Get exchange rate history for a currency pair
  getExchangeRateHistory(fromCurrency, toCurrency) {
    const key = `${fromCurrency.toLowerCase()}_${toCurrency.toLowerCase()}`;
    return this.exchangeRateHistory.get(key) || [];
  }

  // Get current exchange rate with timestamp
  async getExchangeRateWithTimestamp(fromCurrency, toCurrency) {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    this.storeExchangeRateHistory(fromCurrency, toCurrency, rate);
    
    return {
      rate,
      timestamp: new Date().toISOString(),
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase()
    };
  }
}

// Export singleton instance
export default new CurrencyService(); 