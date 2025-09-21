import React from 'react';
import { motion } from 'framer-motion';

const CustomPreloader = ({ size = 'medium', text = 'Loading...', color = 'primary' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xlarge: 'w-20 h-20'
  };

  const colorClasses = {
    primary: 'border-[#E0B13A]',
    white: 'border-white',
    gray: 'border-gray-400',
    blue: 'border-blue-500'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Spinning Loader */}
      <div className="relative">
        <motion.div
          className={`${sizeClasses[size]} border-4 border-gray-200 border-t-4 ${colorClasses[color]} rounded-full`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Inner Pulse */}
        <motion.div
          className={`absolute inset-2 border-2 border-gray-100 border-t-2 ${colorClasses[color]} rounded-full opacity-50`}
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Loading Text */}
      {text && (
        <motion.p
          className="text-sm font-medium text-gray-600"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {text}
        </motion.p>
      )}

      {/* Dots Animation */}
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-[#E0B13A] rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Email Sending Preloader
export const EmailSendingPreloader = () => (
  <div className="flex flex-col items-center justify-center space-y-6 py-8">
    {/* Email Icon with Animation */}
    <motion.div
      className="relative"
      animate={{ y: [0, -5, 0] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <div className="w-16 h-16 bg-gradient-to-br from-[#E0B13A] to-[#D4A017] rounded-full flex items-center justify-center shadow-lg">
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      
      {/* Floating Particles */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-[#E0B13A] rounded-full opacity-60"
          animate={{
            x: [0, 20, -20, 0],
            y: [0, -20, 20, 0],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut"
          }}
          style={{
            left: `${20 + i * 20}%`,
            top: `${20 + i * 15}%`
          }}
        />
      ))}
    </motion.div>

    {/* Loading Text */}
    <div className="text-center space-y-2">
      <motion.h3
        className="text-lg font-semibold text-gray-800"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        Sending Reset Email
      </motion.h3>
      <motion.p
        className="text-sm text-gray-600"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        Please wait while we send the password reset link...
      </motion.p>
    </div>

    {/* Progress Bar */}
    <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-[#E0B13A] to-[#D4A017] rounded-full"
        animate={{ x: ['-100%', '100%'] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  </div>
);

// Success Animation
export const SuccessAnimation = ({ message = "Email sent successfully!" }) => (
  <motion.div
    className="flex flex-col items-center justify-center space-y-4 py-8"
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
  >
    {/* Success Icon */}
    <motion.div
      className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, duration: 0.3, ease: "easeOut" }}
    >
      <motion.svg
        className="w-8 h-8 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M5 13l4 4L19 7"
        />
      </motion.svg>
    </motion.div>

    {/* Success Message */}
    <motion.p
      className="text-center text-gray-700 font-medium"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.7, duration: 0.3 }}
    >
      {message}
    </motion.p>
  </motion.div>
);

export default CustomPreloader;
