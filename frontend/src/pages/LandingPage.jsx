import React, { useEffect } from "react";
import HeaderComponent from "../components/HeaderComponent"
import Hero from "../components/HeroSection";
import Services from "../components/Services";
import AITools from "../components/AITool";
import Testimonials from "../components/Testimonials";
import Pricing from "../components/Pricing";
import FAQ from "../components/FAQ";
import CTA from "../components/CTA";
// Footer is rendered globally in App.jsx
import {TooltipProvider} from "../components/ui/tooltip"
import { motion } from "framer-motion";

const ThniqScribeLanding = () => {
  useEffect(() => {
    document.title = 'ThinqScribe - Expert Academic Writing & AI Tools | Hire Freelance Writers';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'ThinqScribe empowers students globally with smart AI academic writing tools and access to professional writers & editors. Hire expert writers to complete your essays, dissertations, and research.');
    }
    
    // Update Open Graph description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Connect with expert freelance academic writers and AI tools. Get professional help with essays, dissertations, and research papers from verified writers.');
    }
    
    // Update Twitter description
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', 'Connect with expert freelance academic writers and AI tools. Get professional help with essays, dissertations, and research papers from verified writers.');
    }
  }, []);
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TooltipProvider>
        <HeaderComponent />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Hero />
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Services />
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
        >
          <AITools />
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Testimonials />
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Pricing />
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
        >
          <FAQ />
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
        >
          <CTA />
        </motion.div>

        {/* Footer removed; now rendered globally in App.jsx */}
      </TooltipProvider>
    </div>
  );
};

export default ThniqScribeLanding;
