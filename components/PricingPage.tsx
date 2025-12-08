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

              {/* --- UPDATED GRID WITH NEW COURSES --- */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                  {/* Master Python (Beginner) */}
                  <div className="bg-neutral-900 border border-neutral-800 p-8 flex flex-col">
                      <div className="mb-4 text-green-400 text-sm font-bold uppercase tracking-wider">Beginner</div>
                      <h3 className="text-2xl font-bold text-white mb-2">Master Python (Beginner)</h3>
                      <div className="text-4xl font-bold text-white mb-2">₹249<span className="text-lg text-neutral-500 font-normal">/mo</span></div>
                      <div className="text-neutral-400 text-sm -mt-1 mb-6">3 Months · Total ₹747 · Starts Mar 2026</div>

                      <p className="text-neutral-400 text-sm mb-8 flex-1">A complete Python foundation for school students, including 7 structured modules.</p>

                      <ul className="space-y-4 mb-8 text-sm text-neutral-300">
                          <li className="flex items-center"><Check size={16} className="text-green-500 mr-3" /> 7 Detailed Modules</li>
                          <li className="flex items-center"><Check size={16} className="text-green-500 mr-3" /> Full Python Basics</li>
                          <li className="flex items-center"><Check size={16} className="text-green-500 mr-3" /> Projects & Practice Sets</li>
                          <li className="flex items-center"><Check size={16} className="text-green-500 mr-3" /> Starts Mar 2026</li>
                      </ul>

                      <button onClick={() => onNavigate('login')} className="w-full py-3 border border-neutral-700 hover:bg-neutral-800 text-white font-bold transition-colors rounded-none">Enroll Now</button>
                  </div>

                  {/* Basics of Computer */}
                  <div className="bg-neutral-900 border border-yellow-500 p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-yellow-900/10">
                      <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-3 py-1">POPULAR</div>
                      <div className="mb-4 text-yellow-400 text-sm font-bold uppercase tracking-wider">Essential</div>
                      <h3 className="text-2xl font-bold text-white mb-2">Basics of Computer</h3>
                      <div className="text-4xl font-bold text-white mb-2">₹499</div>
                      <div className="text-neutral-400 text-sm -mt-1 mb-6">One-time · 2 Months · Starts Mar 2026</div>

                      <p className="text-neutral-400 text-sm mb-8 flex-1">
                        Covers hardware, operating systems, networking, internet safety, and productivity.
                      </p>

                      <ul className="space-y-4 mb-8 text-sm text-neutral-300">
                          <li className="flex items-center"><Check size={16} className="text-yellow-400 mr-3" /> Hardware & OS</li>
                          <li className="flex items-center"><Check size={16} className="text-yellow-400 mr-3" /> Networking Basics</li>
                          <li className="flex items-center"><Check size={16} className="text-yellow-400 mr-3" /> Internet Safety</li>
                          <li className="flex items-center"><Check size={16} className="text-yellow-400 mr-3" /> Starts Mar 2026</li>
                      </ul>

                      <button onClick={() => onNavigate('login')} className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition-colors rounded-none">Enroll Now</button>
                  </div>

                  {/* Professional Skills & AI Tools */}
                  <div className="bg-neutral-900 border border-neutral-800 p-8 flex flex-col">
                      <div className="mb-4 text-blue-400 text-sm font-bold uppercase tracking-wider">Professional</div>
                      <h3 className="text-2xl font-bold text-white mb-2">Professional Skills & AI Tools</h3>
                      <div className="text-4xl font-bold text-white mb-2">₹500</div>
                      <div className="text-neutral-400 text-sm -mt-1 mb-6">One-time · 1 Month · Starts Jan 2026</div>

                      <p className="text-neutral-400 text-sm mb-8 flex-1">
                        Digital communication, office tools, and essential AI productivity tools for students.
                      </p>

                      <ul className="space-y-4 mb-8 text-sm text-neutral-300">
                          <li className="flex items-center"><Check size={16} className="text-blue-500 mr-3" /> Digital Communication</li>
                          <li className="flex items-center"><Check size={16} className="text-blue-500 mr-3" /> Office Essentials</li>
                          <li className="flex items-center"><Check size={16} className="text-blue-500 mr-3" /> AI Productivity Tools</li>
                          <li className="flex items-center"><Check size={16} className="text-blue-500 mr-3" /> Starts Jan 2026</li>
                      </ul>

                      <button onClick={() => onNavigate('login')} className="w-full py-3 border border-neutral-700 hover:bg-neutral-800 text-white font-bold transition-colors rounded-none">Enroll Now</button>
                  </div>
              </div>

              {/* Contact */}
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
