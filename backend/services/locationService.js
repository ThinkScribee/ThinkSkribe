import axios from 'axios';
import geoip from 'geoip-lite';
import ip2geoPackage from 'ip2geo';
const { ip2geo } = ip2geoPackage;

class LocationService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
    
    // African countries for payment gateway selection
    this.africanCountries = new Set([
      'dz', 'ao', 'bj', 'bw', 'bf', 'bi', 'cm', 'cv', 'cf', 'td', 'km', 'cd', 'cg', 'ci', 'dj', 'eg', 'gq', 'er', 'et', 'ga', 'gm', 'gh', 'gn', 'gw', 'ke', 'ls', 'lr', 'ly', 'mg', 'mw', 'ml', 'mr', 'mu', 'ma', 'mz', 'na', 'ne', 'ng', 'rw', 'st', 'sn', 'sc', 'sl', 'so', 'za', 'ss', 'sd', 'sz', 'tz', 'tg', 'tn', 'ug', 'zm', 'zw'
    ]);

    console.log('🌍 LocationService initialized with offline geoip-lite and ip2geo support');
  }

  // Get location from IP address
  async getLocationFromIP(ipAddress) {
    if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1') {
      console.log('🏠 Using default location for local IP:', ipAddress);
      return this.getDefaultLocation();
    }

    // Check cache first
    const cacheKey = ipAddress;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('💾 Using cached location for IP:', ipAddress);
      return cached.data;
    }

    try {
      console.log('🔍 Detecting location for IP:', ipAddress);
      const location = await this.detectLocationFromIP(ipAddress);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: location,
        timestamp: Date.now()
      });
      
      console.log('✅ Location detected successfully:', location.displayName);
      return location;
    } catch (error) {
      console.error('❌ Error getting location from IP:', error.message);
      return this.getDefaultLocation();
    }
  }

  // Detect location using multiple methods with offline libraries as priority
  async detectLocationFromIP(ipAddress) {
    const services = [
      () => this.getLocationFromGeoIPLite(ipAddress),
      () => this.getLocationFromIp2Geo(ipAddress),
      () => this.getLocationFromIPAPI(ipAddress),
      () => this.getLocationFromIPGeolocation(ipAddress),
      () => this.getLocationFromFreeIPAPI(ipAddress),
      () => this.getLocationFromIPStack(ipAddress)
    ];

    for (const [index, service] of services.entries()) {
      try {
        console.log(`🌐 Trying geolocation service ${index + 1}/${services.length}`);
        const location = await service();
        if (location && location.countryCode) {
          console.log(`✅ Service ${index + 1} succeeded:`, location.country, location.city);
          return this.enrichLocationData(location);
        }
      } catch (error) {
        console.warn(`⚠️ Geolocation service ${index + 1} failed:`, error.message);
        continue;
      }
    }

    console.log('🏠 All services failed, using default location');
    return this.getDefaultLocation();
  }

  // Get location from ipapi.co
  async getLocationFromIPAPI(ipAddress) {
    const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'EDU-SAGE Location Service'
      }
    });

    if (response.data && response.data.country_code) {
      return {
        country: response.data.country_name,
        countryCode: response.data.country_code.toLowerCase(),
        city: response.data.city,
        region: response.data.region,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        timezone: response.data.timezone,
        currency: response.data.currency,
        isp: response.data.org,
        ipAddress: ipAddress
      };
    }

    throw new Error('Invalid response from ipapi.co');
  }

  // Get location from ipgeolocation.io
  async getLocationFromIPGeolocation(ipAddress) {
    const apiKey = process.env.IPGEOLOCATION_API_KEY;
    const url = apiKey 
      ? `https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}&ip=${ipAddress}`
      : `https://api.ipgeolocation.io/ipgeo?ip=${ipAddress}`;

    const response = await axios.get(url, {
      timeout: 10000
    });

    if (response.data && response.data.country_code2) {
      return {
        country: response.data.country_name,
        countryCode: response.data.country_code2.toLowerCase(),
        city: response.data.city,
        region: response.data.state_prov,
        latitude: parseFloat(response.data.latitude),
        longitude: parseFloat(response.data.longitude),
        timezone: response.data.time_zone?.name,
        currency: response.data.currency?.code,
        isp: response.data.isp,
        ipAddress: ipAddress
      };
    }

    throw new Error('Invalid response from ipgeolocation.io');
  }

  // Get location from freeipapi.com
  async getLocationFromFreeIPAPI(ipAddress) {
    const response = await axios.get(`https://freeipapi.com/api/json/${ipAddress}`, {
      timeout: 10000
    });

    if (response.data && response.data.countryCode) {
      return {
        country: response.data.countryName,
        countryCode: response.data.countryCode.toLowerCase(),
        city: response.data.cityName,
        region: response.data.regionName,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        timezone: response.data.timeZone,
        currency: null,
        isp: null,
        ipAddress: ipAddress
      };
    }

    throw new Error('Invalid response from freeipapi.com');
  }

  // Get location from ipstack.com
  async getLocationFromIPStack(ipAddress) {
    const apiKey = process.env.IPSTACK_API_KEY;
    if (!apiKey) {
      throw new Error('IPStack API key not configured');
    }

    const response = await axios.get(`https://api.ipstack.com/${ipAddress}?access_key=${apiKey}`, {
      timeout: 10000
    });

    if (response.data && response.data.country_code) {
      return {
        country: response.data.country_name,
        countryCode: response.data.country_code.toLowerCase(),
        city: response.data.city,
        region: response.data.region_name,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        timezone: response.data.time_zone?.id,
        currency: null,
        isp: null,
        ipAddress: ipAddress
      };
    }

    throw new Error('Invalid response from ipstack.com');
  }

  // New method: Get location from geoip-lite (offline, fastest)
  getLocationFromGeoIPLite(ipAddress) {
    try {
      console.log('📍 Using geoip-lite for IP:', ipAddress);
      const geo = geoip.lookup(ipAddress);
      
      if (!geo) {
        throw new Error('IP not found in geoip-lite database');
      }

      return {
        country: this.getCountryName(geo.country),
        countryCode: geo.country.toLowerCase(),
        city: geo.city || 'Unknown',
        region: geo.region || geo.city || 'Unknown',
        latitude: geo.ll?.[0] || null,
        longitude: geo.ll?.[1] || null,
        timezone: geo.timezone || 'UTC',
        currency: this.getRecommendedCurrency(geo.country.toLowerCase()),
        ipAddress: ipAddress,
        source: 'geoip-lite'
      };
    } catch (error) {
      throw new Error(`geoip-lite lookup failed: ${error.message}`);
    }
  }

  // New method: Get location from ip2geo (online, lightweight)
  async getLocationFromIp2Geo(ipAddress) {
    try {
      console.log('🌐 Using ip2geo for IP:', ipAddress);
      const geo = await ip2geo(ipAddress);
      
      if (!geo || !geo.country_code) {
        throw new Error('Invalid response from ip2geo');
      }

      return {
        country: geo.country,
        countryCode: geo.country_code.toLowerCase(),
        city: geo.city || 'Unknown',
        region: geo.region || geo.city || 'Unknown',
        latitude: geo.latitude || null,
        longitude: geo.longitude || null,
        timezone: geo.timezone || 'UTC',
        currency: this.getRecommendedCurrency(geo.country_code.toLowerCase()),
        ipAddress: ipAddress,
        source: 'ip2geo'
      };
    } catch (error) {
      throw new Error(`ip2geo lookup failed: ${error.message}`);
    }
  }

  // Helper method to get country name from country code
  getCountryName(countryCode) {
    const countries = {
      'US': 'United States',
      'CA': 'Canada',
      'GB': 'United Kingdom',
      'AU': 'Australia',
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'ES': 'Spain',
      'NL': 'Netherlands',
      'BE': 'Belgium',
      'CH': 'Switzerland',
      'SE': 'Sweden',
      'NO': 'Norway',
      'DK': 'Denmark',
      'FI': 'Finland',
      'IE': 'Ireland',
      'AT': 'Austria',
      'PT': 'Portugal',
      'PL': 'Poland',
      'CZ': 'Czech Republic',
      'HU': 'Hungary',
      'SK': 'Slovakia',
      'SI': 'Slovenia',
      'HR': 'Croatia',
      'BG': 'Bulgaria',
      'RO': 'Romania',
      'GR': 'Greece',
      'CY': 'Cyprus',
      'MT': 'Malta',
      'LU': 'Luxembourg',
      'EE': 'Estonia',
      'LV': 'Latvia',
      'LT': 'Lithuania',
      'JP': 'Japan',
      'KR': 'South Korea',
      'CN': 'China',
      'IN': 'India',
      'BR': 'Brazil',
      'MX': 'Mexico',
      'AR': 'Argentina',
      'CL': 'Chile',
      'CO': 'Colombia',
      'PE': 'Peru',
      'VE': 'Venezuela',
      'ZA': 'South Africa',
      'NG': 'Nigeria',
      'KE': 'Kenya',
      'EG': 'Egypt',
      'MA': 'Morocco',
      'TN': 'Tunisia',
      'DZ': 'Algeria',
      'GH': 'Ghana',
      'UG': 'Uganda',
      'TZ': 'Tanzania',
      'ZW': 'Zimbabwe',
      'ZM': 'Zambia',
      'MW': 'Malawi',
      'MZ': 'Mozambique',
      'BW': 'Botswana',
      'NA': 'Namibia',
      'SZ': 'Swaziland',
      'LS': 'Lesotho'
    };
    
    return countries[countryCode] || countryCode;
  }

  // Enrich location data with additional information
  enrichLocationData(location) {
    const countryCode = location.countryCode?.toLowerCase();
    const recommendedCurrency = this.getRecommendedCurrency(countryCode);
    const currencySymbol = this.getCurrencySymbol(countryCode);
    
    return {
      ...location,
      isAfrican: this.africanCountries.has(countryCode),
      flag: this.getCountryFlag(countryCode),
      displayName: this.getDisplayName(location.city, location.country),
      recommendedGateway: this.africanCountries.has(countryCode) ? 'paystack' : 'stripe',
      recommendedCurrency,
      currencySymbol,
      // Override currency from IP service with our recommended currency
      currency: recommendedCurrency
    };
  }

  // Get country flag emoji
  getCountryFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    
    return countryCode
      .toUpperCase()
      .replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
  }

  // Get display name for location
  getDisplayName(city, country) {
    if (city && country) {
      return `${city}, ${country}`;
    }
    return country || 'Unknown Location';
  }

  // Get recommended currency for country
  getRecommendedCurrency(countryCode) {
    const currencyMap = {
      // Major currencies
      'us': 'usd', 'ca': 'cad', 'gb': 'gbp', 'au': 'aud', 'nz': 'nzd',
      'de': 'eur', 'fr': 'eur', 'it': 'eur', 'es': 'eur', 'nl': 'eur',
      'be': 'eur', 'at': 'eur', 'pt': 'eur', 'ie': 'eur', 'fi': 'eur',
      'gr': 'eur', 'jp': 'jpy', 'ch': 'chf', 'cn': 'cny', 'in': 'inr',
      'br': 'brl', 'mx': 'mxn', 'kr': 'krw', 'sg': 'sgd', 'hk': 'hkd',
      'th': 'thb', 'ph': 'php', 'my': 'myr', 'id': 'idr', 'vn': 'vnd',
      // African currencies
      'ng': 'ngn', 'gh': 'ghs', 'ke': 'kes', 'za': 'zar', 'ug': 'ugx',
      'tz': 'tzs', 'rw': 'rwf', 'eg': 'egp', 'ma': 'mad', 'dz': 'dzd',
      'cm': 'xaf', 'ci': 'xof', 'sn': 'xof', 'ml': 'xof', 'bf': 'xof',
      'ne': 'xof', 'td': 'xaf', 'cf': 'xaf', 'cg': 'xaf', 'ga': 'xaf',
      'gq': 'xaf', 'ao': 'aoa', 'mz': 'mzn', 'et': 'etb', 'zm': 'zmw',
      'bw': 'bwp', 'mu': 'mur', 'tn': 'tnd', 'dj': 'djf', 'so': 'sos',
      'st': 'stn', 'cv': 'cve', 'gm': 'gmd', 'lr': 'lrd', 'sl': 'sll',
      'gn': 'gnf', 'mw': 'mwk', 'na': 'nad', 'sz': 'szl', 'ls': 'lsl'
    };
    
    return currencyMap[countryCode?.toLowerCase()] || 'usd';
  }

  // Get currency symbol for a country
  getCurrencySymbol(countryCode) {
    const currency = this.getRecommendedCurrency(countryCode);
    const symbolMap = {
      'usd': '$', 'cad': 'C$', 'gbp': '£', 'aud': 'A$', 'nzd': 'NZ$',
      'eur': '€', 'jpy': '¥', 'chf': 'Fr', 'cny': '¥', 'inr': '₹',
      'brl': 'R$', 'mxn': '$', 'krw': '₩', 'sgd': 'S$', 'hkd': 'HK$',
      'thb': '฿', 'php': '₱', 'myr': 'RM', 'idr': 'Rp', 'vnd': '₫',
      'ngn': '₦', 'ghs': '₵', 'kes': 'KSh', 'zar': 'R', 'ugx': 'USh',
      'tzs': 'TSh', 'rwf': 'RWF', 'egp': 'E£', 'mad': 'MAD', 'dzd': 'DA',
      'xaf': 'FCFA', 'xof': 'CFA', 'aoa': 'Kz', 'mzn': 'MT', 'etb': 'Br',
      'zmw': 'ZK', 'bwp': 'P', 'mur': '₨', 'tnd': 'TD', 'djf': 'Fdj',
      'sos': 'Sh', 'stn': 'Db', 'cve': '$', 'gmd': 'D', 'lrd': 'L$',
      'sll': 'Le', 'gnf': 'FG', 'mwk': 'MK', 'nad': 'N$', 'szl': 'E',
      'lsl': 'M'
    };
    
    return symbolMap[currency] || '$';
  }

  // Get default location (fallback)
  getDefaultLocation() {
    return {
      country: 'United States',
      countryCode: 'us',
      city: 'New York',
      region: 'New York',
      latitude: 40.7128,
      longitude: -74.0060,
      timezone: 'America/New_York',
      currency: 'usd',
      isp: null,
      ipAddress: null,
      isAfrican: false,
      flag: '🇺🇸',
      displayName: 'New York, United States',
      recommendedGateway: 'stripe',
      recommendedCurrency: 'usd',
      currencySymbol: '$'
    };
  }

  // Get client IP with enhanced detection for Nigerian networks
  getClientIP(req) {
    // Enhanced IP detection for better accuracy
    const ipSources = [
      req.headers['x-forwarded-for']?.split(',')[0]?.trim(),
      req.headers['x-real-ip'],
      req.headers['x-client-ip'],
      req.headers['cf-connecting-ip'], // Cloudflare
      req.headers['x-cluster-client-ip'],
      req.connection?.remoteAddress,
      req.socket?.remoteAddress,
      req.connection?.socket?.remoteAddress,
      req.ip,
      req.ips?.[0]
    ];

    // Find the first valid IP
    for (const ip of ipSources) {
      if (ip && this.isValidIP(ip)) {
        console.log(`🔍 [LocationService] Detected IP: ${ip} from source`);
        
        // Special logging for Nigerian IP ranges
        if (this.isLikelyNigerianIP(ip)) {
          console.log(`🇳🇬 [LocationService] Detected potential Nigerian IP: ${ip}`);
        }
        
        return ip;
      }
    }

    console.log(`⚠️ [LocationService] No valid IP found, using localhost`);
    return '127.0.0.1';
  }

  // Check if IP is valid
  isValidIP(ip) {
    if (!ip || typeof ip !== 'string') return false;
    
    // Remove any port numbers
    const cleanIp = ip.split(':')[0];
    
    // Basic IP validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (!ipv4Regex.test(cleanIp) && !ipv6Regex.test(cleanIp)) {
      return false;
    }
    
    // Skip local/private IPs for geolocation
    if (cleanIp.startsWith('127.') || 
        cleanIp.startsWith('10.') || 
        cleanIp.startsWith('192.168.') ||
        cleanIp.startsWith('172.') ||
        cleanIp === '::1') {
      return false;
    }
    
    return true;
  }

  // Check if IP is likely from Nigeria (based on known ranges)
  isLikelyNigerianIP(ip) {
    const nigerianRanges = [
      '197.210.',   // MTN Nigeria
      '197.149.',   // Airtel Nigeria
      '105.112.',   // Globacom
      '41.203.',    // MainOne
      '197.255.',   // NITEL
      '129.205.',   // University networks
      '196.46.',    // Various Nigerian ISPs
      '41.223.',    // Nigerian ISPs
      '102.89.',    // Nigerian ISPs
      '197.232.'    // Nigerian ISPs
    ];
    
    return nigerianRanges.some(range => ip.startsWith(range));
  }

  // Check if country is in Africa
  isAfricanCountry(countryCode) {
    return this.africanCountries.has(countryCode?.toLowerCase());
  }

  // Get location summary for payment processing
  async getLocationSummary(ipAddress) {
    const location = await this.getLocationFromIP(ipAddress);
    
    return {
      country: location.country,
      countryCode: location.countryCode,
      city: location.city,
      displayName: location.displayName,
      flag: location.flag,
      isAfrican: location.isAfrican,
      recommendedGateway: location.recommendedGateway,
      recommendedCurrency: location.recommendedCurrency,
      timezone: location.timezone
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
      maxAge: this.cacheExpiry
    };
  }
}

export default new LocationService(); 