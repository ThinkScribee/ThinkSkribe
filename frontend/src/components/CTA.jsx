import { Button } from "./ui/Button";
import { Card, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { 
  ArrowRight, 
  BookOpen, 
  Users, 
  Clock, 
  Shield,
  Sparkles,
  Target
} from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  const benefits = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Expert Guidance",
      description: "PhD-level writers in every field"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI-Powered Tools",
      description: "Advanced research and writing assistance"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "24/7 Support",
      description: "Always available when you need help"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Quality Guarantee",
      description: "100% satisfaction or money back"
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-primary relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-light/20 via-transparent to-primary-dark/20" />
      <div className="absolute top-1/4 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-48 md:w-64 h-48 md:h-64 bg-white/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Main CTA Content */}
          <div className="text-center mb-12 md:mb-16">
            <Badge className="mb-6 bg-white/10 text-white border-white/20 backdrop-blur-sm">
              <Target className="w-4 h-4 mr-2" />
              Ready to Transform Your Academic Journey?
            </Badge>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Join Thousands of Students
              <span className="block">Achieving Excellence</span>
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed">
              Don't let academic challenges hold you back. Get expert writing assistance, 
              AI-powered tools, and personalized support to reach your full potential.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 md:mb-16">
              <Link to="/signup">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 shadow-elegant hover:shadow-glow transition-all duration-300 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold w-full"
                >
                  Start Free Consultation
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/signup">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg w-full"
                >
                  View Sample Work
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="text-center text-white/80 text-xs sm:text-sm">
              <span className="block sm:inline">✓ No commitment required</span>
              <span className="hidden sm:inline">  </span>
              <span className="block sm:inline">✓ 30-day money-back guarantee</span>
              <span className="hidden sm:inline">  </span>
              <span className="block sm:inline">✓ Instant access</span>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-white">
                    {benefit.icon}
                  </div>
                  <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">
                    {benefit.title}
                  </h3>
                  <p className="text-white/80 text-xs sm:text-sm">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Final CTA */}
          <div className="text-center mt-8 sm:mt-12 md:mt-16">
            <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 backdrop-blur-sm">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-white/90 mb-6 sm:mb-8 text-base sm:text-lg">
                Join thousands of successful students who have transformed their academic performance with ThinkScribe.
              </p>
              <Link to="/signup">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 shadow-elegant px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold"
                >
                  Get Started Today
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;