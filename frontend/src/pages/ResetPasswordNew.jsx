import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, Alert, Card, Progress } from 'antd';
import { LockOutlined, EyeInvisibleOutlined, EyeTwoTone, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import toast from "react-hot-toast";
import { motion, AnimatePresence } from 'framer-motion';

const ResetPasswordNew = () => {
  const [loading, setLoading] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [tokenValid, setTokenValid] = useState(null); // null = checking, true = valid, false = invalid
  const { resetToken } = useParams();
  const navigate = useNavigate();

  // Password strength checker
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordStrengthText, setPasswordStrengthText] = useState('');
  const [passwordStrengthColor, setPasswordStrengthColor] = useState('#f0f0f0');

  useEffect(() => {
    // Validate token on component mount
    if (resetToken) {
      validateToken();
    } else {
      setTokenValid(false);
    }
  }, [resetToken]);

  const validateToken = async () => {
    try {
      // You can add a token validation API call here if needed
      // For now, we'll assume the token is valid if it exists and has proper format
      if (resetToken && resetToken.length > 20) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setTokenValid(false);
    }
  };

  const checkPasswordStrength = (password) => {
    let strength = 0;
    let text = '';
    let color = '#f0f0f0';

    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;

    if (strength < 25) {
      text = 'Very Weak';
      color = '#ff4d4f';
    } else if (strength < 50) {
      text = 'Weak';
      color = '#ff7a45';
    } else if (strength < 75) {
      text = 'Fair';
      color = '#faad14';
    } else if (strength < 100) {
      text = 'Good';
      color = '#52c41a';
    } else {
      text = 'Strong';
      color = '#389e0d';
    }

    setPasswordStrength(strength);
    setPasswordStrengthText(text);
    setPasswordStrengthColor(color);
  };

  const handleSubmit = async (values) => {
    if (values.password !== values.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordStrength < 75) {
      toast.error('Password is too weak. Please choose a stronger password.');
      return;
    }

    setLoading(true);
    try {
      // Import the API function dynamically
      const { resetPassword } = await import('../api/auth');
      
      console.log('🔄 [ResetPasswordNew] Resetting password with token:', resetToken);
      const response = await resetPassword(resetToken, values.password);
      console.log('✅ [ResetPasswordNew] Password reset successful:', response);
      
      setPasswordReset(true);
      toast.success('Password reset successfully!');
    } catch (error) {
      console.error('❌ [ResetPasswordNew] Password reset error:', error);
      
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.response?.status === 400) {
        errorMessage = 'Invalid or expired reset token. Please request a new password reset link.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    navigate('/signin');
  };

  const handleRequestNewLink = () => {
    navigate('/forgot-password');
  };

  // Token validation loading
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Validating reset token...</p>
        </motion.div>
      </div>
    );
  }

  // Invalid token
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 rounded-2xl overflow-hidden">
            <div className="text-center p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <LockOutlined className="text-4xl text-red-500" />
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-800 mb-4"
              >
                Invalid Reset Link
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mb-8"
              >
                This password reset link is invalid or has expired. Please request a new one.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <Button
                  type="primary"
                  onClick={handleRequestNewLink}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 border-none rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Request New Reset Link
                </Button>
                
                <Button
                  type="default"
                  onClick={handleBackToSignIn}
                  className="w-full h-10 border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600 rounded-lg font-medium transition-all duration-300"
                >
                  Back to Sign In
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (passwordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 rounded-2xl overflow-hidden">
            <div className="text-center p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircleOutlined className="text-4xl text-green-500" />
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-800 mb-4"
              >
                Password Reset Successfully!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mb-8"
              >
                Your password has been successfully reset. You can now sign in with your new password.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  type="primary"
                  onClick={handleBackToSignIn}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 border-none rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Sign In Now
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Main reset password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 rounded-2xl overflow-hidden">
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
                  <LockOutlined className="text-2xl text-blue-600" />
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-gray-800 mb-3"
              >
                Reset Password
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600"
              >
                Enter your new password below
              </motion.p>
            </div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Form
                name="reset_password_new"
                onFinish={handleSubmit}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: 'Please input your new password!' },
                    { min: 8, message: 'Password must be at least 8 characters long' },
                    { max: 128, message: 'Password is too long' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Enter your new password"
                    className="h-12 rounded-lg border-gray-300 hover:border-blue-500 focus:border-blue-500 transition-colors"
                    disabled={loading}
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    onChange={(e) => checkPasswordStrength(e.target.value)}
                  />
                </Form.Item>

                {/* Password Strength Indicator */}
                <AnimatePresence>
                  {passwordStrength > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Password Strength:</span>
                        <span className="text-sm font-medium" style={{ color: passwordStrengthColor }}>
                          {passwordStrengthText}
                        </span>
                      </div>
                      <Progress
                        percent={passwordStrength}
                        strokeColor={passwordStrengthColor}
                        showInfo={false}
                        className="mb-2"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <Form.Item
                  name="confirmPassword"
                  rules={[
                    { required: true, message: 'Please confirm your password!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Passwords do not match!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Confirm your new password"
                    className="h-12 rounded-lg border-gray-300 hover:border-blue-500 focus:border-blue-500 transition-colors"
                    disabled={loading}
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>

                <Form.Item className="mb-6">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    disabled={passwordStrength < 75}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 border-none rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Resetting Password...' : 'Reset Password'}
                  </Button>
                </Form.Item>
              </Form>

              {/* Security Notice */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Alert
                  message="Security Requirements"
                  description="Your password must be at least 8 characters long and contain uppercase letters, lowercase letters, and numbers for better security."
                  type="info"
                  showIcon
                  className="rounded-lg"
                />
              </motion.div>
            </motion.div>
          </div>
        </Card>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-6"
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

export default ResetPasswordNew;
