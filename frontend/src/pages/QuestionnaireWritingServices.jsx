import React, { useEffect } from 'react';

const QuestionnaireWritingServices = () => {
  useEffect(() => {
    document.title = 'Questionnaire Writing Services | ThinqScribe';
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Professional Questionnaire Writing Services for University Students and Researchers</h1>
      <p className="mb-4">ThinqScribe specializes in developing high-quality, tailored questionnaires for students, researchers, businesses, and organizations. Our service is available 24/7.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Why Choose ThinqScribe for Questionnaire Writing?</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>We align with your research objectives and audience.</li>
        <li>We select the right question types.</li>
        <li>We organize for easy completion.</li>
        <li>We ensure academic or business alignment.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Types of Questionnaires We Create</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Surveys and survey responses</li>
        <li>Customer satisfaction</li>
        <li>Employee feedback</li>
        <li>Market research and opinion polls</li>
        <li>Academic research questionnaires</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">How We Work</h2>
      <ol className="list-decimal pl-6 space-y-2 mb-6">
        <li>Browse profiles of expert professional writers.</li>
        <li>Consultation and project brief.</li>
        <li>Questionnaire Design.</li>
        <li>Review & Refinement.</li>
        <li>Delivery.</li>
      </ol>

      <a className="text-primary underline" href="/writers">Hire experts for your questionnaire writing here NOW</a>
    </div>
  );
};

export default QuestionnaireWritingServices;


