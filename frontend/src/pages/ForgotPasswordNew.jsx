import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Card } from 'antd';
import { MailOutlined, ArrowLeftOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import toast from "react-hot-toast";
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPasswordNew = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    
    try {
      // Import the API function dynamically to avoid issues
      const { requestPasswordReset } = await import('../api/auth');
      
      const response = await requestPasswordReset(values.email);
      
      // Set success state
      setSentEmail(values.email);
      setEmailSent(true);
      
      toast.success('Password reset link sent to your email!');
    } catch (error) {
      const errorMessage = error.message || 'Failed to send reset email. Please try again.';
      toast.error(errorMessage);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 rounded-2xl overflow-hidden">
            <div className="text-center p-8">
              {/* Success Icon */}
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

              {/* Success Message */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-gray-800 mb-4"
              >
                Check Your Email
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 mb-6"
              >
                We've sent a password reset link to:
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
              >
                <p className="font-medium text-blue-800">{sentEmail}</p>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-sm text-gray-500 mb-8"
              >
                Please check your inbox and follow the instructions to reset your password. 
                The link will expire in 10 minutes.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-3"
              >
                <Button
                  type="primary"
                  onClick={handleBackToSignIn}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 border-none rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Back to Sign In
                </Button>
                
                <Button
                  type="default"
                  onClick={handleResendEmail}
                  className="w-full h-10 border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600 rounded-lg font-medium transition-all duration-300"
                >
                  Send to Different Email
                </Button>
              </motion.div>

              {/* Help Text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <p className="text-sm text-yellow-800">
                  <strong>Didn't receive the email?</strong> Check your spam folder or try again with a different email address.
                </p>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

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
                Forgot Password?
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600"
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
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/signin')}
                className="text-gray-500 hover:text-blue-600 p-0 h-auto font-medium transition-colors"
              >
                Back to Sign In
              </Button>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Form
                name="forgot_password_new"
                onFinish={handleSubmit}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: 'Please input your email address!' },
                    { type: 'email', message: 'Please enter a valid email address' },
                    { min: 5, message: 'Email address must be at least 5 characters long' },
                    { max: 254, message: 'Email address is too long' }
                  ]}
                >
                  <Input
                    prefix={<MailOutlined className="text-gray-400" />}
                    placeholder="Enter your email address"
                    className="h-12 rounded-lg border-gray-300 hover:border-blue-500 focus:border-blue-500 transition-colors"
                    disabled={loading}
                  />
                </Form.Item>

                <Form.Item className="mb-6">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 border-none rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
                  </Button>
                </Form.Item>
              </Form>

              {/* Help Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-4"
              >
                <Alert
                  message="Need Help?"
                  description="If you're having trouble accessing your account, make sure you're using the email address associated with your ThinqScribe account."
                  type="info"
                  showIcon
                  className="rounded-lg"
                />

                <Alert
                  message="Security Notice"
                  description="For your security, password reset links expire after 10 minutes. If you don't receive an email within a few minutes, please check your spam folder."
                  type="warning"
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
          transition={{ delay: 0.8 }}
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

export default ForgotPasswordNew;