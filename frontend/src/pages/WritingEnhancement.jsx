import React, { useEffect } from 'react';

const WritingEnhancement = () => {
  useEffect(() => {
    document.title = 'Writing Enhancement | ScribeAI';
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Write with Clarity, Confidence, and Impact</h1>
      <p className="mb-4">Polish your drafts into sharp, professional, and impactful writing—ready for academic or professional submission with ScribeAI’s Writing Enhancement Tool.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">What the Writing Enhancement Tool Does</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Improves Readability</li>
        <li>Strengthens Vocabulary</li>
        <li>Checks Tone & Style</li>
        <li>Removes Redundancy</li>
        <li>Boosts Flow</li>
      </ul>

      <p className="mb-6">Enhance your writing with Scribe AI.</p>
      <a className="text-primary underline" href="https://ai.thinqscribe.com" target="_blank" rel="noreferrer">Enhance Your Writing with Scribe AI</a>
    </div>
  );
};

export default WritingEnhancement;


