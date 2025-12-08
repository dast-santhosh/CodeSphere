import React from 'react';
import { ArrowLeft, Shield, Globe, Code, Check, Users, Mail } from 'lucide-react';
import { APP_LOGO } from '../constants';

interface AboutPageProps {
  onNavigate: (view: 'landing' | 'login' | 'about' | 'pricing') => void;
}

// Image Constants for the page content
const OWNER_IMAGE = 'https://i.ibb.co/PvLcL2yc/Whats-App-Image-2025-11-01-at-16-29-53-cb01c01b.jpg';
const BANNER_IMAGE = 'https://i.ibb.co/Dg9LszWz/Screenshot-2025-12-08-163557.png';
const ACHIEVEMENT_WALL = 'https://i.ibb.co/27CvHzcr/WALL-OF-ACHIEVEMT.png';


const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-blue-500/30">
      {/* --- Navigation Bar --- */}
      <nav className="fixed w-full z-50 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo and Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
             <div className="w-10 h-10 overflow-hidden border border-neutral-700 bg-neutral-900">
               {/* Note: APP_LOGO would typically be Apex Code Labs' logo, assuming CodeSphere is the main entity */}
               <img src={APP_LOGO} alt="CodeSphere Institute" className="w-full h-full object-cover" />
             </div>
             <div>
               <span className="font-bold text-lg tracking-tight block leading-none">CodeSphere Institute</span>
               <span className="text-[10px] text-neutral-500 uppercase tracking-widest">About Us</span>
             </div>
          </div>
          
          {/* Back Button */}
          <button onClick={() => onNavigate('landing')} className="flex items-center text-sm font-medium text-neutral-400 hover:text-white transition-colors">
              <ArrowLeft size={16} className="mr-2" /> Back to Home
          </button>
        </div>
      </nav>

      {/* --- Main Content Area --- */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <h1 className="text-4xl md:text-5xl font-bold mb-6">CodeSphere Institute Karaikudi</h1>
            <div className="w-24 h-1 bg-blue-600 mb-10"></div>

            
            <div className="prose prose-invert prose-lg max-w-none text-neutral-300">
                {/* Introduction - CodeSphere Institute */}
                <p className="lead text-xl">
                    CodeSphere Institute is a premier technology education center located in Karaikudi, Tamil Nadu. 
                    We are dedicated to bridging the gap between academic learning and industry requirements.
                </p>
                <p>
                    Founded with the vision to democratize computer science education, we offer comprehensive training programs 
                    in Python Programming, Web Development, Data Science, and Artificial Intelligence. Our curriculum is 
                    meticulously designed by industry experts to ensure relevance and rigor.
                </p>
                
                {/* --- NEW: Apex Code Labs Section --- */}
                <div className="mt-12 pt-6 border-t border-neutral-800">
                    <h3 className="text-white font-bold text-3xl mb-4 text-blue-400">
                        APEX CODE LABS
                    </h3>
                    <p className="text-xl font-medium text-neutral-200 mb-4">
                        Apex Code Labs serves as the cutting-edge Research & Development division and online training platform. 
                        It is an <strong className="text-white">Integral Part of CodeSphere Institute Karaikudi.</strong>
                    </p>
                    <p>
                        Focused on advanced robotics, specialized engineering, and high-level programming courses, 
                        Apex Code Labs ensures our students are exposed to the newest technologies and experimental learning environments, 
                        preparing them for high-demand, specialized careers globally.
                    </p>
                </div>

                {/* --- Founder Section --- */}
                <div className="mt-16 pt-8 border-t border-neutral-800">
                    <h3 className="text-white font-bold text-3xl mb-8">
                        Meet Our Mentor & Founder
                    </h3>
                    <div className="md:flex md:space-x-8 items-start">
                        {/* Image Column */}
                        <div className="md:w-1/3 mb-6 md:mb-0 flex flex-col items-center">
                            <img 
                                src={OWNER_IMAGE} 
                                alt="Santhosh, Founder & CEO" 
                                className="w-48 h-48 md:w-full md:h-auto object-cover aspect-square rounded-full md:rounded-lg shadow-xl border-4 border-blue-600/50 transition-all duration-300" 
                            />
                            <p className="text-center mt-4 text-xl font-bold text-white">Santhosh</p>
                            <p className="text-center text-sm text-blue-400">Founder & CEO</p>
                            <p className="text-center text-xs text-neutral-500 mt-1">CodeSphere | SenseX | DAST</p>
                        </div>

                        {/* Text Column */}
                        <div className="md:w-2/3 not-prose">
                            <p className="font-semibold text-xl text-neutral-200 mb-4">
                                "Building technologies that blend innovation, intelligence, and impact."
                            </p>
                            <p>
                                I’m a young entrepreneur, full-stack developer, and scientist passionate about creating the future, one idea at a time.
                            </p>
                            <ul className="list-disc ml-6 mt-4 space-y-3 text-neutral-300">
                                <li>
                                    <span className="font-medium text-white">CodeSphere Institute:</span> Empowering students in robotics, programming, and electronics to think beyond textbooks and create real-world solutions.
                                </li>
                                <li>
                                    <span className="font-medium text-white">SenseX:</span> Developing an emotional AI venture that understands human emotions and promotes digital wellness.
                                </li>
                                <li>
                                    <span className="font-medium text-white">DAST:</span> Venturing into aerospace research and technology, exploring the intersection of science and imagination.
                                </li>
                            </ul>
                            <p className="mt-6 italic text-neutral-400 border-l-4 border-neutral-700 pl-4">
                                I believe in learning by creating, leading by doing, and inspiring others to turn curiosity into invention.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* --- NEW: Banner Image (Moved here) --- */}
            <div className="mt-16 mb-12">
                <img src={BANNER_IMAGE} alt="CodeSphere Institute Banner" className="w-full h-auto object-cover border border-neutral-800" />
            </div>

            <div className="prose prose-invert prose-lg max-w-none text-neutral-300">
                {/* Mission & Vision Section */}
                <h3 className="text-white font-bold text-2xl mt-12 mb-4">Our Mission & Vision</h3>
                <div className="border-l-4 border-yellow-500 pl-4 mb-8">
                    <p className="font-semibold text-neutral-200">
                        <span className="text-yellow-500 mr-2">Mission:</span> To deliver accessible, high-quality, and practical coding education to transform aspiring technologists into industry-ready professionals.
                    </p>
                </div>
                <p>
                    <span className="font-semibold text-neutral-200">Vision:</span> To empower the next generation of software engineers and data scientists with the skills, confidence, 
                    and practical experience needed to thrive in the global digital economy.
                </p>

                {/* Why Choose Us Section */}
                <h3 className="text-white font-bold text-2xl mt-12 mb-4">Why Choose Us?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose mt-6">
                    <div className="bg-neutral-900 p-6 border border-neutral-800 hover:border-blue-600 transition-colors">
                        <Shield className="text-blue-500 mb-4" size={32} />
                        <h4 className="text-white font-bold text-lg mb-2">Industry Standard</h4>
                        <p className="text-neutral-400 text-sm">Our courses align with current market demands and technologies.</p>
                    </div>
                    <div className="bg-neutral-900 p-6 border border-neutral-800 hover:border-purple-600 transition-colors">
                        <Globe className="text-purple-500 mb-4" size={32} />
                        <h4 className="text-white font-bold text-lg mb-2">Global Reach</h4>
                        <p className="text-neutral-400 text-sm">We prepare students for opportunities worldwide through our online platform.</p>
                    </div>
                    <div className="bg-neutral-900 p-6 border border-neutral-800 hover:border-green-600 transition-colors">
                        <Code className="text-green-500 mb-4" size={32} />
                        <h4 className="text-white font-bold text-lg mb-2">Practical Focus</h4>
                        <p className="text-neutral-400 text-sm">80% of our training involves hands-on coding and project building.</p>
                    </div>
                    <div className="bg-neutral-900 p-6 border border-neutral-800 hover:border-yellow-600 transition-colors">
                        <Check className="text-yellow-500 mb-4" size={32} />
                        <h4 className="text-white font-bold text-lg mb-2">Certification</h4>
                        <p className="text-neutral-400 text-sm">Receive recognized certificates upon successful course completion.</p>
                    </div>
                </div>

                {/* Get In Touch Section */}
                <h3 className="text-white font-bold text-2xl mt-16 mb-4">Get In Touch</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose mt-6">
                    <div className="flex items-start bg-neutral-900 p-6 border border-neutral-800">
                        <Users className="text-red-500 mr-4 mt-1" size={24} />
                        <div>
                            <h4 className="text-white font-bold text-lg mb-1">Meet Our Instructors</h4>
                            <p className="text-neutral-400 text-sm">Our mentors are working professionals from top tech companies.</p>
                            <a href="#" className="text-blue-500 text-sm hover:underline mt-1 block">View Team Profiles &rarr;</a>
                        </div>
                    </div>
                    <div className="flex items-start bg-neutral-900 p-6 border border-neutral-800">
                        <Mail className="text-cyan-500 mr-4 mt-1" size={24} />
                        <div>
                            <h4 className="text-white font-bold text-lg mb-1">Contact Us Directly</h4>
                            <p className="text-neutral-400 text-sm">Have specific questions about our programs? We're here to help.</p>
                            <a href="mailto:info@codesphere.in" className="text-blue-500 text-sm hover:underline mt-1 block">info@codesphere.in &rarr;</a>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* --- Wall of Achievement Image --- */}
            <div className="mt-20 pt-10 border-t border-neutral-800 text-center">
                <h3 className="text-white font-bold text-3xl mb-8">Our Wall of Achievement</h3>
                <img 
                    src={ACHIEVEMENT_WALL} 
                    alt="CodeSphere Wall of Achievement" 
                    className="w-full h-auto object-cover border border-neutral-800 shadow-2xl" 
                />
            </div>

            {/* Footer Call to Action */}
            <div className="mt-16 pt-10 border-t border-neutral-800 text-center">
                <p className="text-neutral-400 mb-6 text-lg font-medium">Ready to start your journey?</p>
                <div className="flex justify-center space-x-4">
                    <button 
                        onClick={() => onNavigate('pricing')} 
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 transition-colors text-base"
                    >
                        View Our Courses
                    </button>
                    <button 
                        onClick={() => onNavigate('login')} 
                        className="border border-neutral-600 hover:border-neutral-500 text-neutral-300 hover:text-white font-medium py-3 px-8 transition-colors text-base"
                    >
                        Student Login
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;