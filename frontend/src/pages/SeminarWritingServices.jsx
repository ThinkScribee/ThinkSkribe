import React, { useEffect } from 'react';

const SeminarWritingServices = () => {
  useEffect(() => {
    document.title = 'Seminar Writing Services | ThinqScribe';
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Reliable and Affordable Seminar Writing Help for Students</h1>
      <p className="mb-4">Seminars are a cornerstone of academic life, but writing a seminar paper can often feel overwhelming—requiring extensive research, careful structuring, and flawless presentation. That’s where our seminar writing services step in.</p>
      <p className="mb-6">On ThinqScribe.com, you can browse the profiles of over 50 verified expert writers, chat with them and hire them for your seminar writing services worldwide.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">What We Offer</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Custom Seminar Papers</li>
        <li>Editing & Proofreading</li>
        <li>Formatting & Referencing</li>
        <li>Specialized Writers</li>
        <li>Free Revisions</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Why Choose Us?</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Expert Academic Writers</li>
        <li>Stress-Free Process</li>
        <li>On-Time Delivery</li>
        <li>Affordable Rates</li>
        <li>24/7 Support</li>
      </ul>

      <p className="mb-2">Whether you need a paper written from scratch or want your draft transformed into a professional submission, our seminar writing services ensure your work is engaging and academically solid.</p>
      <a className="text-primary underline" href="/writers">Hire experts for your seminar writing here NOW</a>
    </div>
  );
};

export default SeminarWritingServices;


