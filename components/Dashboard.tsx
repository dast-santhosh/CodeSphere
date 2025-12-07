
import React, { useState, useEffect } from 'react';
import { PlayCircle, Clock, Award, Star, BookOpen, Code, CheckCircle2, Calendar, Video, Radio } from 'lucide-react';
import { Lesson, ScheduledClass } from '../types';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface DashboardProps {
  lessons: Lesson[];
  scheduledClasses?: ScheduledClass[];
  onStartLesson: (lesson: Lesson) => void;
  completedLessonIds?: string[];
}

const Dashboard: React.FC<DashboardProps> = ({ lessons, scheduledClasses = [], onStartLesson, completedLessonIds = [] }) => {
  const [isLive, setIsLive] = useState(false);
  const [liveRoomId, setLiveRoomId] = useState('main-class');

  const completedCount = completedLessonIds.length;
  
  // Calculate a streak based on date (mock logic for now as we don't store completion dates)
  const streak = completedCount > 0 ? '1 Day' : '0 Days'; 
  const hoursSpent = Math.round(completedCount * 1.5); // Estimate 1.5h per lesson

  // Listen for Live Room Status
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "rooms", "main-class"), (doc) => {
        if (doc.exists() && doc.data().active) {
            setIsLive(true);
        } else {
            setIsLive(false);
        }
    });
    return () => unsub();
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-slate-950">
      <div className="p-6 lg:p-10 max-w-7xl mx-auto pb-20">
        <header className="mb-10 relative">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary-500/5 to-purple-500/5 blur-3xl -z-10"></div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back! 👋</h1>
            <p className="text-slate-400">Continue your journey in the <span className="text-primary-400 font-semibold">CODESPHERE</span>.</p>
            
            <div className="mt-6 inline-flex items-center px-4 py-2 rounded-full bg-slate-900 border border-slate-800 shadow-sm">
                <Code size={16} className="text-primary-500 mr-2" />
                <span className="text-xs font-bold tracking-widest text-slate-300 uppercase">Learn. Code. Create. Together.</span>
            </div>
        </header>

        {/* LIVE NOW BANNER */}
        {isLive && (
            <div className="mb-10 bg-gradient-to-r from-red-600 to-red-800 rounded-2xl p-1 shadow-2xl shadow-red-500/20 animate-pulse-slow">
                <div className="bg-slate-900 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
                     {/* Animated Background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    
                    <div className="flex items-center z-10 mb-4 md:mb-0">
                        <div className="mr-6 relative">
                            <span className="absolute top-0 right-0 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 border border-red-500/30">
                                <Radio size={32} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">Live Class in Session!</h2>
                            <p className="text-slate-400 text-sm">The instructor is currently streaming. Join now to participate.</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                            // Find the 'Start Live Class' handler passed via props or context in a real app
                            // For now, we assume the parent checks this view state change via a different method
                            // In App.tsx, we need to pass a handler or expose a global context
                            // Since we can't easily change App.tsx from here without prop drilling, 
                            // we will use a custom event or let the user click the sidebar.
                            // However, let's try to find the "Live Class" sidebar button programmatically or just rely on user navigation.
                            // BETTER: We can't easily switch view from here without a prop. 
                            // Assuming the user will click sidebar, but let's make this button work by triggering a click on the sidebar 'Live Class'
                            const sidebarLiveBtn = document.querySelector('button[title="Live Class"]') as HTMLButtonElement;
                            if (sidebarLiveBtn) sidebarLiveBtn.click();
                        }}
                        className="relative z-10 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center"
                    >
                        <Video size={20} className="mr-2" />
                        JOIN CLASS
                    </button>
                </div>
            </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all"></div>
                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 mr-4">
                    <BookOpen size={24} />
                </div>
                <div>
                    <p className="text-slate-400 text-sm font-medium">Modules Completed</p>
                    <p className="text-2xl font-bold text-white">{completedCount}/{lessons.length}</p>
                </div>
            </div>
            
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
                <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all"></div>
                <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400 mr-4">
                    <Clock size={24} />
                </div>
                <div>
                    <p className="text-slate-400 text-sm font-medium">Hours Spent</p>
                    <p className="text-2xl font-bold text-white">{hoursSpent}h</p>
                </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center relative overflow-hidden group hover:border-yellow-500/30 transition-all duration-300">
                <div className="absolute right-0 top-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-yellow-500/20 transition-all"></div>
                <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-400 mr-4">
                    <Award size={24} />
                </div>
                <div>
                    <p className="text-slate-400 text-sm font-medium">Current Streak</p>
                    <p className="text-2xl font-bold text-white">{streak}</p>
                </div>
            </div>
        </div>
        
        {/* Scheduled Classes */}
        {scheduledClasses.length > 0 && (
            <div className="mb-10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Video className="text-red-500 mr-2" size={20} />
                    Upcoming Live Classes
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {scheduledClasses.map(cls => (
                        <div key={cls.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between hover:border-primary-500/30 transition-colors">
                            <div className="flex items-center">
                                <div className="p-3 bg-slate-800 rounded-xl mr-4 text-center min-w-[60px]">
                                    <div className="text-xs text-red-400 font-bold uppercase">{new Date(cls.date).toLocaleString('default', { month: 'short' })}</div>
                                    <div className="text-xl font-bold text-white">{new Date(cls.date).getDate()}</div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{cls.title}</h3>
                                    <div className="flex items-center text-xs text-slate-400 mt-1">
                                        <Clock size={12} className="mr-1" />
                                        {new Date(cls.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        <span className="mx-2">•</span>
                                        <span>{cls.instructorName}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <Star className="text-yellow-500 mr-2" size={20} fill="currentColor" />
            Your Curriculum
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
            {lessons.map((lesson) => {
            const isCompleted = completedLessonIds.includes(lesson.id);
            
            return (
                <div key={lesson.id} className={`bg-slate-900 rounded-2xl border p-6 transition-all duration-300 group shadow-lg shadow-black/20 
                    ${isCompleted ? 'border-green-500/30' : 'border-slate-800 hover:border-primary-500/50'}`}>
                    
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider
                                    ${lesson.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' : 
                                    lesson.difficulty === 'Intermediate' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'}
                                `}>
                                    {lesson.difficulty}
                                </span>
                                {isCompleted && (
                                    <span className="flex items-center text-xs font-bold px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/20">
                                        <CheckCircle2 size={12} className="mr-1" /> COMPLETED
                                    </span>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-white mt-3 group-hover:text-primary-400 transition-colors">{lesson.title}</h3>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                            ${isCompleted ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-primary-500 group-hover:text-white'}`}>
                            {isCompleted ? <CheckCircle2 size={20} /> : <PlayCircle size={20} />}
                        </div>
                    </div>
                    
                    <p className="text-slate-400 mb-6 text-sm line-clamp-2">{lesson.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                        {lesson.topics.map(topic => (
                            <span key={topic} className="text-xs text-slate-500 bg-slate-950 border border-slate-800 px-2 py-1 rounded">
                                #{topic}
                            </span>
                        ))}
                    </div>

                    <button 
                        onClick={() => onStartLesson(lesson)}
                        className={`w-full py-3 font-medium rounded-xl transition-all flex items-center justify-center
                            ${isCompleted 
                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                                : 'bg-slate-800 hover:bg-primary-600 text-white'}`}
                    >
                        {isCompleted ? 'Review Module' : 'Start Module'}
                    </button>
                </div>
            );
            })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
