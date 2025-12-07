import React, { useEffect } from 'react';

const CitationGenerator = () => {
  useEffect(() => {
    document.title = 'Citation Generator | ScribeAI';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Generate accurate citations in APA, MLA, Chicago, and other formats. Free citation generator for academic papers and research.');
    }
    
    // Update Open Graph description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Generate accurate citations in APA, MLA, Chicago, and other formats. Free citation generator for academic papers and research.');
    }
    
    // Update Twitter description
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', 'Generate accurate citations in APA, MLA, Chicago, and other formats. Free citation generator for academic papers and research.');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Say Goodbye to Referencing Stress</h1>
      <p className="mb-4">Struggling with APA, MLA, Chicago, or Harvard style? With ScribeAI’s Citation Generator, you can create flawless references in seconds — without the stress.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Why Use the Citation Generator?</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Supports Multiple Styles</li>
        <li>Error-Free Referencing</li>
        <li>Fast & Reliable</li>
        <li>Academic-Ready Output</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">How It Works</h2>
      <ol className="list-decimal pl-6 space-y-2 mb-6">
        <li>Enter your book, journal, or website details.</li>
        <li>Scribe AI formats them correctly.</li>
        <li>Copy and paste into your references list.</li>
      </ol>

      <p className="mb-6">Write confidently, cite correctly, and achieve academic success with ScribeAI Citation Generator.</p>
      <a className="text-primary underline" href="https://ai.thinqscribe.com" target="_blank" rel="noreferrer">Try Citation Generator by Scribe AI</a>
    </div>
  );
};

export default CitationGenerator;


