import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Users, Star, CheckCircle } from 'lucide-react';

const NewCTA = () => {
  const stats = [
    { icon: <Users className="w-6 h-6" />, value: "50,000+", label: "Students Helped" },
    { icon: <Star className="w-6 h-6" />, value: "4.9/5", label: "Average Rating" },
    { icon: <CheckCircle className="w-6 h-6" />, value: "98%", label: "Success Rate" }
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
    <section className="py-20 lg:py-32 bg-gradient-to-br from-primary via-blue-600 to-purple-700 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Main CTA Content */}
          <motion.div variants={itemVariants} className="mb-16">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-sm font-semibold mb-8 text-white">
              <Sparkles className="w-4 h-4" />
              Ready to Transform Your Academic Journey?
            </div>
            
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-8 leading-tight">
              Join Thousands of Successful<br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Students Today
              </span>
            </h2>
            
            <p className="text-xl lg:text-2xl text-blue-100 max-w-4xl mx-auto mb-12 leading-relaxed">
              Start your journey to academic excellence with expert writers, cutting-edge AI tools, 
              and a community that's committed to your success. No credit card required to get started.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group bg-white text-primary px-10 py-5 rounded-full font-bold text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto"
                >
                  <Sparkles className="w-6 h-6 group-hover:animate-spin" />
                  Start Free Today
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                </motion.button>
              </Link>
              
              <Link to="/about">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group border-2 border-white text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-white hover:text-primary transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto"
                >
                  <Users className="w-6 h-6 group-hover:animate-pulse" />
                  Learn More
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={containerVariants}
            className="grid md:grid-cols-3 gap-8 mb-16"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl lg:text-4xl font-black text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-blue-100 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust Indicators */}
          <motion.div variants={itemVariants} className="text-center">
            <p className="text-blue-100 mb-6 text-lg">
              Trusted by students from top universities worldwide
            </p>
            <div className="flex flex-wrap justify-center gap-8 opacity-70">
              <div className="text-white font-semibold">Harvard</div>
              <div className="text-white font-semibold">MIT</div>
              <div className="text-white font-semibold">Stanford</div>
              <div className="text-white font-semibold">Oxford</div>
              <div className="text-white font-semibold">Cambridge</div>
              <div className="text-white font-semibold">Yale</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default NewCTA;