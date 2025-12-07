import { Button } from "./ui/Button"
import { Badge } from "./ui/Badge";
import { Star, Users, CheckCircle, ArrowRight, BookOpen, Sparkles, Clock, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen bg-gradient-hero pt-2 md:pt-4 overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/5 rounded-full blur-2xl animate-bounce" />
      
      {/* Floating particles */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-primary/30 rounded-full animate-ping" />
      <div className="absolute top-40 right-32 w-1 h-1 bg-accent/40 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-primary/25 rounded-full animate-ping" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[70vh] py-4 md:py-8">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm border border-primary/20 rounded-full shadow-lg">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-accent fill-accent animate-pulse" />
                <span className="text-sm font-bold text-primary">Trusted by Thousands of Students</span>
              </div>
              <div className="h-4 w-px bg-primary/30"></div>
              <div className="flex items-center gap-1">
                <div className="flex -space-x-1">
                  <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-full border-2 border-background"></div>
                  <div className="w-6 h-6 bg-gradient-to-r from-accent to-primary rounded-full border-2 border-background"></div>
                  <div className="w-6 h-6 bg-gradient-to-r from-primary-light to-accent rounded-full border-2 border-background"></div>
                </div>
                <span className="text-xs font-semibold text-muted-foreground ml-2">Global Community</span>
              </div>
            </div>

            {/* Enhanced Main Heading */}
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-3 md:space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-black text-foreground leading-[0.9] tracking-tight">
                  <span className="block animate-fade-in-up">Transform Your</span>
                  <span className="block bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    Academic Journey
                  </span>
                  <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-foreground/90 mt-2 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    with Expert Writers
                  </span>
                </h1>
                
                <div className="flex items-center gap-3 pt-2 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                  <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-primary uppercase tracking-wider">Premium Quality</span>
                </div>
              </div>
              
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-4xl font-normal animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                Join thousands of successful students who trust ThinqScribe for their academic success. 
                <span className="font-semibold text-foreground"> Get matched with PhD-level writers</span> and 
                <span className="font-semibold text-foreground"> cutting-edge AI tools</span> that help you 
                write, research, and excel in your studies.
              </p>
              
              {/* Enhanced CTA with better styling */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 sm:pt-6">
                <Link to="/signup">
                  <Button 
                    size="lg" 
                    className="group bg-gradient-to-r from-primary via-primary-light to-accent hover:from-primary-dark hover:to-primary text-primary-foreground shadow-2xl hover:shadow-glow transition-all duration-500 px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-bold w-full sm:w-auto transform hover:scale-105 hover:-translate-y-1 border-0"
                  >
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 group-hover:animate-spin" />
                    Start Your Success Story
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="group border-2 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-semibold w-full sm:w-auto transform hover:scale-105 hover:-translate-y-1 transition-all duration-500 backdrop-blur-sm bg-card/20"
                  >
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 group-hover:animate-pulse" />
                    Try AI Assistant Free
                  </Button>
                </Link>
              </div>
            </div>

            {/* Enhanced Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-6 sm:pt-8">
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-card/50 backdrop-blur-sm border border-border rounded-xl hover:bg-card/80 transition-all duration-300">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-accent fill-accent" />
                </div>
                <div>
                  <div className="text-foreground font-bold text-base sm:text-lg">4.9★</div>
                  <div className="text-muted-foreground text-xs sm:text-sm">Excellence Rating</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-card/50 backdrop-blur-sm border border-border rounded-xl hover:bg-card/80 transition-all duration-300">
                <div className="p-2 bg-success/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
                </div>
                <div>
                  <div className="text-foreground font-bold text-base sm:text-lg">98%</div>
                  <div className="text-muted-foreground text-xs sm:text-sm">Success Stories</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-card/50 backdrop-blur-sm border border-border rounded-xl hover:bg-card/80 transition-all duration-300">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <div className="text-foreground font-bold text-base sm:text-lg">100%</div>
                  <div className="text-muted-foreground text-xs sm:text-sm">Secure & Private</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Right Content - Hero Image */}
          <div className="relative mt-8 lg:mt-0">
            <div className="relative bg-gradient-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-elegant border border-border transform hover:scale-105 transition-all duration-500">
              <img 
                src="./hero-illustration.jpg" 
                alt="ThinkScribe Dashboard Preview" 
                className="w-full h-auto rounded-xl sm:rounded-2xl shadow-subtle"
              />
              
              {/* Enhanced Floating Stats Cards - Hidden on mobile for cleaner look */}
              <div className="hidden sm:block absolute -top-3 sm:-top-6 -right-3 sm:-right-6 bg-card/95 backdrop-blur-sm border border-border rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-elegant hover:shadow-glow transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-success rounded-full animate-pulse"></div>
                  <span className="text-card-foreground font-bold text-xs sm:text-sm">Expert Writers</span>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary mt-1 sm:mt-2">4950+</div>
                <div className="text-xs text-muted-foreground">Projects Completed</div>
              </div>

              <div className="hidden sm:block absolute -bottom-3 sm:-bottom-6 -left-3 sm:-left-6 bg-card/95 backdrop-blur-sm border border-border rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-elegant hover:shadow-glow transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-accent rounded-full animate-pulse"></div>
                  <span className="text-card-foreground font-bold text-xs sm:text-sm">Active Writers</span>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-accent mt-1 sm:mt-2">320+</div>
                <div className="text-xs text-muted-foreground">Ready to Help</div>
              </div>

              <div className="hidden sm:block absolute top-1/2 -left-3 sm:-left-6 bg-primary/90 backdrop-blur-sm border border-primary/20 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-glow">
                <div className="flex items-center gap-1 sm:gap-2 text-primary-foreground">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-accent rounded-full animate-pulse"></div>
                  <span className="font-semibold text-xs sm:text-sm">AI Powered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* TODO: Convert testimonials, services, and AI tools sections to carousels on mobile view. */}
    </section>
  );
};

export default Hero;