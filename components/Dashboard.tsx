
import React, { useState, useEffect } from 'react';
import { PlayCircle, Clock, Award, BookOpen, CheckCircle2, Video, Radio } from 'lucide-react';
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

  const completedCount = completedLessonIds.length;
  const streak = completedCount > 0 ? '1 Day' : '0 Days'; 
  const hoursSpent = Math.round(completedCount * 1.5); 

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "rooms", "live-config"), (doc) => {
        setIsLive(doc.exists() && doc.data().active);
    });
    return () => unsub();
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-neutral-950">
      <div className="p-8 max-w-7xl mx-auto pb-20">
        <header className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
            <p className="text-gray-500 dark:text-neutral-400">Track your progress and access your curriculum.</p>
        </header>

        {isLive && (
            <div className="mb-8 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-6 flex items-center justify-between rounded-none">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-600 flex items-center justify-center text-white mr-4 rounded-none animate-pulse">
                        <Radio size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Live Class in Session</h2>
                        <p className="text-gray-600 dark:text-neutral-400 text-sm">Join the instructor now.</p>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        const sidebarLiveBtn = document.querySelector('button[title="Live Class"]') as HTMLButtonElement;
                        if (sidebarLiveBtn) sidebarLiveBtn.click();
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 font-medium transition-colors text-sm rounded-none"
                >
                    Join Class
                </button>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
                { label: 'Modules Completed', value: `${completedCount}/${lessons.length}`, icon: BookOpen, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/10' },
                { label: 'Hours Spent', value: `${hoursSpent}h`, icon: Clock, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/10' },
                { label: 'Current Streak', value: streak, icon: Award, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/10' }
            ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-neutral-900 p-6 border border-gray-200 dark:border-neutral-800 flex items-center rounded-none shadow-sm">
                    <div className={`p-3 ${stat.bg} ${stat.color} mr-4 rounded-none`}>
                        <stat.icon size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-neutral-500 text-sm font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                </div>
            ))}
        </div>
        
        {scheduledClasses.length > 0 && (
            <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Upcoming Live Classes</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {scheduledClasses.map(cls => (
                        <div key={cls.id} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-5 flex items-center justify-between rounded-none shadow-sm">
                            <div className="flex items-center">
                                <div className="p-3 bg-gray-100 dark:bg-neutral-800 mr-4 text-center min-w-[60px] border border-gray-200 dark:border-neutral-700 rounded-none">
                                    <div className="text-xs text-gray-500 dark:text-neutral-400 font-bold uppercase">{new Date(cls.date).toLocaleString('default', { month: 'short' })}</div>
                                    <div className="text-xl font-bold text-gray-900 dark:text-white">{new Date(cls.date).getDate()}</div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{cls.title}</h3>
                                    <div className="flex items-center text-xs text-gray-500 dark:text-neutral-400 mt-1">
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

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Curriculum</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
            {lessons.map((lesson) => {
                const isCompleted = completedLessonIds.includes(lesson.id);
                return (
                    <div key={lesson.id} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-6 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors rounded-none shadow-sm group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 border uppercase rounded-none ${
                                        lesson.difficulty === 'Beginner' ? 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10' : 
                                        lesson.difficulty === 'Intermediate' ? 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10' : 
                                        'text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10'
                                    }`}>
                                        {lesson.difficulty}
                                    </span>
                                    {isCompleted && (
                                        <span className="flex items-center text-[10px] font-bold text-green-600 dark:text-green-500">
                                            <CheckCircle2 size={12} className="mr-1" /> Completed
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{lesson.title}</h3>
                            </div>
                            <div className={`w-8 h-8 flex items-center justify-center rounded-none ${isCompleted ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-500' : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-500'}`}>
                                {isCompleted ? <CheckCircle2 size={16} /> : <PlayCircle size={16} />}
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-neutral-400 mb-6 text-sm line-clamp-2">{lesson.description}</p>
                        <button 
                            onClick={() => onStartLesson(lesson)}
                            className={`w-full py-2.5 text-sm font-medium transition-colors rounded-none
                                ${isCompleted 
                                    ? 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700' 
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
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
