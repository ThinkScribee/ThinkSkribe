import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, User, GraduationCap } from 'lucide-react';

const NewTestimonials = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "PhD Student, Harvard University",
      content: "ThinqScribe transformed my dissertation writing process. The AI tools helped me structure my research perfectly, and the expert writers provided invaluable feedback. I couldn't have completed my PhD without this platform.",
      rating: 5,
      avatar: "SJ",
      subject: "Psychology"
    },
    {
      name: "Michael Chen",
      role: "Master's Student, MIT",
      content: "The quality of writers on ThinqScribe is exceptional. My assigned writer had a PhD in Computer Science and understood my research perfectly. The plagiarism checker gave me confidence in my work's originality.",
      rating: 5,
      avatar: "MC",
      subject: "Computer Science"
    },
    {
      name: "Emily Rodriguez",
      role: "Undergraduate, Stanford",
      content: "As an international student, I struggled with academic writing in English. ThinqScribe's grammar checker and writing enhancement tools improved my essays dramatically. My grades went from B's to A's!",
      rating: 5,
      avatar: "ER",
      subject: "Business Administration"
    },
    {
      name: "David Thompson",
      role: "Graduate Student, Oxford",
      content: "The citation generator saved me countless hours of formatting references. The AI tools are incredibly accurate, and the 24/7 support team is always helpful. This platform is a game-changer for academic success.",
      rating: 5,
      avatar: "DT",
      subject: "History"
    },
    {
      name: "Lisa Wang",
      role: "PhD Candidate, Cambridge",
      content: "I was skeptical about using AI for academic work, but ThinqScribe's tools are designed specifically for scholarly writing. The structure analyzer helped me organize my thesis chapters logically and professionally.",
      rating: 5,
      avatar: "LW",
      subject: "Biology"
    },
    {
      name: "James Miller",
      role: "Master's Student, Yale",
      content: "The expert writer matching system is brilliant. I was paired with a writer who specialized in my exact field of study. The collaboration was seamless, and the final paper exceeded my expectations completely.",
      rating: 5,
      avatar: "JM",
      subject: "Economics"
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
    <section className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
            <Quote className="w-4 h-4" />
            Student Success Stories
          </div>
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black text-gray-900 mb-6">
            Trusted by Students at<br />
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Top Universities
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Join thousands of successful students from Harvard, MIT, Stanford, Oxford, and other prestigious 
            institutions who trust ThinqScribe for their academic excellence.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200 hover:border-primary/30 group hover:scale-105"
            >
              {/* Rating */}
              <div className="flex items-center gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>

              {/* Quote */}
              <div className="relative mb-6">
                <Quote className="absolute -top-2 -left-2 w-8 h-8 text-primary/20" />
                <p className="text-gray-700 leading-relaxed pl-6">
                  "{testimonial.content}"
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <GraduationCap className="w-3 h-3 text-primary" />
                    <span className="text-xs text-primary font-medium">{testimonial.subject}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-r from-primary to-blue-600 rounded-3xl p-8 lg:p-12 text-white"
        >
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl lg:text-5xl font-black mb-2">50K+</div>
              <div className="text-blue-100 font-medium">Happy Students</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-black mb-2">4.9★</div>
              <div className="text-blue-100 font-medium">Average Rating</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-black mb-2">98%</div>
              <div className="text-blue-100 font-medium">Success Rate</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-black mb-2">24/7</div>
              <div className="text-blue-100 font-medium">Support Available</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default NewTestimonials;