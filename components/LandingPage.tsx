
import React from 'react';
import { Terminal, Video, Cpu, Shield, Globe, ArrowRight, Code, Check, Mail, Phone, MapPin } from 'lucide-react';
import { APP_LOGO } from '../constants';
import ThreeDHero from './ThreeDHero';

interface LandingPageProps {
  onNavigate: (view: 'landing' | 'login' | 'about' | 'pricing') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [formData, setFormData] = React.useState({ name: '', email: '', message: '' });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `Inquiry from ${formData.name}`;
    const body = `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`;
    window.open(`mailto:stusanthosh5195@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-blue-500/30">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
             <div className="w-10 h-10 overflow-hidden border border-neutral-700 bg-neutral-900">
                <img src={APP_LOGO} alt="Apex Code Labs" className="w-full h-full object-cover" />
             </div>
             <div>
                <span className="font-bold text-lg tracking-tight block leading-none">Apex Code Labs</span>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest">By CodeSphere Institute</span>
             </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
              <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors">About</button>
              <button onClick={() => onNavigate('pricing')} className="hover:text-white transition-colors">Courses & Pricing</button>
              <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Contact</button>
          </div>

          <div className="flex items-center gap-4">
            <button 
                onClick={() => onNavigate('login')}
                className="bg-white hover:bg-neutral-200 text-black px-6 py-2.5 text-sm font-bold transition-all rounded-none"
            >
                Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 border-b border-neutral-800 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column: Text */}
            <div className="text-center lg:text-left z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-800 text-xs text-blue-400 font-mono mb-8">
                    <span className="w-2 h-2 bg-blue-500 animate-pulse"></span>
                    V2.0 LIVE SYSTEM OPERATIONAL
                </div>
                
                <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
                    The Future of <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Computer Programming</span>
                </h1>
                
                <p className="text-lg text-neutral-400 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                    An immersive, all-in-one education platform combining real-time live classes, AI-powered tutoring, and an interactive coding environment.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                    <button 
                        onClick={() => onNavigate('login')}
                        className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all rounded-none shadow-lg shadow-blue-900/20"
                    >
                        Start Learning <ArrowRight size={20} />
                    </button>
                    <button 
                        onClick={() => onNavigate('pricing')}
                        className="w-full sm:w-auto px-8 py-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold text-lg transition-all rounded-none"
                    >
                        View Courses
                    </button>
                </div>

                <div className="mt-16 pt-8 border-t border-neutral-900 flex flex-col items-center lg:items-start">
                    <p className="text-neutral-500 text-sm mb-4 uppercase tracking-widest">An integral part of</p>
                    <a href="https://codespherekkdi.wordpress.com/" target="_blank" rel="noreferrer" className="group">
                        <div className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">CodeSphere Institute Karaikudi</div>
                        <div className="text-neutral-600 text-sm group-hover:text-neutral-500">Excellence in Tech Education</div>
                    </a>
                </div>
            </div>

            {/* Right Column: 3D Monitor */}
            <div className="relative w-full h-[500px] flex items-center justify-center perspective-1000">
                {/* Monitor Frame */}
                <div className="relative w-full h-[400px] bg-neutral-900 border-8 border-neutral-800 rounded-xl shadow-2xl overflow-hidden group">
                    {/* Screen Glow */}
                    <div className="absolute inset-0 bg-blue-500/5 z-0 animate-pulse"></div>
                    
                    {/* 3D Content */}
                    <div className="absolute inset-0 z-10">
                        <ThreeDHero />
                    </div>

                    {/* Scanlines Effect Overlay */}
                    <div className="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] bg-repeat opacity-20"></div>
                    
                    {/* Monitor Gloss */}
                    <div className="absolute inset-0 z-30 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

                    {/* Code Overlay Text (Optional Visuals) */}
                    <div className="absolute bottom-4 left-4 z-20">
                         <div className="text-[10px] text-green-500 font-mono">
                             SYSTEM_STATUS: ONLINE<br/>
                             RENDERING_ENGINE: ACTIVE<br/>
                             FPS: 60
                         </div>
                    </div>
                </div>

                {/* Monitor Stand */}
                <div className="absolute -bottom-12 w-32 h-16 bg-neutral-800 transform perspective-x-50"></div>
                <div className="absolute -bottom-14 w-48 h-4 bg-neutral-800 rounded-t-lg"></div>
            </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-neutral-950 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard 
                    icon={<Video size={32} className="text-red-500" />}
                    title="Live Classrooms"
                    desc="Real-time WebRTC video streaming with screen sharing, integrated chat, and simultaneous coding overlays."
                />
                <FeatureCard 
                    icon={<Cpu size={32} className="text-purple-500" />}
                    title="AI-Powered Tutor"
                    desc="Gemini-powered assistance instantly resolves doubts and provides feedback on your code 24/7."
                />
                <FeatureCard 
                    icon={<Terminal size={32} className="text-green-500" />}
                    title="Interactive Sandbox"
                    desc="A full-fledged Python IDE in your browser. Write, execute, and debug code without installing anything."
                />
            </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 bg-neutral-900">
          <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-white mb-4">Contact Us</h2>
                  <p className="text-neutral-400">Have questions? Reach out to CodeSphere Institute.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                      <div className="flex items-start">
                          <div className="p-3 bg-neutral-800 border border-neutral-700 mr-4">
                              <MapPin className="text-white" size={24} />
                          </div>
                          <div>
                              <h4 className="text-white font-bold mb-1">Visit Us</h4>
                              <p className="text-neutral-400 text-sm leading-relaxed">
                                  CodeSphere Institute,<br />
                                  Karaikudi, Tamil Nadu
                              </p>
                          </div>
                      </div>

                      <div className="flex items-start">
                          <div className="p-3 bg-neutral-800 border border-neutral-700 mr-4">
                              <Mail className="text-white" size={24} />
                          </div>
                          <div>
                              <h4 className="text-white font-bold mb-1">Email Us</h4>
                              <p className="text-neutral-400 text-sm">admissions@codespherekkdi.com</p>
                              <p className="text-neutral-400 text-sm">stusanthosh5195@gmail.com</p>
                          </div>
                      </div>

                      <div className="flex items-start">
                          <div className="p-3 bg-neutral-800 border border-neutral-700 mr-4">
                              <Phone className="text-white" size={24} />
                          </div>
                          <div>
                              <h4 className="text-white font-bold mb-1">Call Us</h4>
                              <p className="text-neutral-400 text-sm">+91 9342087912</p>
                              <p className="text-neutral-400 text-sm">Mon - Sun, 9 am - 6pm</p>
                          </div>
                      </div>
                  </div>

                  <form className="bg-neutral-950 p-8 border border-neutral-800 shadow-2xl" onSubmit={handleContactSubmit}>
                      <div className="mb-4">
                          <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Name</label>
                          <input required type="text" className="w-full bg-neutral-900 border border-neutral-800 p-3 text-white focus:border-blue-500 outline-none rounded-none" placeholder="Your Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div className="mb-4">
                          <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Email</label>
                          <input required type="email" className="w-full bg-neutral-900 border border-neutral-800 p-3 text-white focus:border-blue-500 outline-none rounded-none" placeholder="your@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <div className="mb-6">
                          <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Message</label>
                          <textarea required className="w-full bg-neutral-900 border border-neutral-800 p-3 text-white focus:border-blue-500 outline-none h-32 resize-none rounded-none" placeholder="How can we help you?" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}></textarea>
                      </div>
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 transition-colors rounded-none">Send Message</button>
                  </form>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-800 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
                <div className="font-bold text-white mb-2">Apex Code Labs</div>
                <div className="text-sm text-neutral-500">© {new Date().getFullYear()} CodeSphere Institute Karaikudi.</div>
            </div>
            <div className="flex gap-6">
                <a href="https://codespherekkdi.wordpress.com/" target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white text-sm">Institute Website</a>
                <span className="text-neutral-700">|</span>
                <button onClick={() => onNavigate('login')} className="text-neutral-400 hover:text-white text-sm">Student Login</button>
            </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="p-8 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors group">
        <div className="mb-6 p-4 bg-neutral-950 w-fit border border-neutral-800 group-hover:border-neutral-700">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-neutral-400 leading-relaxed">{desc}</p>
    </div>
);

export default LandingPage;
