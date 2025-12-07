import React, { useEffect } from 'react';

const EssayWritingServices = () => {
  useEffect(() => {
    document.title = 'Essay Writing Services | ThinqScribe';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get expert essay writing help from qualified academic writers. Custom essays, research papers, and academic writing assistance with guaranteed quality and timely delivery.');
    }
    
    // Update Open Graph description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Get expert essay writing help from qualified academic writers. Custom essays, research papers, and academic writing assistance with guaranteed quality and timely delivery.');
    }
    
    // Update Twitter description
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', 'Get expert essay writing help from qualified academic writers. Custom essays, research papers, and academic writing assistance with guaranteed quality and timely delivery.');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Reliable and Affordable Essay Writing Services</h1>
      <p className="mb-4">Essays are foundational to academic success. Whether you need argumentative, expository, analytical, or reflective essays, ThinqScribe connects you with expert academic writers who deliver original, well-structured work on time.</p>
      <p className="mb-6">Browse verified writer profiles, chat with them, and hire the best fit for your subject and level. Every essay is plagiarism-free and formatted to your required style (APA, MLA, Chicago, Harvard, etc.).</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Why Choose ThinqScribe for Essay Writing?</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Experienced academic writers across disciplines</li>
        <li>100% original essays written from scratch</li>
        <li>Affordable, student-friendly pricing</li>
        <li>Fast turnaround without sacrificing quality</li>
        <li>Editing and proofreading included</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Types of Essays We Handle</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Argumentative and persuasive essays</li>
        <li>Expository and analytical essays</li>
        <li>Compare-and-contrast essays</li>
        <li>Reflective and narrative essays</li>
        <li>Admission and scholarship essays</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Get Started</h2>
      <p className="mb-2">Work with a professional essay writer and submit with confidence.</p>
      <a className="text-primary underline" href="/writers">Hire an Essay Writer now</a>
    </div>
  );
};

export default EssayWritingServices;


