import { asyncHandler } from '../utils/error.js';
import locationService from '../services/locationService.js';
import currencyService from '../services/currencyService.js';

/**
 * @desc    Get user location from IP address
 * @route   GET /api/location/detect
 * @access  Public
 */
export const detectLocation = asyncHandler(async (req, res) => {
  try {
    const ipAddress = locationService.getClientIP(req);
    const location = await locationService.getLocationFromIP(ipAddress);
    
    res.json({
      success: true,
      data: {
        country: location.country,
        countryCode: location.countryCode,
        city: location.city,
        region: location.region || location.city,
        timezone: location.timezone || 'UTC',
        currency: location.currency,
        currencySymbol: location.currencySymbol,
        exchangeRate: location.exchangeRate || 1,
        isAfrican: location.isAfrican,
        flag: location.flag,
        displayName: location.displayName
      },
      detectedIP: ipAddress
    });
  } catch (error) {
    console.error('Error detecting location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect location',
      error: error.message,
      data: {
        country: 'United States',
        countryCode: 'us',
        city: 'New York',
        region: 'New York',
        timezone: 'America/New_York',
        currency: 'usd',
        currencySymbol: '$',
        exchangeRate: 1,
        isAfrican: false,
        flag: '🇺🇸',
        displayName: 'New York, United States'
      }
    });
  }
});

/**
 * @desc    Get location summary for payment processing
 * @route   GET /api/location/summary
 * @access  Public
 */
export const getLocationSummary = asyncHandler(async (req, res) => {
  try {
    const ipAddress = locationService.getClientIP(req);
    const summary = await locationService.getLocationSummary(ipAddress);
    
    res.json({
      success: true,
      summary,
      detectedIP: ipAddress
    });
  } catch (error) {
    console.error('Error getting location summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location summary',
      error: error.message,
      summary: {
        country: 'United States',
        countryCode: 'us',
        city: 'New York',
        displayName: 'New York, United States',
        flag: '🇺🇸',
        isAfrican: false,
        recommendedGateway: 'stripe',
        recommendedCurrency: 'usd'
      }
    });
  }
});

/**
 * @desc    Get user's location and currency information
 * @route   GET /api/location/currency
 * @access  Public
 */
export const getLocationCurrency = asyncHandler(async (req, res) => {
  try {
    const ipAddress = locationService.getClientIP(req);
    console.log(`🌍 [LocationController] Processing request for IP: ${ipAddress}`);
    
    const location = await locationService.getLocationFromIP(ipAddress);
    console.log(`📍 [LocationController] Location detected:`, location.displayName);
    
    // Get currency information
    const currency = location.currency || 'usd';
    const currencyInfo = currencyService.getCurrencyInfo(currency);
    
    // Try to get exchange rate, but don't fail if it's not available
    let exchangeRateData = { rate: 1, timestamp: new Date().toISOString() };
    
    try {
      exchangeRateData = await currencyService.getExchangeRateWithTimestamp('usd', currency);
      console.log(`💱 [LocationController] Exchange rate obtained: 1 USD = ${exchangeRateData.rate} ${currency.toUpperCase()}`);
    } catch (exchangeError) {
      console.warn(`⚠️ [LocationController] Exchange rate failed, using fallback:`, exchangeError.message);
      // Use fallback rates for common currencies
      const fallbackRates = {
        'ngn': 1500,
        'eur': 0.85,
        'gbp': 0.75,
        'cad': 1.35,
        'aud': 1.45,
        'jpy': 110,
        'inr': 75,
        'usd': 1
      };
      exchangeRateData.rate = fallbackRates[currency] || 1;
    }
    
    const response = {
      success: true,
      location: {
        country: location.country,
        countryCode: location.countryCode,
        city: location.city,
        region: location.region || location.city,
        timezone: location.timezone || 'UTC',
        isAfrican: location.isAfrican,
        flag: location.flag,
        displayName: location.displayName,
        source: location.source || 'unknown'
      },
      currency: {
        code: currency,
        symbol: location.currencySymbol,
        name: currencyInfo?.name || currency.toUpperCase(),
        decimals: currencyInfo?.decimals || 2,
        exchangeRate: exchangeRateData.rate,
        exchangeRateTimestamp: exchangeRateData.timestamp
      },
      payment: {
        recommendedGateway: location.recommendedGateway,
        recommendedCurrency: location.recommendedCurrency
      },
      detectedIP: ipAddress,
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ [LocationController] Response prepared successfully`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ [LocationController] Error getting location currency:', error);
    
    // Provide a robust fallback response
    const fallbackResponse = {
      success: false,
      message: 'Location detection failed, using fallback',
      error: error.message,
      location: {
        country: 'United States',
        countryCode: 'us',
        city: 'New York',
        region: 'New York',
        timezone: 'America/New_York',
        isAfrican: false,
        flag: '🇺🇸',
        displayName: 'New York, United States',
        source: 'fallback'
      },
      currency: {
        code: 'usd',
        symbol: '$',
        name: 'US Dollar',
        decimals: 2,
        exchangeRate: 1,
        exchangeRateTimestamp: new Date().toISOString()
      },
      payment: {
        recommendedGateway: 'stripe',
        recommendedCurrency: 'usd'
      },
      detectedIP: req.ip || 'unknown',
      timestamp: new Date().toISOString()
    };
    
    console.log(`🏠 [LocationController] Using fallback response`);
    res.status(200).json(fallbackResponse); // Use 200 instead of 500 for better UX
  }
});

/**
 * @desc    Get location by IP address (admin endpoint)
 * @route   POST /api/location/ip
 * @access  Private
 */
export const getLocationByIP = asyncHandler(async (req, res) => {
  const { ipAddress } = req.body;
  
  if (!ipAddress) {
    return res.status(400).json({
      success: false,
      message: 'IP address is required'
    });
  }

  try {
    const location = await locationService.getLocationFromIP(ipAddress);
    
    res.json({
      success: true,
      location,
      queriedIP: ipAddress
    });
  } catch (error) {
    console.error('Error getting location by IP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location for IP address',
      error: error.message
    });
  }
});

/**
 * @desc    Check if country is in Africa
 * @route   GET /api/location/is-african/:countryCode
 * @access  Public
 */
export const isAfricanCountry = asyncHandler(async (req, res) => {
  const { countryCode } = req.params;
  
  if (!countryCode) {
    return res.status(400).json({
      success: false,
      message: 'Country code is required'
    });
  }

  const isAfrican = locationService.isAfricanCountry(countryCode);
  
  res.json({
    success: true,
    countryCode: countryCode.toLowerCase(),
    isAfrican,
    recommendedGateway: isAfrican ? 'paystack' : 'stripe'
  });
});

/**
 * @desc    Get cache statistics (admin endpoint)
 * @route   GET /api/location/cache-stats
 * @access  Private
 */
export const getCacheStats = asyncHandler(async (req, res) => {
  try {
    const stats = locationService.getCacheStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics',
      error: error.message
    });
  }
});

/**
 * @desc    Get location from external IP API (proxy to avoid CORS)
 * @route   GET /api/location/external-ip
 * @access  Public
 */
export const getExternalIPLocation = asyncHandler(async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (data && data.country_code) {
      const currency = locationService.getRecommendedCurrency(data.country_code);
      const symbol = locationService.getCurrencySymbol(data.country_code);
      
      res.json({
        success: true,
        location: {
          country: data.country_name || 'Unknown',
          countryCode: data.country_code.toLowerCase() || 'us',
          city: data.city || 'Unknown',
          region: data.region || 'Unknown',
          timezone: data.timezone || 'UTC',
          ip: data.ip || 'Unknown'
        },
        currency: {
          code: currency,
          symbol: symbol,
          exchangeRate: 1
        }
      });
    } else {
      throw new Error('Invalid response from external IP API');
    }
  } catch (error) {
    console.error('Error getting external IP location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location from external IP API',
      error: error.message,
      location: {
        country: 'United States',
        countryCode: 'us',
        city: 'Unknown',
        region: 'Unknown',
        timezone: 'UTC',
        ip: 'Unknown'
      },
      currency: {
        code: 'usd',
        symbol: '$',
        exchangeRate: 1
      }
    });
  }
});

/**
 * @desc    Clear location cache (admin endpoint)
 * @route   DELETE /api/location/cache
 * @access  Private
 */
export const clearCache = asyncHandler(async (req, res) => {
  try {
    locationService.clearCache();
    
    res.json({
      success: true,
      message: 'Location cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
}); 