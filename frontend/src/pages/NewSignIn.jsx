import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';

const NewSignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

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
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (error) {
      const errorMessage = error.response?.data?.userFriendlyMessage || 
                          error.userFriendlyMessage || 
                          error.message || 
                          'Sign in failed. Please check your credentials and try again.';
      setErrors({
        submit: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-blue-200 flex items-center justify-center p-2 md:p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white shadow-2xl"
        style={{ borderRadius: '16px', transform: 'scale(0.93)', transformOrigin: 'center' }}
      >
        <div className="flex flex-col md:flex-row min-h-[550px] md:min-h-[600px]" style={{ transform: 'scale(1)', transformOrigin: 'center' }}>
          {/* Left Side - Form */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center relative">
            {/* Close Button */}
            <Link 
              to="/" 
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </Link>

            <div className="max-w-sm mx-auto w-full">
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">
                Login
              </h1>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                {/* Submit Error */}
                {errors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                    {errors.submit}
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-xs md:text-sm text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-3 md:py-2.5 bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all rounded-lg text-sm"
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-xs md:text-sm text-gray-600 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 md:px-3 md:py-2.5 bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all rounded-lg text-sm"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors text-sm"
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>

                {/* Forgot Password Link */}
                <div className="text-center pt-1">
                  <Link 
                    to="/forgot-password" 
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot your password?
                  </Link>
                </div>

                {/* Sign Up Link */}
                <div className="text-center pt-3">
                  <p className="text-xs text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
                      Create one now
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
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=600&fit=crop" 
              alt="Student" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NewSignIn;
