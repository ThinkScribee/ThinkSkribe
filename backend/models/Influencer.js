import client from './client.js';

export const influencerApi = {
  // Get all influencers (admin only)
  getInfluencers: async () => {
    try {
      console.log('🎯 [Influencer API] Fetching influencers...');
      const response = await client.get('/influencers');
      console.log('✅ [Influencer API] Raw response:', response);
      console.log('✅ [Influencer API] Response data:', response.data);
      console.log('✅ [Influencer API] Response structure:', {
        hasData: !!response.data,
        hasSuccess: !!response.data?.success,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      return response;
    } catch (error) {
      console.error('❌ [Influencer API] Error fetching influencers:', error);
      throw error;
    }
  },

  // Get single influencer (admin only)
  getInfluencer: async (id) => {
    try {
      console.log('🎯 [Influencer API] Fetching influencer:', id);
      const response = await client.get(`/influencers/${id}`);
      console.log('✅ [Influencer API] Influencer received:', response);
      return response;
    } catch (error) {
      console.error('❌ [Influencer API] Error fetching influencer:', error);
      throw error;
    }
  },

  // Get single influencer by ID (alias for getInfluencer)
  getInfluencerById: async (id) => {
    try {
      console.log('🎯 [Influencer API] Fetching influencer by ID:', id);
      const response = await client.get(`/influencers/${id}`);
      console.log('✅ [Influencer API] Influencer received:', response);
      return response;
    } catch (error) {
      console.error('❌ [Influencer API] Error fetching influencer by ID:', error);
      throw error;
    }
  },

  // Create new influencer (admin only)
  createInfluencer: async (influencerData) => {
    try {
      console.log('🎯 [Influencer API] Creating influencer:', influencerData);
      const response = await client.post('/influencers', influencerData);
      console.log('✅ [Influencer API] Influencer created:', response);
      return response;
    } catch (error) {
      console.error('❌ [Influencer API] Error creating influencer:', error);
      throw error;
    }
  },

  // Update influencer (admin only)
  updateInfluencer: async (id, influencerData) => {
    try {
      console.log('🎯 [Influencer API] Updating influencer:', id, influencerData);
      const response = await client.put(`/influencers/${id}`, influencerData);
      console.log('✅ [Influencer API] Influencer updated:', response);
      return response;
    } catch (error) {
      console.error('❌ [Influencer API] Error updating influencer:', error);
      throw error;
    }
  },

  // Delete influencer (admin only)
  deleteInfluencer: async (id) => {
    try {
      console.log('🎯 [Influencer API] Deleting influencer:', id);
      const response = await client.delete(`/influencers/${id}`);
      console.log('✅ [Influencer API] Influencer deleted:', response);
      return response;
    } catch (error) {
      console.error('❌ [Influencer API] Error deleting influencer:', error);
      throw error;
    }
  },

  // Get influencer dashboard (admin only)
  getInfluencerDashboard: async (id) => {
    try {
      console.log('🎯 [Influencer API] Fetching influencer dashboard:', id);
      const response = await client.get(`/influencers/${id}/dashboard`);
      console.log('✅ [Influencer API] Raw dashboard response:', response);
      console.log('✅ [Influencer API] Dashboard data:', response.data);
      console.log('✅ [Influencer API] Dashboard structure:', {
        hasData: !!response.data,
        hasSuccess: !!response.data?.success,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      return response;
    } catch (error) {
      console.error('❌ [Influencer API] Error fetching dashboard:', error);
      throw error;
    }
  },

  // Get influencer analytics overview (admin only)
  getInfluencerAnalytics: async () => {
    try {
      console.log('🎯 [Influencer API] Fetching analytics overview...');
      const response = await client.get('/influencers/analytics/overview');
      console.log('✅ [Influencer API] Raw analytics response:', response);
      console.log('✅ [Influencer API] Analytics data:', response.data);
      console.log('✅ [Influencer API] Analytics structure:', {
        hasData: !!response.data,
        hasSuccess: !!response.data?.success,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      return response;
    } catch (error) {
      console.error('❌ [Influencer API] Error fetching analytics:', error);
      throw error;
    }
  },

  // Get influencer by referral code (public)
  getInfluencerByReferralCode: async (code) => {
    try {
      console.log('🎯 [Influencer API] Fetching influencer by code:', code);
      const response = await client.get(`/influencers/referral/${code}`);
      console.log('✅ [Influencer API] Influencer found:', response);
      return response;
    } catch (error) {
      console.error('❌ [Influencer API] Error fetching influencer by code:', error);
      throw error;
    }
  },

  // Track referral signup
  trackReferralSignup: async (referralCode, userId) => {
    try {
      console.log('🎯 [Influencer API] Tracking referral signup:', { referralCode, userId });
      const response = await client.post('/influencers/track-signup', {
        referralCode,
        userId
      });
      console.log('✅ [Influencer API] Referral tracked:', response);
      return response;
    } catch (error) {
      console.error('❌ [Influencer API] Error tracking referral:', error);
      throw error;
    }
  }
};

export default influencerApi;
