
import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { APP_LOGO } from '../constants';

interface PricingPageProps {
  onNavigate: (view: 'landing' | 'login' | 'about' | 'pricing') => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
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
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Courses & Pricing</span>
             </div>
          </div>
          <button onClick={() => onNavigate('landing')} className="flex items-center text-sm font-medium text-neutral-400 hover:text-white transition-colors">
              <ArrowLeft size={16} className="mr-2" /> Back to Home
          </button>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
             <div className="text-center mb-16">
                  <h1 className="text-4xl font-bold text-white mb-4">Batches & Pricing</h1>
                  <p className="text-neutral-400 max-w-2xl mx-auto">
                      Transparent pricing for world-class education. Choose the plan that best fits your learning goals.
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Basic Tier */}
                  <div className="bg-neutral-900 border border-neutral-800 p-8 flex flex-col">
                      <div className="mb-4 text-neutral-400 text-sm font-bold uppercase tracking-wider">Foundation</div>
                      <h3 className="text-2xl font-bold text-white mb-2">Python Basics</h3>
                      <div className="text-4xl font-bold text-white mb-6">₹4,999<span className="text-lg text-neutral-500 font-normal">/mo</span></div>
                      <p className="text-neutral-400 text-sm mb-8 flex-1">Perfect for beginners starting their journey in programming.</p>
                      
                      <ul className="space-y-4 mb-8 text-sm text-neutral-300">
                          <li className="flex items-center"><Check size={16} className="text-green-500 mr-3" /> Syntax & Variables</li>
                          <li className="flex items-center"><Check size={16} className="text-green-500 mr-3" /> Control Flow</li>
                          <li className="flex items-center"><Check size={16} className="text-green-500 mr-3" /> Basic Data Structures</li>
                          <li className="flex items-center"><Check size={16} className="text-green-500 mr-3" /> Access to Sandbox</li>
                          <li className="flex items-center"><Check size={16} className="text-green-500 mr-3" /> 2 Live Sessions/Week</li>
                      </ul>
                      
                      <button onClick={() => onNavigate('login')} className="w-full py-3 border border-neutral-700 hover:bg-neutral-800 text-white font-bold transition-colors rounded-none">Start Now</button>
                  </div>

                  {/* Pro Tier */}
                  <div className="bg-neutral-900 border border-blue-500 p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-blue-900/10">
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1">POPULAR</div>
                      <div className="mb-4 text-blue-400 text-sm font-bold uppercase tracking-wider">Professional</div>
                      <h3 className="text-2xl font-bold text-white mb-2">Full Stack Dev</h3>
                      <div className="text-4xl font-bold text-white mb-6">₹9,999<span className="text-lg text-neutral-500 font-normal">/mo</span></div>
                      <p className="text-neutral-400 text-sm mb-8 flex-1">Comprehensive training for aspiring software engineers.</p>
                      
                      <ul className="space-y-4 mb-8 text-sm text-neutral-300">
                          <li className="flex items-center"><Check size={16} className="text-blue-500 mr-3" /> Everything in Foundation</li>
                          <li className="flex items-center"><Check size={16} className="text-blue-500 mr-3" /> Advanced Algorithms</li>
                          <li className="flex items-center"><Check size={16} className="text-blue-500 mr-3" /> Live Projects</li>
                          <li className="flex items-center"><Check size={16} className="text-blue-500 mr-3" /> Priority AI Support</li>
                          <li className="flex items-center"><Check size={16} className="text-blue-500 mr-3" /> Career Guidance</li>
                          <li className="flex items-center"><Check size={16} className="text-blue-500 mr-3" /> 4 Live Sessions/Week</li>
                      </ul>
                      
                      <button onClick={() => onNavigate('login')} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors rounded-none">Start Now</button>
                  </div>

                  {/* Elite Tier */}
                  <div className="bg-neutral-900 border border-neutral-800 p-8 flex flex-col">
                      <div className="mb-4 text-purple-400 text-sm font-bold uppercase tracking-wider">Elite</div>
                      <h3 className="text-2xl font-bold text-white mb-2">Data Science</h3>
                      <div className="text-4xl font-bold text-white mb-6">₹14,999<span className="text-lg text-neutral-500 font-normal">/mo</span></div>
                      <p className="text-neutral-400 text-sm mb-8 flex-1">Specialized track for AI, ML, and Data Analysis roles.</p>
                      
                      <ul className="space-y-4 mb-8 text-sm text-neutral-300">
                          <li className="flex items-center"><Check size={16} className="text-purple-500 mr-3" /> Python for Data Science</li>
                          <li className="flex items-center"><Check size={16} className="text-purple-500 mr-3" /> Machine Learning Models</li>
                          <li className="flex items-center"><Check size={16} className="text-purple-500 mr-3" /> 1-on-1 Mentorship</li>
                          <li className="flex items-center"><Check size={16} className="text-purple-500 mr-3" /> Internship Support</li>
                          <li className="flex items-center"><Check size={16} className="text-purple-500 mr-3" /> Unlimited Live Access</li>
                      </ul>
                      
                      <button onClick={() => onNavigate('login')} className="w-full py-3 border border-neutral-700 hover:bg-neutral-800 text-white font-bold transition-colors rounded-none">Start Now</button>
                  </div>
              </div>

              <div className="mt-20 text-center">
                  <h3 className="text-2xl font-bold text-white mb-6">Need a custom plan for your institution?</h3>
                  <a href="mailto:admissions@codespherekkdi.com" className="inline-block bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-bold py-3 px-8 transition-colors rounded-none">Contact Admissions</a>
              </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
