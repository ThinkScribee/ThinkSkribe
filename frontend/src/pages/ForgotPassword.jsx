import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button } from 'antd';
import { MailOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import toast from "react-hot-toast";
import AuthLayout from "../Authlayout";
import { requestPasswordReset } from '../api/auth';
import { EmailSendingPreloader, SuccessAnimation } from '../components/CustomPreloader';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const navigate = useNavigate();


  const handleBackToSignIn = () => {
    navigate('/signin');
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    setSentEmail('');
  };

  // Email validation function
  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Enhanced form submission with better validation
  const onFinish = async (values) => {
    // Additional client-side validation
    if (!validateEmail(values.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 [ForgotPassword] Starting password reset for:', values.email);
      const response = await requestPasswordReset(values.email);
      console.log('✅ [ForgotPassword] Password reset successful:', response);
      
      setSentEmail(values.email);
      setEmailSent(true);
      toast.success('Password reset link sent to your email!');
    } catch (error) {
      console.error('❌ [ForgotPassword] Password reset error:', error);
      
      // Use the enhanced error message from auth service
      const errorMessage = error.message || 'Failed to send reset email. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="We've sent a password reset link to your email address"
        footerText="Remember your password?"
        footerLink="/signin"
        footerLinkText="Sign in"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6"
        >
          {/* Success Animation */}
          <SuccessAnimation message="Password reset email sent successfully!" />

          {/* Email Details */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-[#2C3E50]">
              Email Sent Successfully!
            </h3>
            <p className="text-[#7F8C8D] leading-relaxed">
              We've sent a password reset link to <br />
              <span className="font-medium text-[#2C3E50]">{sentEmail}</span>
            </p>
            <p className="text-sm text-[#95A5A6]">
              Please check your inbox and follow the instructions to reset your password.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              type="primary"
              onClick={handleBackToSignIn}
              className="w-full bg-[#E0B13A] hover:bg-[#F0C14B] border-none rounded-lg h-12 font-semibold text-lg shadow-md transition-all duration-300 hover:scale-[1.02]"
            >
              Back to Sign In
            </Button>
            
            <Button
              type="default"
              onClick={handleResendEmail}
              className="w-full border-[#BDC3C7] text-[#7F8C8D] hover:border-[#E0B13A] hover:text-[#E0B13A] rounded-lg h-10 font-medium transition-all duration-300"
            >
              Send to Different Email
            </Button>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-800">
              <strong>Didn't receive the email?</strong> Check your spam folder or try again with a different email address.
            </p>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Enter your email address and we'll send you a link to reset your password"
      footerText="Remember your password?"
      footerLink="/signin"
      footerLinkText="Sign in"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Back Button */}
        <div className="flex items-center">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/signin')}
            className="text-[#7F8C8D] hover:text-[#E0B13A] p-0 h-auto font-medium transition-colors"
          >
            Back to Sign In
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="py-8"
          >
            <EmailSendingPreloader />
          </motion.div>
        )}

        {/* Form */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Form
              name="forgot_password"
              onFinish={onFinish}
              layout="vertical"
              className="space-y-6"
              size="large"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Please input your email address!' },
                  { type: 'email', message: 'Please enter a valid email address' },
                  { 
                    min: 5, 
                    message: 'Email address must be at least 5 characters long' 
                  },
                  {
                    max: 254,
                    message: 'Email address is too long'
                  }
                ]}
                className="mb-6"
              >
                <Input
                  prefix={<MailOutlined className="text-[#7F8C8D]" />}
                  placeholder="Enter your email address"
                  size="large"
                  className="h-12 rounded-lg border-[#BDC3C7] hover:border-[#E0B13A] focus:border-[#E0B13A] transition-colors"
                  disabled={loading}
                />
              </Form.Item>

              <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full bg-[#E0B13A] hover:bg-[#F0C14B] border-none rounded-lg h-12 font-semibold text-lg shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            >
              {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </Button>
          </Form.Item>
        </Form>

            {/* Help Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
              <h4 className="font-medium text-[#2C3E50] mb-2">Need Help?</h4>
              <p className="text-sm text-[#7F8C8D] leading-relaxed">
                If you're having trouble accessing your account, make sure you're using the email address associated with your ThinqScribe account.
              </p>
            </div>

            {/* Security Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Security Notice:</strong> For your security, password reset links expire after 10 minutes. If you don't receive an email within a few minutes, please check your spam folder.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AuthLayout>
  );
};

export default ForgotPassword;