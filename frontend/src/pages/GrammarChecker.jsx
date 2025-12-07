import React, { useEffect } from 'react';

const GrammarChecker = () => {
  useEffect(() => {
    document.title = 'Grammar Checker | ScribeAI';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Free AI-powered grammar checker to improve your writing. Check grammar, spelling, punctuation, and style with our advanced writing tool.');
    }
    
    // Update Open Graph description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Free AI-powered grammar checker to improve your writing. Check grammar, spelling, punctuation, and style with our advanced writing tool.');
    }
    
    // Update Twitter description
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', 'Free AI-powered grammar checker to improve your writing. Check grammar, spelling, punctuation, and style with our advanced writing tool.');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Eliminate Grammar Errors Instantly with Scribe AI</h1>
      <p className="mb-4">Strong ideas deserve clear and error-free writing. With ThinqScribe’s AI Grammar Checker, ScribeAI, you can polish your essays, research papers, and dissertations to meet academic standards. Our tool doesn’t just fix typos — it improves clarity, flow, and correctness.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Why Use the AI Grammar Checker?</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Instant Grammar Fixes</li>
        <li>Context-Aware Suggestions</li>
        <li>Style & Clarity Enhancer</li>
        <li>Academic-Ready</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Who Can Benefit?</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Students writing essays, term papers, or projects</li>
        <li>Researchers submitting journal articles</li>
        <li>Graduate scholars polishing theses and dissertations</li>
        <li>International students needing language support</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">How It Works</h2>
      <ol className="list-decimal pl-6 space-y-2 mb-6">
        <li>Paste or upload your text into the tool.</li>
        <li>Scribe AI scans for grammar, style, and clarity issues.</li>
        <li>Review smart suggestions tailored for academic tone.</li>
        <li>Export polished writing instantly.</li>
      </ol>

      <p className="mb-6">Experience smarter academic editing with ScribeAI Grammar Checker.</p>
      <a className="text-primary underline" href="https://ai.thinqscribe.com" target="_blank" rel="noreferrer">Try Grammar Checker by Scribe AI</a>
    </div>
  );
};

export default GrammarChecker;


