import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Twitter, 
  Linkedin, 
  Facebook,
  BookOpen,
  Users,
  Brain,
  Shield
} from "lucide-react";

const FooterComponent = () => {
  return (
    <footer className="bg-gradient-hero border-t border-border">
      <div className="container mx-auto px-4 lg:px-6">
        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center space-x-2">
                <img 
                  src="/App-Icon-Light.png" 
                  alt="ThinqScribe Icon" 
                  className="w-8 h-8 object-contain"
                />
                <span className="text-2xl font-bold text-foreground">ThinqScribe</span>
              </div>
              
              <p className="text-muted-foreground text-sm leading-tight">
                Empowering academic excellence through expert writing assistance and cutting-edge AI tools. Join thousands of students who trust ThinqScribe with their academic success.
              </p>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Shield className="w-3 h-3 mr-1" />
                  SSL Secured
                </Badge>
                <Badge className="bg-success/10 text-success border-success/20">
                  <Users className="w-3 h-3 mr-1" />
                  50K+ Students
                </Badge>
                <Badge className="bg-accent/10 text-accent border-accent/20">
                  <Brain className="w-3 h-3 mr-1" />
                  AI Powered
                </Badge>
              </div>

              {/* Contact Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary text-sm">Social:</span>
                  <span className="text-muted-foreground text-sm">@usethinqscribe</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary text-sm">Email:</span>
                  <span className="text-muted-foreground text-sm">officialthinqscribe@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary text-sm">Call:</span>
                  <span className="text-muted-foreground text-sm">+2349095368912, +2348111161612</span>
                </div>
              </div>
            </div>

            {/* Column 1: Writing Services */}
            <div>
              <h3 className="text-base font-bold text-foreground mb-3">Writing Services</h3>
              <ul className="space-y-1">
                <li>
                  <a href="/essay-writing-services" className="text-muted-foreground hover:text-primary transition-colors text-sm">Essay Writing</a>
                </li>
                <li>
                  <a href="/thesis-writing-services" className="text-muted-foreground hover:text-primary transition-colors text-sm">Thesis Writing</a>
                </li>
                <li>
                  <a href="/dissertation-writing-services" className="text-muted-foreground hover:text-primary transition-colors text-sm">Dissertation Writing</a>
                </li>
                <li>
                  <a href="/research-paper-writing-services" className="text-muted-foreground hover:text-primary transition-colors text-sm">Research Paper Writing</a>
                </li>
                <li>
                  <a href="/term-paper-writing-services" className="text-muted-foreground hover:text-primary transition-colors text-sm">Term Paper Writing</a>
                </li>
                <li>
                  <a href="/seminar-writing-services" className="text-muted-foreground hover:text-primary transition-colors text-sm">Seminar Writing</a>
                </li>
                <li>
                  <a href="/article-critique-writing-services" className="text-muted-foreground hover:text-primary transition-colors text-sm">Article-Critique Writing Services</a>
                </li>
                <li>
                  <a href="/questionnaire-writing-services" className="text-muted-foreground hover:text-primary transition-colors text-sm">Questionnaire Writing</a>
                </li>
              </ul>
            </div>

            {/* Column 2: AI Writing Tools */}
            <div>
              <h3 className="text-base font-bold text-foreground mb-3">AI Writing Tools</h3>
              <ul className="space-y-1">
                <li>
                  <a href="https://ai.thinqscribe.com" className="text-muted-foreground hover:text-primary transition-colors text-sm">Research Assistant</a>
                </li>
                <li>
                  <a href="/grammar-checker" className="text-muted-foreground hover:text-primary transition-colors text-sm">Grammar Checker</a>
                </li>
                <li>
                  <a href="/citation-generator" className="text-muted-foreground hover:text-primary transition-colors text-sm">Citation Generator</a>
                </li>
                <li>
                  <a href="/plagiarism-detector" className="text-muted-foreground hover:text-primary transition-colors text-sm">Plagiarism Detector</a>
                </li>
                <li>
                  <a href="/writing-enhancement" className="text-muted-foreground hover:text-primary transition-colors text-sm">Writing Enhancement</a>
                </li>
                <li>
                  <a href="/structure-analyzer" className="text-muted-foreground hover:text-primary transition-colors text-sm">Structure Analyzer</a>
                </li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div>
              <h3 className="text-base font-bold text-foreground mb-3">Company</h3>
              <ul className="space-y-1">
                <li>
                  <a href="/about-us" className="text-muted-foreground hover:text-primary transition-colors text-sm">About Us</a>
                </li>
                <li>
                  <a href="/our-writers" className="text-muted-foreground hover:text-primary transition-colors text-sm">Our Writers</a>
                </li>
                <li>
                  <a href="/quality-promise" className="text-muted-foreground hover:text-primary transition-colors text-sm">Quality Promise</a>
                </li>
                <li>
                  <a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors text-sm">Privacy Policy</a>
                </li>
                <li>
                  <a href="/terms" className="text-muted-foreground hover:text-primary transition-colors text-sm">Terms of Service</a>
                </li>
                <li>
                  <a href="/contact-support" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contact Support</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="py-6 border-t border-border">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="text-muted-foreground text-sm">
              © 2025 ThinqScribe. All rights reserved. Empowering academic excellence worldwide.
            </div>
            
            <div className="flex items-center gap-6">
              <span className="text-muted-foreground text-sm">Follow us:</span>
              <div className="flex gap-4">
                <a 
                  href="https://twitter.com/usethinqscribe" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a 
                  href="https://linkedin.com/company/usethinqscribe" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a 
                  href="https://facebook.com/usethinqscribe" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterComponent;