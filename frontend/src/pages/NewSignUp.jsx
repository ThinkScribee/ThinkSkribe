import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { X, Eye, EyeOff } from 'lucide-react';
import { getAuthErrorMessage } from '../utils/errorMessages.js';

const NewSignUp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { referralCode: urlReferralCode } = useParams();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    referralCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { register, isAuthenticated } = useAuth();

  // Extract referral code
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const queryReferralCode = urlParams.get('ref');
    const stateReferralCode = location.state?.referralCode;
    const storedReferralCode = localStorage.getItem('pending_referral_code');
    
    const referralCode = urlReferralCode || queryReferralCode || stateReferralCode || storedReferralCode;
    
    if (referralCode) {
      const upperCode = referralCode.toUpperCase();
      setFormData(prev => ({ ...prev, referralCode: upperCode }));
      
      if (storedReferralCode) {
        localStorage.removeItem('pending_referral_code');
      }
    }
  }, [location.search, location.state, urlReferralCode]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registrationData } = formData;
      await register(registrationData);
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error);
      setErrors({
        submit: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-blue-200 flex items-center justify-center p-1 md:p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white shadow-2xl"
        style={{ borderRadius: '16px', transform: 'scale(0.62)', transformOrigin: 'center' }}
      >
        <div className="flex flex-col md:flex-row min-h-[550px] md:min-h-[600px]" style={{ transform: 'scale(1)', transformOrigin: 'center' }}>
          {/* Left Side - Form */}
          <div className="w-full md:w-1/2 p-4 md:p-8 flex flex-col justify-center relative">
            {/* Close Button */}
            <Link 
              to="/" 
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </Link>

            <div className="max-w-sm mx-auto w-full">
              <h1 className="text-lg md:text-3xl font-bold text-gray-900 mb-3 md:mb-6">
                Sign up
              </h1>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-2 md:space-y-4">
                {/* Submit Error */}
                {errors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                    {errors.submit}
                  </div>
                )}

                {/* Full Name Field */}
                <div>
                  <label htmlFor="name" className="block text-xs text-gray-600 mb-0.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-2.5 py-2 md:px-3 md:py-2.5 bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all rounded-lg text-xs md:text-sm"
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="mt-0.5 text-xs text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-xs text-gray-600 mb-0.5">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-2.5 py-2 md:px-3 md:py-2.5 bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all rounded-lg text-xs md:text-sm"
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="mt-0.5 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-xs text-gray-600 mb-0.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-2.5 py-2 pr-9 md:px-3 md:py-2.5 bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all rounded-lg text-xs md:text-sm"
                      placeholder="Enter your password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-0.5 text-xs text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs text-gray-600 mb-0.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-2.5 py-2 pr-9 md:px-3 md:py-2.5 bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all rounded-lg text-xs md:text-sm"
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-0.5 text-xs text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-xs text-gray-600 mb-0.5">
                    I am a
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="student"
                        checked={formData.role === 'student'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`p-2 border rounded-lg transition-all ${
                        formData.role === 'student' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-blue-400'
                      }`}>
                        <div className="text-center">
                          <div className={`text-xs font-semibold ${
                            formData.role === 'student' ? 'text-blue-600' : 'text-gray-700'
                          }`}>
                            Student
                          </div>
                        </div>
                      </div>
                    </label>

                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="writer"
                        checked={formData.role === 'writer'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`p-2 border rounded-lg transition-all ${
                        formData.role === 'writer' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-blue-400'
                      }`}>
                        <div className="text-center">
                          <div className={`text-xs font-semibold ${
                            formData.role === 'writer' ? 'text-blue-600' : 'text-gray-700'
                          }`}>
                            Writer
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white py-2.5 md:py-3 px-4 rounded-lg font-semibold transition-colors text-xs md:text-sm"
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </button>

                {/* Terms and Privacy */}
                <div className="text-center pt-1">
                  <p className="text-xs text-gray-500">
                    By creating an account, you agree to our{' '}
                    <Link to="/terms" className="text-blue-600 hover:text-blue-700">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-blue-600 hover:text-blue-700">
                      Privacy Policy
                    </Link>
                  </p>
                </div>

                {/* Sign In Link */}
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-600">
                    Already have an account?{' '}
                    <Link to="/signin" className="text-blue-600 hover:text-blue-700 font-semibold">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
            <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
              <img src="/App-Icon-Light.png" alt="ThinqScribe" className="h-7 w-7" />
              <span className="text-white font-bold text-lg">ThinqScribe</span>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=1000&fit=crop" 
              alt="Student" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NewSignUp;
