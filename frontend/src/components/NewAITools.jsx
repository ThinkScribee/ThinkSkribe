import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  FileText, 
  CheckCircle, 
  Search, 
  Zap, 
  ArrowRight,
  Sparkles,
  BookOpen,
  PenTool,
  Target
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const NewAITools = () => {
  const tools = [
    {
      icon: <PenTool className="w-8 h-8" />,
      title: "Grammar Checker",
      description: "Advanced AI grammar and style checker that ensures your writing is polished and professional.",
      link: "/grammar-checker",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Citation Generator",
      description: "Automatically generate accurate citations in APA, MLA, Chicago, and other academic formats.",
      link: "/citation-generator",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: "Plagiarism Detector",
      description: "Comprehensive plagiarism detection to ensure your work is original and properly cited.",
      link: "/plagiarism-detector",
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      textColor: "text-red-600"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Writing Enhancement",
      description: "AI-powered writing assistant that improves clarity, flow, and academic tone.",
      link: "/writing-enhancement",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Structure Analyzer",
      description: "Analyze and optimize your paper's structure for better academic presentation.",
      link: "/structure-analyzer",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
    <section id="ai-tools" className="py-16 lg:py-24 bg-white">
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
            Smart AI Tools for
            <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Academic Excellence
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Leverage cutting-edge artificial intelligence to enhance your writing, research, and academic performance 
            with our comprehensive suite of professional tools.
          </p>
        </motion.div>

        {/* Mobile Carousel */}
        <div className="block md:hidden mb-12 pt-8">
          <div className="px-4">
            <Swiper
              modules={[Pagination]}
              pagination={{ clickable: true }}
              spaceBetween={20}
              slidesPerView={1}
              className="pb-12 !overflow-visible"
              style={{ paddingTop: '20px' }}
            >
            {tools.map((tool, index) => (
              <SwiperSlide key={index}>
                <div className="group">
                  <Link to={tool.link}>
                    <div className="bg-white p-6 shadow-lg border border-gray-100 h-full" style={{ borderRadius: '15px' }}>
                      {/* Icon */}
                      <div className={`w-12 h-12 ${tool.bgColor} rounded-xl flex items-center justify-center mb-4 ${tool.textColor}`}>
                        {tool.icon}
                      </div>
                      
                      {/* Content */}
                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        {tool.title}
                      </h3>
                      <p className="text-gray-600 mb-4 leading-relaxed text-sm">
                        {tool.description}
                      </p>
                      
                      {/* CTA */}
                      <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                        <span>Try Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </div>
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
          className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12"
        >
          {tools.map((tool, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group"
            >
              <Link to={tool.link}>
                <div className="bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-primary/30 h-full" style={{ borderRadius: '15px' }}>
                  {/* Icon */}
                  <div className={`w-12 h-12 ${tool.bgColor} rounded-xl flex items-center justify-center mb-4 ${tool.textColor} group-hover:scale-105 transition-all duration-300`}>
                    {tool.icon}
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed text-sm">
                    {tool.description}
                  </p>
                  
                  {/* CTA */}
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all duration-300">
                    <span>Try Now</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <div className="bg-gray-50 p-8 lg:p-12 max-w-4xl mx-auto" style={{ borderRadius: '15px' }}>
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Supercharge Your Academic Writing
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Access all our AI tools with a free account. No credit card required. 
              Start improving your academic writing today.
            </p>
            <Link to="/signup">
              <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-3">
                <BookOpen className="w-5 h-5" />
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default NewAITools;