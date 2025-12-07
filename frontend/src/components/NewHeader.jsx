import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  User, 
  LogOut, 
  Settings, 
  LayoutDashboard, 
  Search, 
  Bell, 
  MessageCircle, 
  MapPin,
  X
} from 'lucide-react';
import LocationDisplay from './LocationDisplay';

const NewHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useNotifications();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch notifications when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
    }
  }, [isAuthenticated, user, fetchNotifications]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
      if (isNotificationOpen && !event.target.closest('.notification-container')) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen, isNotificationOpen]);

  // Get message and notification counts
  const messageNotifications = useMemo(() => 
    notifications.filter(n => 
      n.type === 'message' || n.title?.toLowerCase().includes('message') || n.content?.toLowerCase().includes('message')
    ), [notifications]
  );
  
  const unreadMessageCount = useMemo(() => 
    messageNotifications.filter(n => !n.read).length, 
    [messageNotifications]
  );

  const generalNotifications = useMemo(() => 
    notifications.filter(n => 
      n.type !== 'message' && !n.title?.toLowerCase().includes('message') && !n.content?.toLowerCase().includes('message')
    ), [notifications]
  );
  
  const unreadNotificationCount = useMemo(() => 
    generalNotifications.filter(n => !n.read).length, 
    [generalNotifications]
  );

  // Handle search
  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  // Handle messages click
  const handleMessagesClick = () => {
    messageNotifications.forEach(notif => {
      if (!notif.read) {
        markAsRead(notif._id);
      }
    });
    
    if (user?.role === 'student') {
      navigate('/chat/student');
    } else if (user?.role === 'writer') {
      navigate('/chat/writer');
    } else {
      navigate('/messages');
    }
    setIsMobileMenuOpen(false);
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await markAsRead(notification._id);
      }
      
      if (notification.link) {
        navigate(notification.link);
      } else {
        navigate('/notifications');
      }
      
      setIsNotificationOpen(false);
    } catch (error) {
      if (notification.link) {
        navigate(notification.link);
      } else {
        navigate('/notifications');
      }
      setIsNotificationOpen(false);
    }
  };

  const navItems = [
    { name: 'Services', href: '#services' },
    { name: 'AI Tools', href: '#ai-tools' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'About', href: '/about' }
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <img
                src="/App-Icon-Light.png"
                alt="ThinqScribe"
                className="h-8 w-8 lg:h-10 lg:w-10 transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="hidden sm:block">
              <img
                src="/Thinq-Scribe.png"
                alt="ThinqScribe"
                className="h-6 lg:h-7 transition-opacity duration-300 group-hover:opacity-80"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`${
                  isScrolled ? 'text-gray-700' : 'text-white'
                } hover:text-primary font-medium transition-colors duration-200 relative group`}
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </nav>

          {/* Search, Notifications, Messages, User Menu */}
          <div className="hidden lg:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {/* Search */}
                <div className="relative">
                  {isSearchOpen ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleSearch}
                        placeholder="Search..."
                        className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                      <button
                        onClick={() => setIsSearchOpen(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsSearchOpen(true)}
                      className={`p-2 rounded-lg ${
                        isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
                      } transition-colors`}
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Location */}
                <div className={`${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                  <LocationDisplay />
                </div>

                {/* Messages */}
                <button
                  onClick={handleMessagesClick}
                  className={`relative p-2 rounded-lg ${
                    isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
                  } transition-colors`}
                >
                  <MessageCircle className="w-5 h-5" />
                  {unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
                </button>

                {/* Notifications */}
                <div className="relative notification-container">
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className={`relative p-2 rounded-lg ${
                      isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
                    } transition-colors`}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotificationOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 max-h-96 overflow-y-auto"
                      >
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                          {unreadNotificationCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-primary hover:text-primary-dark"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        
                        {generalNotifications.length > 0 ? (
                          <div className="max-h-64 overflow-y-auto">
                            {generalNotifications.slice(0, 10).map((notification) => (
                              <div
                                key={notification._id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                                  notification.read ? 'border-transparent' : 'border-primary bg-blue-50'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                      {notification.content}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {new Date(notification.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-primary rounded-full ml-2 mt-1"></div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No notifications</p>
                          </div>
                        )}
                        
                        <div className="px-4 py-2 border-t border-gray-100">
                          <Link
                            to="/notifications"
                            onClick={() => setIsNotificationOpen(false)}
                            className="text-xs text-primary hover:text-primary-dark"
                          >
                            View all notifications
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Menu */}
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center space-x-2 ${
                      isScrolled ? 'text-gray-700' : 'text-white'
                    } hover:text-primary transition-colors duration-200`}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="font-medium">{user.name}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <p className="text-xs text-primary font-medium mt-1 capitalize">{user.role}</p>
                        </div>
                        
                        <Link
                          to="/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span className="text-sm">Dashboard</span>
                        </Link>
                        
                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span className="text-sm">Profile</span>
                        </Link>
                        
                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span className="text-sm">Settings</span>
                        </Link>
                        
                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              logout();
                              navigate('/');
                            }}
                            className="flex items-center space-x-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors w-full"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  className={`${
                    isScrolled ? 'text-gray-700' : 'text-white'
                  } hover:text-primary font-medium transition-colors duration-200`}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 rounded-md ${
              isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
            } hover:text-primary transition-colors duration-200`}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white border-t border-gray-100 shadow-lg"
          >
            <div className="px-4 py-6 space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-gray-700 hover:text-primary font-medium py-2 transition-colors duration-200"
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4 space-y-3">
                {isAuthenticated && user ? (
                  <>
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-primary font-medium mt-1 capitalize">{user.role}</p>
                    </div>
                    
                    {/* Mobile Search */}
                    <div className="px-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={handleSearch}
                          placeholder="Search..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>
                    </div>

                    {/* Mobile Location */}
                    <div className="px-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <LocationDisplay />
                      </div>
                    </div>

                    {/* Mobile Messages */}
                    <button
                      onClick={handleMessagesClick}
                      className="flex items-center justify-between w-full px-4 py-2 text-gray-700 hover:text-primary transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <MessageCircle className="w-5 h-5" />
                        <span>Messages</span>
                      </div>
                      {unreadMessageCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                        </span>
                      )}
                    </button>

                    {/* Mobile Notifications */}
                    <Link
                      to="/notifications"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between w-full px-4 py-2 text-gray-700 hover:text-primary transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Bell className="w-5 h-5" />
                        <span>Notifications</span>
                      </div>
                      {unreadNotificationCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-center text-gray-700 hover:text-primary font-medium py-2 transition-colors duration-200"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-center text-gray-700 hover:text-primary font-medium py-2 transition-colors duration-200"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="block w-full text-center text-red-600 hover:text-red-700 font-medium py-2 transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-center text-gray-700 hover:text-primary font-medium py-2 transition-colors duration-200"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-center bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-full font-semibold transition-all duration-300"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default NewHeader;