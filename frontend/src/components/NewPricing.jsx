import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, Star, Zap, Crown, ArrowRight } from 'lucide-react';

const NewPricing = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started with basic AI tools",
      features: [
        "Basic Grammar Checker",
        "Simple Citation Generator",
        "5 AI Tool Uses/Month",
        "Community Support",
        "Basic Templates"
      ],
      buttonText: "Get Started Free",
      buttonStyle: "border-2 border-gray-300 text-gray-700 hover:border-primary hover:text-primary",
      popular: false,
      icon: <Star className="w-6 h-6" />
    },
    {
      name: "Student",
      price: "$19",
      period: "per month",
      description: "Everything you need for academic success",
      features: [
        "Advanced AI Writing Tools",
        "Unlimited Citations",
        "Plagiarism Detection",
        "Priority Support",
        "Expert Writer Access",
        "Research Assistance",
        "Grammar & Style Check",
        "Structure Analysis"
      ],
      buttonText: "Start Student Plan",
      buttonStyle: "bg-gradient-to-r from-primary to-blue-600 text-white hover:from-primary-dark hover:to-blue-700",
      popular: true,
      icon: <Zap className="w-6 h-6" />
    },
    {
      name: "Premium",
      price: "$49",
      period: "per month",
      description: "For serious researchers and graduate students",
      features: [
        "Everything in Student Plan",
        "PhD-Level Writers",
        "Unlimited Revisions",
        "1-on-1 Consultations",
        "Advanced Research Tools",
        "Priority Matching",
        "Dedicated Support",
        "Custom Templates",
        "Thesis Support"
      ],
      buttonText: "Go Premium",
      buttonStyle: "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800",
      popular: false,
      icon: <Crown className="w-6 h-6" />
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <section id="pricing" className="py-12 lg:py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 lg:mb-10"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Simple Pricing
          </h2>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            Start free and upgrade as you grow. All plans include AI tools and expert writers.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-4 lg:gap-6 mb-10"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`relative bg-white rounded-3xl p-6 transition-all duration-300 ${
                plan.popular 
                  ? 'shadow-2xl border-2 border-primary transform scale-105' 
                  : 'shadow-lg hover:shadow-xl border border-gray-200'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-white px-6 py-2 rounded-full text-sm font-bold">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className="text-center mb-6">
                <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
                  plan.popular 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {plan.icon}
                </div>
                
                {/* Plan Name */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                
                {/* Price */}
                <div className="mb-3">
                  <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 ml-2">/{plan.period}</span>
                </div>
                
                {/* Description */}
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link to="/signup">
                <button className={`w-full py-3 px-4 rounded-2xl font-semibold text-base transition-all duration-300 transform hover:scale-105 ${plan.buttonStyle} flex items-center justify-center gap-2`}>
                  {plan.buttonText}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span className="font-medium">30-Day Money Back</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span className="font-medium">No Setup Fees</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span className="font-medium">Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span className="font-medium">Secure Payment</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default NewPricing;