import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, Lock, X } from 'lucide-react';
import toast, { Toaster } from "react-hot-toast";

const ForgotPasswordNew = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      toast.error('Please enter your email address');
      return;
    }
    
    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      toast.error('Please enter a valid email address');
      return;
    }

    setErrors({});
    setLoading(true);
    
    // Show immediate feedback with longer duration
    toast.loading('Sending reset link... This may take a moment.', { 
      id: 'reset-email',
      duration: 45000 // Show loading for up to 45 seconds
    });
    
    // Show a warning after 10 seconds if still loading
    let warningTimeout = setTimeout(() => {
      toast.loading('Still sending... Email service is processing your request.', { 
        id: 'reset-email-warning',
        duration: 30000
      });
    }, 10000);
    
    try {
      // Import the API function dynamically to avoid issues
      const { requestPasswordReset } = await import('../api/auth');
      
      console.log('Sending password reset request for:', email);
      const response = await requestPasswordReset(email);
      console.log('Password reset request successful:', response);
      
      // Clear the warning timeout immediately on success
      clearTimeout(warningTimeout);
      toast.dismiss('reset-email-warning');
      
      // Set success state immediately
      setSentEmail(email);
      setEmailSent(true);
      
      // Show success toast
      toast.success('Password reset link sent to your email!', { 
        id: 'reset-email',
        duration: 4000 
      });
      
    } catch (error) {
      console.error('Password reset error details:', {
        error,
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Clear the warning timeout on error
      clearTimeout(warningTimeout);
      toast.dismiss('reset-email-warning');
      
      // Extract error message with fallbacks
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message && error.message !== 'Invalid response from server') {
        errorMessage = error.message;
      }
      
      // Show error toast
      toast.error(errorMessage, { 
        id: 'reset-email',
        duration: 5000 
      });
      
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    navigate('/signin');
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    setSentEmail('');
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100"
        >
          <div className="p-8 text-center">
            {/* Close Button */}
            <Link 
              to="/" 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </Link>

            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-6"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </motion.div>

            {/* Success Message */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 mb-4"
            >
              Check Your Email
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-6"
            >
              We've sent a password reset link to:
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"
            >
              <p className="font-semibold text-blue-800">{sentEmail}</p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-gray-500 mb-8 leading-relaxed"
            >
              Please check your inbox and follow the instructions to reset your password. 
              The link will expire in 10 minutes.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-3"
            >
              <button
                onClick={handleBackToSignIn}
                className="w-full bg-black hover:bg-gray-800 text-white py-3 px-4 rounded-xl font-semibold transition-colors"
              >
                Back to Sign In
              </button>
              
              <button
                onClick={handleResendEmail}
                className="w-full border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 py-3 px-4 rounded-xl font-medium transition-colors"
              >
                Send to Different Email
              </button>
            </motion.div>

            {/* Help Text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl"
            >
              <p className="text-sm text-amber-800">
                <strong>Didn't receive the email?</strong> Check your spam folder or contact support if you continue having issues.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 relative"
      >
        {/* Close Button */}
        <Link 
          to="/" 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </Link>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-6"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 mb-3"
            >
              Forgot Password?
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 leading-relaxed"
            >
              Enter your email address and we'll send you a link to reset your password
            </motion.p>
          </div>

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <button
              onClick={() => navigate('/signin')}
              className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </button>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors({ ...errors, email: '' });
                    }
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email address"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending Reset Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </motion.form>


        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center pb-6"
        >
          <p className="text-gray-500 text-sm">
            Remember your password?{' '}
            <Link to="/signin" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordNew;