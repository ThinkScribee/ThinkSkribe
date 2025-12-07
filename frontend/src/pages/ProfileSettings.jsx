// src/components/ProfileSettings.jsx

import React, { useEffect, useState } from 'react';
import { 
  UserOutlined, 
  BellOutlined, 
  CameraOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { updateUserProfile, uploadProfilePicture } from '../api/user';
import { useNotifications } from '../context/NotificationContext';
import HeaderComponent from '../components/HeaderComponent';
import MobileBottomTabs from '../components/MobileBottomTabs';
import { PREDEFINED_SPECIALTIES, searchSpecialties } from '../utils/specialties';
import './ProfileSettings.css';
import '../components/DashboardMobile.css';
import '../components/ProfileSettingsMobile.css';

const ProfileSettings = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const { socket } = useNotifications();
  const navigate = useNavigate();

  // Generate fallback avatar URL
  const getFallbackAvatar = () => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}&backgroundColor=015382&textColor=ffffff`;
  };

  // Local state for preview and the chosen File
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [specialtySuggestions, setSpecialtySuggestions] = useState(PREDEFINED_SPECIALTIES.slice(0, 5));

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    writerBio: '',
    writerSpecialties: [],
    responseTime: 24
  });



  // Notification preferences
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    assignmentUpdates: true,
    paymentReminders: true,
    marketingEmails: false,
  });

  // On mount, prefill the form and preview
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      writerBio: user?.writerProfile?.bio || '',
      writerSpecialties: Array.isArray(user?.writerProfile?.specialties) ? user.writerProfile.specialties : [],
      responseTime: user?.writerProfile?.responseTime || 24,
    });

    // If user.avatar exists (from DB), show it as preview, otherwise use fallback
    if (user?.avatar) {
      setPreviewUrl(user.avatar);
    } else if (user?.name) {
      setPreviewUrl(getFallbackAvatar());
    }
  }, [isAuthenticated, user, navigate]);

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle specialty search and suggestions
  const handleSpecialtySearch = (value) => {
    setNewSpecialty(value);
    if (value.trim()) {
      const suggestions = searchSpecialties(value).slice(0, 5);
      setSpecialtySuggestions(suggestions);
    } else {
      setSpecialtySuggestions(PREDEFINED_SPECIALTIES.slice(0, 5));
    }
  };

  // Handle adding specialty
  const handleAddSpecialty = (specialty = null) => {
    const specialtyToAdd = specialty || newSpecialty.trim();
    if (specialtyToAdd && !(formData.writerSpecialties || []).includes(specialtyToAdd)) {
      setFormData(prev => ({
        ...prev,
        writerSpecialties: [...(prev.writerSpecialties || []), specialtyToAdd]
      }));
      setNewSpecialty('');
      setSpecialtySuggestions(PREDEFINED_SPECIALTIES.slice(0, 5));
    }
  };

  // Handle removing specialty
  const handleRemoveSpecialty = (specialtyToRemove) => {
    setFormData(prev => ({
      ...prev,
      writerSpecialties: (prev.writerSpecialties || []).filter(specialty => specialty !== specialtyToRemove)
    }));
  };



  // Handle selecting a new image file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      // Clean up any existing object URL
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(user?.avatar || getFallbackAvatar());
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('You can only upload image files (jpg, png, etc.).');
      return;
    }
    if (file.size / 1024 / 1024 >= 2) {
      setError('Image must be smaller than 2MB.');
      return;
    }
    setError(null);
    setSelectedFile(file);
    
    // Clean up previous object URL before creating new one
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // Create new object URL for preview
    const newPreviewUrl = URL.createObjectURL(file);
    setImageLoading(true);
    setPreviewUrl(newPreviewUrl);
  };

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1) Upload a new avatar if the user chose one
      let avatarUrl = user?.avatar;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        avatarUrl = await uploadProfilePicture(formData);
        setSelectedFile(null);
        const fileInput = document.getElementById('avatar-upload');
        if (fileInput) fileInput.value = '';
      }

      // 2) Update profile
      const profileUpdateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        avatar: avatarUrl,
      };

      // Add writer profile data if user is a writer
      if (user?.role === 'writer') {
        profileUpdateData.writerProfile = {
          ...user.writerProfile,
          bio: formData.writerBio || '',
          specialties: formData.writerSpecialties || [],
          responseTime: parseInt(formData.responseTime) || 24
        };
      }

      const updatedUserData = await updateUserProfile(profileUpdateData);
      updateUser(updatedUserData);
      setPreviewUrl(updatedUserData.avatar || avatarUrl);
      
      setFormData({
        name: updatedUserData.name || '',
        email: updatedUserData.email || '',
        phone: updatedUserData.phone || '',
        writerBio: updatedUserData.writerProfile?.bio || '',
        writerSpecialties: Array.isArray(updatedUserData.writerProfile?.specialties) ? updatedUserData.writerProfile.specialties : [],
        responseTime: updatedUserData.writerProfile?.responseTime || 24,
      });

      // Socket event will be emitted automatically by the backend for global real-time updates

      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile.');
      
      // Restore previous avatar on error
      if (user?.avatar) {
        // Clean up object URL if it exists
        if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(user.avatar);
      } else {
        setPreviewUrl(getFallbackAvatar());
      }
      setSelectedFile(null);
      const fileInput = document.getElementById('avatar-upload');
      if (fileInput) fileInput.value = '';
    } finally {
      setIsLoading(false);
      setImageLoading(false);
    }
  };



  // Handle notification settings change
  const handleNotificationChange = (key, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setSuccess('Notification preferences updated!');
  };

  const tabs = [
    { key: 'profile', label: 'Profile', icon: <UserOutlined /> },
    { key: 'notifications', label: 'Notifications', icon: <BellOutlined /> }
  ];

  return (
    <div className="profile-settings-container mobile-bottom-tabs-visible">
      <HeaderComponent />

      <div className="pt-16 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="profile-header">
            <h1 className="profile-title">
              Account Settings
            </h1>
            <p className="profile-subtitle">
              Manage your profile and preferences
            </p>
          </div>

          {/* Main Card */}
          <div className="profile-main-card">
            {/* Tabs Navigation */}
            <div className="profile-tabs">
              <nav className="flex" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`profile-tab ${activeTab === tab.key ? 'active' : ''}`}
                  >
                    <span className="profile-tab-icon">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="profile-tab-content">
              {/* Success/Error Messages */}
              {success && (
                <div className="profile-message success">
                  <CheckCircleOutlined className="profile-message-icon" />
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <div className="profile-message error">
                  <ExclamationCircleOutlined className="profile-message-icon" />
                  <span>{error}</span>
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="profile-section">
                  {/* Avatar Section */}
                  <div className="profile-avatar-section">
                    <div className="profile-avatar-container">
                      {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Profile"
                          className="profile-avatar"
                          onLoad={() => setImageLoading(false)}
                          onLoadStart={() => setImageLoading(true)}
                          onError={() => {
                            setImageLoading(false);
                            setPreviewUrl(user?.avatar || getFallbackAvatar());
                            setError('Failed to load image. Please try another image.');
                          }}
                          style={{ 
                            opacity: imageLoading ? 0 : 1,
                            transition: 'opacity 0.3s ease'
                          }}
                        />
                      ) : (
                        <div className="profile-avatar flex items-center justify-center bg-gray-200">
                          <UserOutlined className="text-4xl text-gray-400" />
                        </div>
                      )}
                      <label
                        htmlFor="avatar-upload"
                        className="profile-avatar-overlay"
                      >
                        <CameraOutlined className="profile-avatar-icon" />
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                    <div className="profile-avatar-info">
                      <h3 className="profile-avatar-name">{user?.name}</h3>
                      <p className="profile-avatar-role">{user?.role}</p>
                      <p className="text-sm text-gray-400 mt-2">JPG, PNG • Max 2MB</p>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="profile-form">
                    <form onSubmit={handleUpdateProfile}>
                      <div className="profile-form-group">
                        <label className="profile-form-label">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="profile-form-input"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="profile-form-input"
                          placeholder="Enter your email"
                          disabled
                        />
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="profile-form-input"
                          placeholder="Enter your phone number"
                        />
                      </div>

                      {/* Writer-specific bio field */}
                      {user?.role === 'writer' && (
                        <div className="profile-form-group">
                          <label className="profile-form-label">
                            Professional Bio (Marketplace)
                          </label>
                          <textarea
                            value={formData.writerBio || ''}
                            onChange={(e) => handleInputChange('writerBio', e.target.value)}
                            rows={6}
                            maxLength={1000}
                            className="profile-form-textarea"
                            placeholder="Describe your professional experience, skills, and what makes you stand out as a writer. This will be displayed in the marketplace..."
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            {(formData.writerBio || '').length}/1000 characters - This appears in the marketplace
                          </p>
                        </div>
                      )}

                        {/* Writer Specialties */}
                        {user?.role === 'writer' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Specialties & Expertise Areas
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {(formData.writerSpecialties || []).map((specialty, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                                >
                                  {specialty}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSpecialty(specialty)}
                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                  >
                                    <CloseOutlined className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="relative">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newSpecialty}
                                  onChange={(e) => handleSpecialtySearch(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && handleAddSpecialty()}
                                  placeholder="Add a specialty (e.g., Academic Writing, Research Papers)"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddSpecialty()}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                >
                                  <PlusOutlined className="w-4 h-4" />
                                </button>
                              </div>
                              
                              {/* Suggestions dropdown */}
                              {newSpecialty && specialtySuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                  {specialtySuggestions.map((suggestion, index) => (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => handleAddSpecialty(suggestion)}
                                      className="w-full text-left px-3 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg text-sm"
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Add your areas of expertise to help students find you
                            </p>
                          </div>
                        )}

                        {/* Response Time */}
                        {user?.role === 'writer' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Response Time Commitment
                            </label>
                            <select
                              value={formData.responseTime}
                              onChange={(e) => handleInputChange('responseTime', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            >
                              <option value={1}>Within 1 hour</option>
                              <option value={2}>Within 2 hours</option>
                              <option value={4}>Within 4 hours</option>
                              <option value={8}>Within 8 hours</option>
                              <option value={12}>Within 12 hours</option>
                              <option value={24}>Within 24 hours</option>
                              <option value={48}>Within 2 days</option>
                              <option value={72}>Within 3 days</option>
                            </select>
                            <p className="text-sm text-gray-500 mt-1">
                              How quickly you typically respond to new messages
                            </p>
                          </div>
                        )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="profile-submit-button"
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="profile-notifications">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Notification Preferences
                    </h3>
                    <p className="text-gray-600">
                      Choose what notifications you'd like to receive
                    </p>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(notificationSettings).map(([key, value]) => (
                      <div
                        key={key}
                        className="profile-notification-item"
                      >
                        <div className="profile-notification-content">
                          <h4 className="profile-notification-title">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </h4>
                          <p className="profile-notification-description">
                            {key === 'emailNotifications' && 'Receive notifications via email'}
                            {key === 'pushNotifications' && 'Receive push notifications'}
                            {key === 'assignmentUpdates' && 'Get notified about assignment progress'}
                            {key === 'paymentReminders' && 'Reminders for upcoming payments'}
                            {key === 'marketingEmails' && 'Receive updates about new features and offers'}
                          </p>
                        </div>
                        <label className="profile-toggle">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={() => handleNotificationChange(key, !value)}
                            className="profile-toggle-input"
                          />
                          <span className="profile-toggle-slider"></span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </div>
          </div>
        </div>
      </div>
      
      <MobileBottomTabs />
    </div>
  );
};

export default ProfileSettings;