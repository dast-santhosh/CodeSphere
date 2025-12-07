
import React from 'react';
import { Clock, LogOut, FileText } from 'lucide-react';
import { User } from '../types';
import { APP_LOGO } from '../constants';

interface WaitingRoomProps {
  user: User;
  onLogout: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <header className="h-16 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between px-6">
         <div className="flex items-center">
            <div className="w-10 h-10 overflow-hidden shadow-lg shadow-primary-500/20 mr-3 border border-primary-500/30">
                <img src={APP_LOGO} alt="Apex Code Labs" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-lg tracking-tight">Apex Code Labs</span>
         </div>
         <button 
            onClick={onLogout}
            className="text-neutral-400 hover:text-white flex items-center text-sm font-medium"
         >
            <LogOut size={16} className="mr-2" /> Sign Out
         </button>
      </header>

      <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
              {/* Status Banner */}
              <div className="bg-neutral-900 border border-yellow-500/20 p-8 text-center mb-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
                  <div className="w-16 h-16 bg-yellow-500/10 flex items-center justify-center mx-auto mb-4 text-yellow-500 animate-pulse">
                      <Clock size={32} />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">Registration Pending</h1>
                  <p className="text-neutral-400 max-w-lg mx-auto">
                      Hello <span className="text-white font-medium">{user.name}</span>! Your request to join the course has been received. 
                      An Administrator needs to approve your account before you can access the curriculum and live classes.
                  </p>
                  <p className="text-sm text-neutral-500 mt-4">
                      You will be notified via email once approved. In the meantime, you can read the introduction below.
                  </p>
              </div>

              {/* Intro Content */}
              <div className="bg-neutral-900 border border-neutral-800 p-8">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                      <FileText size={20} className="mr-2 text-primary-500" />
                      While you wait: Introduction to Python
                  </h2>
                  
                  <div className="prose prose-invert max-w-none text-neutral-300">
                      <p>
                          Python is an interpreted, object-oriented, high-level programming language with dynamic semantics. 
                          Its high-level built in data structures, combined with dynamic typing and dynamic binding, 
                          make it very attractive for Rapid Application Development, as well as for use as a scripting 
                          or glue language to connect existing components together.
                      </p>

                      <h3 className="text-white font-bold text-lg mt-6 mb-3">Why Python?</h3>
                      <ul className="list-disc pl-5 space-y-2">
                          <li>
                              <strong className="text-white">Readable & Maintainable Code:</strong> Python's syntax matches the English language 
                              to a large extent, making it easy to read and write.
                          </li>
                          <li>
                              <strong className="text-white">Multiple Programming Paradigms:</strong> It supports object-oriented, structural, 
                              and functional programming.
                          </li>
                          <li>
                              <strong className="text-white">Robust Standard Library:</strong> Python's "batteries included" philosophy means 
                              it comes with a rich standard library for everything from file I/O to machine learning.
                          </li>
                      </ul>

                      <h3 className="text-white font-bold text-lg mt-6 mb-3">What you will learn in this course</h3>
                      <p>
                          Once approved, you will gain access to our interactive "CodeSphere" environment. The curriculum covers:
                      </p>
                      <ul className="list-disc pl-5 space-y-2">
                          <li>Basic Syntax, Variables, and Data Types</li>
                          <li>Control Flow (If/Else, Loops)</li>
                          <li>Functions and Modules</li>
                          <li>Data Structures (Lists, Dictionaries, Tuples)</li>
                          <li>Building Real-world Projects</li>
                      </ul>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default WaitingRoom;
