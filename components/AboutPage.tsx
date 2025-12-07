
import React from 'react';
import { ArrowLeft, Shield, Globe, Code, Check } from 'lucide-react';
import { APP_LOGO } from '../constants';

interface AboutPageProps {
  onNavigate: (view: 'landing' | 'login' | 'about' | 'pricing') => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-blue-500/30">
      <nav className="fixed w-full z-50 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
             <div className="w-10 h-10 overflow-hidden border border-neutral-700 bg-neutral-900">
                <img src={APP_LOGO} alt="Apex Code Labs" className="w-full h-full object-cover" />
             </div>
             <div>
                <span className="font-bold text-lg tracking-tight block leading-none">Apex Code Labs</span>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest">About Us</span>
             </div>
          </div>
          <button onClick={() => onNavigate('landing')} className="flex items-center text-sm font-medium text-neutral-400 hover:text-white transition-colors">
              <ArrowLeft size={16} className="mr-2" /> Back to Home
          </button>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">CodeSphere Institute Karaikudi</h1>
            <div className="w-24 h-1 bg-blue-600 mb-10"></div>
            
            <div className="prose prose-invert prose-lg max-w-none text-neutral-300">
                <p className="lead text-xl">
                    CodeSphere Institute is a premier technology education center located in Karaikudi, Tamil Nadu. 
                    We are dedicated to bridging the gap between academic learning and industry requirements.
                </p>
                <p>
                    Founded with the vision to democratize computer science education, we offer comprehensive training programs 
                    in Python Programming, Web Development, Data Science, and Artificial Intelligence. Our curriculum is 
                    meticulously designed by industry experts to ensure relevance and rigor.
                </p>
                
                <h3 className="text-white font-bold text-2xl mt-12 mb-4">Our Vision</h3>
                <p>
                    To empower the next generation of software engineers and data scientists with the skills, confidence, 
                    and practical experience needed to thrive in the global digital economy.
                </p>

                <h3 className="text-white font-bold text-2xl mt-12 mb-4">Why Choose Us?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose mt-6">
                    <div className="bg-neutral-900 p-6 border border-neutral-800">
                        <Shield className="text-blue-500 mb-4" size={32} />
                        <h4 className="text-white font-bold text-lg mb-2">Industry Standard</h4>
                        <p className="text-neutral-400 text-sm">Our courses align with current market demands and technologies.</p>
                    </div>
                    <div className="bg-neutral-900 p-6 border border-neutral-800">
                        <Globe className="text-purple-500 mb-4" size={32} />
                        <h4 className="text-white font-bold text-lg mb-2">Global Reach</h4>
                        <p className="text-neutral-400 text-sm">We prepare students for opportunities worldwide through our online platform.</p>
                    </div>
                    <div className="bg-neutral-900 p-6 border border-neutral-800">
                        <Code className="text-green-500 mb-4" size={32} />
                        <h4 className="text-white font-bold text-lg mb-2">Practical Focus</h4>
                        <p className="text-neutral-400 text-sm">80% of our training involves hands-on coding and project building.</p>
                    </div>
                    <div className="bg-neutral-900 p-6 border border-neutral-800">
                        <Check className="text-yellow-500 mb-4" size={32} />
                        <h4 className="text-white font-bold text-lg mb-2">Certification</h4>
                        <p className="text-neutral-400 text-sm">Receive recognized certificates upon successful course completion.</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-16 pt-10 border-t border-neutral-800 text-center">
                <p className="text-neutral-400 mb-6">Ready to start your journey?</p>
                <button onClick={() => onNavigate('pricing')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-none transition-colors">View Our Courses</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
