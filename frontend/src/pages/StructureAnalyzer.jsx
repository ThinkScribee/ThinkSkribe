import React, { useEffect } from 'react';

const StructureAnalyzer = () => {
  useEffect(() => {
    document.title = 'Structure Analyzer | ScribeAI';
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Turn Chaos into Clarity</h1>
      <p className="mb-4">The ScribeAI Structure Analyzer helps you organize your essays, research papers, and reports into clear, logical frameworks.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">What the Structure Analyzer Does</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Analyzes Logical Flow</li>
        <li>Detects Gaps</li>
        <li>Suggests Headings & Subheadings</li>
        <li>Checks Paragraph Coherence</li>
        <li>Improves Overall Readability</li>
      </ul>

      <p className="mb-6">Analyze structure with Scribe AI.</p>
      <a className="text-primary underline" href="https://ai.thinqscribe.com" target="_blank" rel="noreferrer">Analyze Structure with Scribe AI</a>
    </div>
  );
};

export default StructureAnalyzer;


