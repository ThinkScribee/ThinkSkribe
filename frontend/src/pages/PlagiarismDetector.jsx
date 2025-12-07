import React, { useEffect } from 'react';

const PlagiarismDetector = () => {
  useEffect(() => {
    document.title = 'Plagiarism Detector | ScribeAI';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Free plagiarism detection tool to check your academic papers. Ensure originality and avoid plagiarism with our comprehensive checker.');
    }
    
    // Update Open Graph description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Free plagiarism detection tool to check your academic papers. Ensure originality and avoid plagiarism with our comprehensive checker.');
    }
    
    // Update Twitter description
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', 'Free plagiarism detection tool to check your academic papers. Ensure originality and avoid plagiarism with our comprehensive checker.');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Protect Your Academic Integrity</h1>
      <p className="mb-4">With ScribeAI’s Plagiarism Detector, you can check your essays, research papers, or dissertations for originality in seconds.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Why Use the Plagiarism Detector?</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Deep AI Scanning</li>
        <li>Real-Time Reports</li>
        <li>Safe & Secure</li>
        <li>Academic-Ready Output</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">How It Works</h2>
      <ol className="list-decimal pl-6 space-y-2 mb-6">
        <li>Upload your document.</li>
        <li>Scribe AI scans for matches.</li>
        <li>Receive a detailed originality report.</li>
      </ol>

      <p className="mb-6">Keep your academic work 100% original with ScribeAI’s Plagiarism Detector.</p>
      <a className="text-primary underline" href="https://ai.thinqscribe.com" target="_blank" rel="noreferrer">Try Scribe AI Plagiarism Detector</a>
    </div>
  );
};

export default PlagiarismDetector;


