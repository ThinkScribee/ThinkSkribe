import React, { useEffect } from 'react';

const ResearchPaperWritingServices = () => {
  useEffect(() => {
    document.title = 'Research Paper Writing Services | ThinqScribe';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Professional research paper writing services with proper citations and methodology. Get expert help with academic research and scholarly writing.');
    }
    
    // Update Open Graph description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Professional research paper writing services with proper citations and methodology. Get expert help with academic research and scholarly writing.');
    }
    
    // Update Twitter description
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', 'Professional research paper writing services with proper citations and methodology. Get expert help with academic research and scholarly writing.');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Professional Research Paper Help for University Students and Researchers</h1>
      <p className="mb-4">Writing a research paper is one of the most challenging tasks in academic life. It requires careful topic selection, extensive research, critical analysis, and clear presentation of findings.</p>
      <p className="mb-6">At ThinqScribe, we provide expert research paper writing services to help you submit well-structured, original, and academically sound papers that meet international standards.</p>
      <p className="mb-6">On ThinqScribe.com, you can browse profiles of over 50 verified expert writers, chat with them and hire them for your research paper writing services worldwide.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Why Choose ThinqScribe’s Research Paper Writing Services</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Experienced academic writers with advanced degrees</li>
        <li>100% original, plagiarism-free papers</li>
        <li>Proper formatting in APA, MLA, Harvard, Chicago</li>
        <li>Support across all disciplines</li>
        <li>Affordable packages and timely delivery</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Our Research Paper Writing Services</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Research topic selection and proposal drafting</li>
        <li>Literature review development</li>
        <li>Methodology design and data analysis support</li>
        <li>Full-length research writing</li>
        <li>Editing, proofreading, and formatting</li>
        <li>Journal submission or conference paper support</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Who We Help</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Undergraduate and postgraduate students</li>
        <li>PhD candidates working on publishable articles</li>
        <li>International students</li>
        <li>Professionals and independent researchers</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Get Research Paper Help Today</h2>
      <p className="mb-2">Get professional support that ensures your work is clear, original, and academically sound.</p>
      <a className="text-primary underline" href="/writers">Hire a professional Research Paper Writer here NOW</a>
    </div>
  );
};

export default ResearchPaperWritingServices;


