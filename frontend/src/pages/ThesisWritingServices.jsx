import React, { useEffect } from 'react';

const ThesisWritingServices = () => {
  useEffect(() => {
    document.title = 'Thesis Writing Services | ThinqScribe';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Expert thesis writing services from PhD-level writers. Get comprehensive thesis help with research, writing, and formatting for your academic success.');
    }
    
    // Update Open Graph description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Expert thesis writing services from PhD-level writers. Get comprehensive thesis help with research, writing, and formatting for your academic success.');
    }
    
    // Update Twitter description
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', 'Expert thesis writing services from PhD-level writers. Get comprehensive thesis help with research, writing, and formatting for your academic success.');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Professional Thesis Writing Services for Students Worldwide</h1>
      <p className="mb-4">ThinqScribe is a platform that provides professional thesis writing services for students worldwide. Most of the work is done by graduate and postgraduate students, which are the most reliable writers.</p>
      <p className="mb-4">On ThinqScribe.com, you can browse the profiles of over 50 verified expert writers, chat with them and hire them for your Thesis writing services worldwide.</p>
      <p className="mb-6">At ThinqScribe, we understand how challenging thesis writing can be. From choosing a topic to structuring your chapters, conducting research, and meeting strict formatting guidelines, the process can feel overwhelming—especially if English is not your first language. That’s why we’ve built a platform that provides affordable, professional, and reliable thesis writing services to help you succeed.</p>
      <p className="mb-6">Our team is made up of graduate-level researchers, postgraduate students, and PhD experts who have years of experience in academic writing across multiple disciplines. Whether you need a complete thesis, dissertation editing, proposal writing, or formatting support, ThinqScribe ensures your work meets the highest academic standards.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Why Choose ThinqScribe for Thesis Writing?</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Experienced Thesis Writers – Subject-matter experts with advanced degrees.</li>
        <li>Custom Thesis Writing – Tailored and 100% plagiarism-free.</li>
        <li>Affordable & Flexible Plans – Student-friendly pricing and packages.</li>
        <li>Fast Turnaround – Deadlines met without compromising quality.</li>
        <li>Editing & Proofreading – Polished to match institutional requirements.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Our Thesis Writing Services Include:</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Thesis Proposal Writing & Editing</li>
        <li>Full Thesis & Dissertation Writing</li>
        <li>Data Analysis & Interpretation Support</li>
        <li>Editing, Proofreading & Formatting (APA, MLA, Chicago, Harvard, etc.)</li>
        <li>Research Guidance & Literature Review Assistance</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Who Can Benefit from Our Services?</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Undergraduate students preparing their final projects.</li>
        <li>Master’s students working on dissertations.</li>
        <li>PhD candidates needing structured guidance and professional editing.</li>
        <li>International students adapting to English-language academic writing standards.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Why Students Trust ThinqScribe</h2>
      <p className="mb-6">Unlike traditional thesis writing platforms, ThinqScribe combines AI-powered writing assistance with real human expertise. This unique approach means you not only get well-written content, but you also learn how to improve your academic writing skills. We don’t just write—we teach, guide, and support you.</p>
      <p className="mb-6">With 24/7 support, transparent pricing, and a commitment to quality, ThinqScribe has quickly become a trusted academic partner for students across Africa, Asia, the Middle East, and Eastern Europe.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Get Started Today</h2>
      <p className="mb-2">Don’t let thesis writing hold you back from earning your degree. With ThinqScribe’s Thesis Writing Services, you’ll receive the professional support you need to produce a thesis that’s well-researched, properly formatted, and academically sound.</p>
      <a className="text-primary underline" href="/writers">Hire a professional Thesis Writer here</a>
    </div>
  );
};

export default ThesisWritingServices;


