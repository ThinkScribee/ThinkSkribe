import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen } from 'lucide-react';

const NewHero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
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
    <section className="relative min-h-screen overflow-hidden">
      {/* Full-width Student Background Image */}
      <div className="absolute inset-0">
        <div className="relative w-full h-full">
          <img 
            src="/young-female-student-holding-cup-coffee-smartphone.jpg"
            alt="Young Female Student"
            className="w-full h-full object-cover"
          />
          {/* Elegant Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/70 via-gray-900/50 to-primary/60"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent"></div>
        </div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto w-full text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 sm:space-y-10"
          >


            {/* Main Heading */}
            <motion.div variants={itemVariants} className="space-y-4 sm:space-y-6">
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight px-2 sm:px-0">
                <span className="block font-semibold text-white">Best Academic Writing</span>
                <span className="block font-black bg-gradient-to-r from-blue-300 via-white to-blue-200 bg-clip-text text-transparent">
                  Expertise
                </span>
              </h1>
              
              <p className="text-base sm:text-lg lg:text-xl text-gray-200 leading-relaxed max-w-3xl mx-auto px-4 sm:px-0">
                Connect with PhD-level writers and AI-powered tools. Get expert assistance with essays, 
                research papers, dissertations, and more from verified academic professionals.
              </p>
            </motion.div>
            
            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-6 sm:pt-8 px-4 sm:px-0">
              <Link to="/writers" className="w-full sm:w-auto">
                <button className="group bg-white text-primary hover:bg-gray-100 px-6 py-2.5 rounded-full font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </Link>
              <Link to="/writers" className="w-full sm:w-auto">
                <button className="group border-2 border-white text-white hover:bg-white hover:text-primary px-6 py-2.5 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 flex items-center justify-center backdrop-blur-sm w-full sm:w-auto">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Chat Writers
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default NewHero;