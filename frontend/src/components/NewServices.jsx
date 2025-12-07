import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, Brain, Shield, Clock, Award, Target, FileText } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const NewServices = () => {
  const services = [
    {
      icon: <BookOpen className="w-12 h-12" />,
      title: "Academic Writing Services",
      description: "Professional freelance writers provide expert assistance with essays, research papers, dissertations, and thesis projects.",
      features: ["PhD Writers", "Original Content", "Free Revisions", "24/7 Support"],
      badge: "Most Popular",
      badgeColor: "bg-blue-100 text-blue-800",
      gradient: "from-blue-500 to-blue-600",
      borderColor: "border-blue-200"
    },
    {
      icon: <Brain className="w-12 h-12" />,
      title: "AI Research Tools",
      description: "Advanced AI-powered research tools for academic writing, citation, grammar checking, and content optimization.",
      features: ["Smart Research", "Auto Citations", "Grammar AI", "Plagiarism Check"],
      badge: "AI Powered",
      badgeColor: "bg-purple-100 text-purple-800",
      gradient: "from-purple-500 to-purple-600",
      borderColor: "border-purple-200"
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: "Expert Writer Matching",
      description: "Get matched with specialized freelance academic writers based on your subject and research requirements.",
      features: ["Subject Experts", "Verified Credentials", "Direct Communication", "Quality Guarantee"],
      badge: "Premium",
      badgeColor: "bg-green-100 text-green-800",
      gradient: "from-green-500 to-emerald-600",
      borderColor: "border-green-200"
    }
  ];

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "100% Original Work",
      description: "Every piece is written from scratch with plagiarism-free guarantee."
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "24/7 Support",
      description: "Round-the-clock assistance for all your academic needs."
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Expert Writers",
      description: "PhD and Master's degree holders in every academic field."
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "On-Time Delivery",
      description: "Guaranteed delivery before your deadline, every time."
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
    <section id="services" className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Expert Academic Writing &
            <span className="block bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Research Tools
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            From professional freelance writers to cutting-edge AI research tools, we provide everything you need 
            to excel in your academic writing and research journey.
          </p>
        </motion.div>

        {/* Mobile Carousel */}
        <div className="block md:hidden mb-16 pt-8">
          <div className="px-4">
            <Swiper
              modules={[Pagination]}
              pagination={{ clickable: true }}
              spaceBetween={20}
              slidesPerView={1}
              className="pb-12 !overflow-visible"
              style={{ paddingTop: '20px' }}
            >
            {services.map((service, index) => (
              <SwiperSlide key={index}>
                <motion.div
                  variants={itemVariants}
                  className="relative bg-white p-6 shadow-lg border border-gray-100"
                  style={{ borderRadius: '15px' }}
                >
                  {/* Badge */}
                  <div className={`absolute -top-3 left-6 ${service.badgeColor} px-3 py-1 rounded-full text-xs font-semibold shadow-sm`}>
                    {service.badge}
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${service.gradient} rounded-xl flex items-center justify-center mb-6 text-white`}>
                    {service.icon}
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed text-sm">
                    {service.description}
                  </p>
                  
                  {/* Features */}
                  <ul className="space-y-2">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
          </div>
        </div>

        {/* Desktop Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative bg-white p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-100"
              style={{ borderRadius: '15px' }}
            >
              {/* Badge */}
              <div className={`absolute -top-3 left-6 ${service.badgeColor} px-3 py-1 rounded-full text-xs font-semibold shadow-sm`}>
                {service.badge}
              </div>
              
              {/* Icon */}
              <div className={`w-16 h-16 bg-gradient-to-br ${service.gradient} rounded-xl flex items-center justify-center mb-6 text-white group-hover:scale-105 transition-all duration-300`}>
                {service.icon}
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {service.title}
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed text-sm">
                {service.description}
              </p>
              
              {/* Features */}
              <ul className="space-y-2">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="text-center group"
            >
              <div className="w-16 h-16 bg-white flex items-center justify-center mx-auto mb-4 text-primary shadow-sm border border-gray-100 group-hover:shadow-md transition-all duration-300" style={{ borderRadius: '15px' }}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default NewServices;