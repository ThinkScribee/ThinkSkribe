import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "./ui/Accordion";
  import { Badge } from "./ui/Badge";
  import { Button } from "./ui/Button";
  import { MessageCircle } from "lucide-react";
  
  const FAQ = () => {
    const faqs = [
      {
        question: "How does ThinqScribe ensure academic integrity?",
        answer: "At ThinqScribe, we believe in helping students learn and produce original work. Our AI tools are designed to assist with idea generation, structuring, and improving clarity — not to encourage plagiarism. Every output is unique, and we encourage users to review, edit, and properly cite all sources. For custom writing services, our team follows strict zero-plagiarism policies and provides plagiarism reports when requested."
      },
      {
        question: "What qualifications do your writers have?",
        answer: "Our writers are carefully selected professionals with strong academic backgrounds. Many hold advanced degrees (Master's or PhD) in their respective fields and have years of experience in academic research, editing, and writing. They understand different academic styles (APA, MLA, Chicago, Harvard) and the standards required by Nigerian and international institutions."
      },
      {
        question: "How do your AI tools (ScribeAI) work?",
        answer: "Our AI-powered platform combines natural language processing with academic writing best practices. You can paste your text, upload prompts, or start from scratch, and the tool will help you: * Generate outlines * Improve sentence structure * Suggest citations * Summarize long texts. The AI learns from academic writing patterns, so you get outputs that are clear, relevant, and properly structured."
      },
      {
        question: "What if I'm not satisfied with the work?",
        answer: "Your satisfaction matters to us. If you're not happy with a custom-written project, you can request free revisions within the agreed revision period. For AI-generated work, you can regenerate, refine, or request human editing support until you get the result you need."
      },
      {
        question: "How quickly can you complete my project?",
        answer: "Turnaround depends on your project size and complexity. With ScribeAI: Instant results. Custom writing/editing: As fast as 24–48 hours for short projects, and longer timelines for dissertations or multi-chapter works. We'll always confirm your delivery date before starting."
      },
      {
        question: "Is my personal information secure?",
        answer: "Absolutely. We follow strict data privacy measures to ensure your details, documents, and project information are never shared without your consent. Our systems are encrypted, and we do not sell or trade user data."
      },
      {
        question: "Can I communicate directly with my assigned writer?",
        answer: "Yes. For custom writing services, you'll have a direct communication channel with your assigned writer or editor. This ensures clarity, faster feedback, and better project outcomes."
      },
      {
        question: "Do you handle all academic subjects?",
        answer: "Yes. Our team and AI tools cover a wide range of subjects — from sciences, engineering, and medicine to arts, social sciences, and business. Whether it's a lab report, research proposal, literature review, or case study, we can match you with the right expertise."
      }
    ];
  
    return (
      <section className="py-16 md:py-24 bg-gradient-section">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                FAQ
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
                Everything you need to know about ThinqScribe's academic writing services and AI tools.
              </p>
            </div>
  
            {/* FAQ Accordion */}
            <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-lg px-4 sm:px-6 py-2 hover:border-primary/50 transition-colors"
                >
                  <AccordionTrigger className="text-left text-card-foreground hover:text-primary text-sm sm:text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-primary leading-relaxed text-sm sm:text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
  
            {/* Contact CTA */}
            <div className="text-center mt-8 sm:mt-12 md:mt-16">
              <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-card-foreground mb-3 sm:mb-4">
                  Still have questions?
                </h3>
                <p className="text-muted-foreground mb-6 sm:mb-8 text-base sm:text-lg">
                  Our support team is available 24/7 to help you with any questions or concerns.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Button className="bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-elegant px-6 py-3 text-sm sm:text-base">
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Live Chat Support
                  </Button>
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-6 py-3 text-sm sm:text-base">
                    Email Support
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };
  
  export default FAQ;