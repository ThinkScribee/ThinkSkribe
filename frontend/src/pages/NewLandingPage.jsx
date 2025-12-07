import { useEffect } from "react";
import NewHeader from "../components/NewHeader";
import NewHero from "../components/NewHero";
import NewServices from "../components/NewServices";
import NewAITools from "../components/NewAITools";
import NewFAQ from "../components/NewFAQ";
import { motion } from "framer-motion";

const NewLandingPage = () => {
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

  return (
    <div className="min-h-screen bg-white">
      <NewHeader />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <NewHero />
      </motion.div>

      <motion.div
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
      >
        <NewServices />
      </motion.div>

      <motion.div
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
      >
        <NewAITools />
      </motion.div>

      <motion.div
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
      >
        <NewFAQ />
      </motion.div>
    </div>
  );
};

export default NewLandingPage;