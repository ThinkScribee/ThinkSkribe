import React, { useEffect } from 'react';

const DissertationWritingServices = () => {
  useEffect(() => {
    document.title = 'Dissertation Writing Services | ThinqScribe';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Comprehensive dissertation writing services from experienced academic writers. Get help with research, methodology, analysis, and writing for your doctoral dissertation.');
    }
    
    // Update Open Graph description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Comprehensive dissertation writing services from experienced academic writers. Get help with research, methodology, analysis, and writing for your doctoral dissertation.');
    }
    
    // Update Twitter description
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', 'Comprehensive dissertation writing services from experienced academic writers. Get help with research, methodology, analysis, and writing for your doctoral dissertation.');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Professional Dissertation Writing Services for Master’s and PhD Students</h1>
      <p className="mb-4">ThinqScribe is a platform that provides professional Dissertation Writing Services for students. Most of the work is done by graduate and postgraduate students, which are the most reliable writers.</p>
      <p className="mb-6">On ThinqScribe.com, you can browse the profiles of over 50 verified expert writers, chat with them and hire them for your dissertation writing services worldwide.</p>

      <p className="mb-6">Writing a dissertation is one of the most demanding parts of an academic journey. It requires months of research, planning, data analysis, and precise academic writing. For many students—especially those juggling coursework, jobs, or adjusting to English-language academic standards—the process can feel overwhelming.</p>
      <p className="mb-6">At ThinqScribe, we provide affordable, reliable, and professional dissertation writing services designed to ease this pressure. Our goal is simple: to help you produce a dissertation that is well-researched, original, and ready for submission.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Why Students Choose ThinqScribe for Dissertation Writing</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Expert dissertation writers – PhD holders, researchers, and experienced academic writers.</li>
        <li>Customized to your field – We match writers to your subject area.</li>
        <li>Proposal to completion – Support at every stage.</li>
        <li>Editing and formatting – APA, MLA, Harvard, Chicago, etc.</li>
        <li>Confidential and plagiarism-free – Original work only.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Our Dissertation Writing Services</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Dissertation proposal writing and editing</li>
        <li>Full dissertation writing (all chapters)</li>
        <li>Literature review development</li>
        <li>Methodology and data analysis support (SPSS, Stata, R, NVivo)</li>
        <li>Proofreading and editing</li>
        <li>Formatting and citation management</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Who Needs Dissertation Writing Help?</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Master’s students</li>
        <li>PhD candidates</li>
        <li>International students</li>
        <li>Busy professionals</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Benefits of Professional Dissertation Writing</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Save valuable time and reduce stress</li>
        <li>Improve chances of top grades</li>
        <li>Gain clarity in research design and argumentation</li>
        <li>Learn better academic writing skills</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Affordable Dissertation Services for Students</h2>
      <p className="mb-6">ThinqScribe offers affordable packages, flexible payment options, and student-friendly discounts.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Get Started Today</h2>
      <p className="mb-2">With ThinqScribe’s Dissertation Writing Services, you can get expert help from start to finish—whether you need a proposal written, data analyzed, or your entire dissertation polished for submission.</p>
      <a className="text-primary underline" href="/writers">Hire a professional Dissertation Writer here NOW</a>
    </div>
  );
};

export default DissertationWritingServices;


