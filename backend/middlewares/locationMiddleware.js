import locationService from '../services/locationService.js';
import User from '../models/User.js';

/**
 * Middleware to automatically detect and update user location
 * This runs for authenticated users to keep their location data current
 */
export const updateUserLocation = async (req, res, next) => {
  try {
    // Only update location for authenticated users
    if (!req.user || !req.user._id) {
      return next();
    }

    // Get client IP and detect location
    const ipAddress = locationService.getClientIP(req);
    const locationData = await locationService.getLocationFromIP(ipAddress);

    // Check if we need to update user location (update every 24 hours or if country changed)
    const user = req.user;
    const shouldUpdate = !user.location || 
                        !user.location.lastUpdated || 
                        Date.now() - new Date(user.location.lastUpdated).getTime() > 24 * 60 * 60 * 1000 ||
                        user.location.countryCode !== locationData.countryCode;

    if (shouldUpdate) {
      console.log(`🌍 Updating location for user ${user._id}: ${locationData.displayName}`);
      
      await User.findByIdAndUpdate(user._id, {
        location: {
          country: locationData.country,
          countryCode: locationData.countryCode,
          city: locationData.city,
          region: locationData.region,
          timezone: locationData.timezone,
          currency: locationData.currency,
          currencySymbol: locationData.currencySymbol,
          flag: locationData.flag,
          displayName: locationData.displayName,
          isAfrican: locationData.isAfrican,
          lastUpdated: new Date(),
          ipAddress: ipAddress
        }
      }, { new: true });

      // Update the req.user object with new location data
      req.user.location = {
        country: locationData.country,
        countryCode: locationData.countryCode,
        city: locationData.city,
        region: locationData.region,
        timezone: locationData.timezone,
        currency: locationData.currency,
        currencySymbol: locationData.currencySymbol,
        flag: locationData.flag,
        displayName: locationData.displayName,
        isAfrican: locationData.isAfrican,
        lastUpdated: new Date(),
        ipAddress: ipAddress
      };
    }

    next();
  } catch (error) {
    console.error('❌ Error updating user location:', error);
    // Don't fail the request if location update fails
    next();
  }
};

/**
 * Get user location data for responses
 * This can be used in controllers to get formatted location data
 */
export const getUserLocationData = (user) => {
  if (!user || !user.location) {
    return {
      country: 'Unknown',
      countryCode: 'us',
      city: 'Unknown',
      region: 'Unknown',
      timezone: 'UTC',
      currency: 'usd',
      currencySymbol: '$',
      flag: '🌍',
      displayName: 'Unknown Location',
      isAfrican: false
    };
  }

  return {
    country: user.location.country || 'Unknown',
    countryCode: user.location.countryCode || 'us',
    city: user.location.city || 'Unknown',
    region: user.location.region || 'Unknown',
    timezone: user.location.timezone || 'UTC',
    currency: user.location.currency || 'usd',
    currencySymbol: user.location.currencySymbol || '$',
    flag: user.location.flag || '🌍',
    displayName: user.location.displayName || 'Unknown Location',
    isAfrican: user.location.isAfrican || false
  };
}; 