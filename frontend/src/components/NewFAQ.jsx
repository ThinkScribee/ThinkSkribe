import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const NewFAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "How does ThinqScribe ensure the quality of academic writing?",
      answer: "We maintain the highest quality standards through our rigorous writer vetting process. All our writers hold advanced degrees (Master's or PhD) from accredited institutions and undergo comprehensive background checks. Additionally, every piece of work goes through multiple quality assurance checks, including plagiarism detection, grammar verification, and academic standard compliance."
    },
    {
      question: "Is the content provided by ThinqScribe original and plagiarism-free?",
      answer: "Absolutely. Every piece of work is written from scratch by our expert writers and goes through advanced plagiarism detection software. We guarantee 100% original content and provide plagiarism reports with every delivery. Our writers are trained to properly cite all sources and maintain academic integrity standards."
    },
    {
      question: "What AI tools are included in my subscription?",
      answer: "Your subscription includes access to our comprehensive suite of AI tools: advanced grammar and style checker, citation generator for all major formats (APA, MLA, Chicago, Harvard), plagiarism detector, writing enhancement AI, structure analyzer, and research assistant. Premium plans also include advanced features like thesis support and custom templates."
    },
    {
      question: "How quickly can I get help with my academic writing?",
      answer: "Our response times vary by plan and urgency. For urgent requests, we can match you with a writer within 1-2 hours. Standard projects typically begin within 6-12 hours. Our AI tools are available 24/7 for immediate assistance. Premium subscribers get priority matching and faster response times."
    },
    {
      question: "Can I communicate directly with my assigned writer?",
      answer: "Yes! We provide a secure messaging platform where you can communicate directly with your assigned writer. You can share additional requirements, ask questions, request updates, and provide feedback throughout the writing process. This ensures your project meets your exact specifications."
    },
    {
      question: "What subjects and academic levels do you support?",
      answer: "We support all academic subjects and levels, from high school to PhD. Our writers specialize in diverse fields including STEM, humanities, business, social sciences, and more. Whether you need help with a simple essay or a complex dissertation, we have qualified experts in your field."
    },
    {
      question: "How does the revision process work?",
      answer: "We offer free revisions to ensure your complete satisfaction. Student plan includes up to 3 free revisions, while Premium plan offers unlimited revisions. Simply request changes through our platform, and your writer will make the necessary adjustments. Major revisions that change the original scope may require additional discussion."
    },
    {
      question: "Is my personal information and academic work kept confidential?",
      answer: "Your privacy and confidentiality are our top priorities. We use bank-level encryption to protect your data, never share your personal information with third parties, and all our writers sign strict confidentiality agreements. Your academic work remains completely private and secure."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <section className="py-12 lg:py-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 lg:mb-12"
        >
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extralight text-gray-900 mb-3">
              Got Questions?
              <span className="block bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                We Have Answers
              </span>
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Find answers to the most common questions about our academic writing services, 
              AI tools, and how ThinqScribe can help you achieve academic success.
            </p>
          </div>
        </motion.div>

        {/* FAQ Items */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-1"
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white border border-gray-200 hover:border-primary/30 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md"
              style={{ borderRadius: '15px' }}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 lg:px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors duration-200"
              >
                <h5 className="text-sm lg:text-base font-medium text-gray-900 pr-4">
                  {faq.question}
                </h5>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 ${
                  openIndex === index ? 'bg-primary text-white rotate-180' : 'text-primary'
                }`}>
                  {openIndex === index ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </div>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 lg:px-8 pb-6">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <div className="bg-gradient-to-r from-primary to-blue-600 p-8 lg:p-12 text-white" style={{ borderRadius: '15px' }}>
            <h3 className="text-2xl lg:text-3xl font-bold mb-4">
              Still Have Questions?
            </h3>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Our support team is available 24/7 to help you with any questions about our services, 
              pricing, or how to get started with ThinqScribe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact-support"
                className="bg-white text-primary px-6 py-2.5 rounded-full font-semibold hover:bg-gray-100 transition-colors duration-300 inline-flex items-center justify-center"
              >
                Contact Support
              </a>
              <a
                href="mailto:support@thinqscribe.com"
                className="border-2 border-white text-white px-6 py-2.5 rounded-full font-semibold hover:bg-white hover:text-primary transition-all duration-300 inline-flex items-center justify-center"
              >
                Email Us
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default NewFAQ;