import React, { useEffect } from 'react';

const TermPaperWritingServices = () => {
  useEffect(() => {
    document.title = 'Term Paper Writing Services | ThinqScribe';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Professional term paper writing services with thorough research and proper academic formatting. Get expert help for your academic term papers.');
    }
    
    // Update Open Graph description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Professional term paper writing services with thorough research and proper academic formatting. Get expert help for your academic term papers.');
    }
    
    // Update Twitter description
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', 'Professional term paper writing services with thorough research and proper academic formatting. Get expert help for your academic term papers.');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Reliable and Affordable Term Paper Help for Students</h1>
      <p className="mb-4">Writing a term paper requires in-depth research, critical thinking, and academic writing skills—all within a tight deadline. We provide professional term paper writing services that help you submit original, well-structured, and academically sound papers on time.</p>
      <p className="mb-6">On ThinqScribe.com, you can browse profiles of over 50 verified expert writers, chat with them and hire them for your term paper writing services worldwide.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Why Choose ThinqScribe for Your Term Paper</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Experienced writers in diverse disciplines</li>
        <li>100% plagiarism-free, custom-written papers</li>
        <li>Affordable pricing and on-time delivery</li>
        <li>Confidentiality and secure transactions</li>
        <li>Support across all academic levels</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Our Term Paper Writing Services</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Custom-written term papers</li>
        <li>Editing, proofreading, and formatting</li>
        <li>Research support for data collection and analysis</li>
        <li>Topic selection and structuring guidance</li>
        <li>Citation and referencing in APA, MLA, Harvard, Chicago</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Get Your Term Paper Done Today</h2>
      <p className="mb-2">Access professional support that ensures your work is original, well-researched, and delivered on time.</p>
      <a className="text-primary underline" href="/writers">Hire a professional Term Paper Writer here NOW</a>
    </div>
  );
};

export default TermPaperWritingServices;


