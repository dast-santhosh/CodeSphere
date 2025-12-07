
import React, { useState } from 'react';
import { User, Lesson } from '../types';
import { auth, db } from '../services/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Camera, Save, X, LogOut, Award, Zap, BookOpen, Clock, Activity, CheckSquare } from 'lucide-react';

interface UserProfileProps {
  user: User;
  lessons: Lesson[];
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, lessons, onLogout, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (auth.currentUser) {
        // Update Auth Profile
        await updateProfile(auth.currentUser, {
          displayName: name,
          photoURL: avatar
        });

        // Update Firestore User Document
        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, {
          name: name,
          avatar: avatar 
        });
        
        // Update Local State in App
        onUpdateUser({ ...user, name, avatar });
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`);
  };

  // --- Calculate Statistics ---

  // 1. Completion Counts
  const completedCount = user.completedLessonIds ? user.completedLessonIds.length : 0;
  const progressPercentage = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  
  // 2. Find completed lessons details
  const completedLessonsList = lessons.filter(l => user.completedLessonIds.includes(l.id));

  // 3. Calculate Streak
  let streak = 0;
  if (user.progress) {
      // Get all unique dates (YYYY-MM-DD)
      const dates = new Set<string>();
      Object.values(user.progress).forEach(p => {
          if (p.completedAt) {
              dates.add(p.completedAt.split('T')[0]);
          }
      });
      
      const sortedDates = Array.from(dates).sort();
      if (sortedDates.length > 0) {
          // Check from yesterday/today backwards
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          
          const lastActive = sortedDates[sortedDates.length - 1];
          if (lastActive === today || lastActive === yesterday) {
              streak = 1;
              let currentDate = new Date(lastActive);
              
              for (let i = sortedDates.length - 2; i >= 0; i--) {
                  const prevDate = new Date(sortedDates[i]);
                  const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                  
                  if (diffDays === 1) {
                      streak++;
                      currentDate = prevDate;
                  } else {
                      break;
                  }
              }
          }
      }
  }

  // 4. Calculate Quizzes Passed (Score >= 70)
  let quizzesPassed = 0;
  if (user.progress) {
      Object.values(user.progress).forEach(p => {
          if (p.score !== undefined && p.score >= 70) {
              quizzesPassed++;
          }
      });
  }

  const stats = [
    { label: 'Lessons Completed', value: `${completedCount}`, total: lessons.length, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Quizzes Passed', value: `${quizzesPassed}`, icon: Award, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Current Streak', value: `${streak} Day${streak !== 1 ? 's' : ''}`, icon: Zap, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { label: 'Time Spent', value: `${completedCount * 1.5}h`, icon: Clock, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  return (
      <div className="h-full overflow-y-auto">
        <div className="p-6 lg:p-10 max-w-6xl mx-auto pb-20">
            <h1 className="text-3xl font-bold text-white mb-8">My Profile</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: User Details */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col items-center relative overflow-hidden shadow-lg">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary-900/20 to-transparent"></div>
                        
                        <div className="relative mb-6 group z-10">
                            <div className="w-32 h-32 rounded-full border-4 border-slate-800 overflow-hidden bg-slate-800 shadow-xl">
                                <img src={isEditing ? avatar : user.avatar} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                            {isEditing && (
                                <button 
                                    onClick={regenerateAvatar}
                                    className="absolute bottom-0 right-0 p-2 bg-slate-700 hover:bg-primary-600 rounded-full text-white shadow-lg transition-colors border border-slate-900"
                                    title="Generate New Avatar"
                                >
                                    <Camera size={16} />
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="w-full space-y-4 z-10">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold ml-1">Display Name</label>
                                    <input 
                                        type="text" 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white mt-1 focus:border-primary-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold ml-1">Avatar URL</label>
                                    <input 
                                        type="text" 
                                        value={avatar} 
                                        onChange={(e) => setAvatar(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-400 text-sm mt-1 focus:border-primary-500 outline-none"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button 
                                        onClick={handleSave}
                                        disabled={isLoading}
                                        className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg font-medium flex items-center justify-center transition-colors"
                                    >
                                        {isLoading ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> : <><Save size={16} className="mr-2" /> Save</>}
                                    </button>
                                    <button 
                                        onClick={() => { setIsEditing(false); setName(user.name); setAvatar(user.avatar || ''); }}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center w-full z-10">
                                <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
                                <p className="text-slate-500 mb-4">{user.email}</p>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-400 mb-8">
                                    {user.role} Account
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors border border-slate-700"
                                    >
                                        Edit Profile
                                    </button>
                                    <button 
                                        onClick={onLogout}
                                        className="py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl font-medium transition-colors flex items-center justify-center"
                                    >
                                        <LogOut size={18} className="mr-2" /> Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Statistics */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                            <Activity size={20} className="mr-2 text-primary-500" />
                            Learning Statistics
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {stats.map((stat, idx) => (
                                <div key={idx} className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex items-center hover:border-slate-700 transition-colors">
                                    <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} mr-4`}>
                                        <stat.icon size={24} />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                                        <div className="flex items-end">
                                            <p className="text-2xl font-bold text-white leading-none mt-1">{stat.value}</p>
                                            {stat.total && <span className="text-slate-500 text-sm ml-1">/ {stat.total}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-6">Recent Achievements</h3>
                        {completedLessonsList.length > 0 ? (
                            <div className="space-y-4">
                                {completedLessonsList.slice(0, 5).map((lesson, i) => {
                                    const score = user.progress?.[lesson.id]?.score;
                                    return (
                                    <div key={i} className="flex items-center p-3 hover:bg-slate-800/50 rounded-lg transition-colors border border-transparent hover:border-slate-800">
                                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mr-4">
                                            <CheckSquare size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-slate-300 text-sm font-medium">Completed: <span className="text-white">{lesson.title}</span></p>
                                            <p className="text-xs text-slate-500">You mastered {lesson.topics.join(', ')}</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-400">Done</span>
                                            {score !== undefined && <span className="text-[10px] text-primary-400 mt-1">Score: {score}%</span>}
                                        </div>
                                    </div>
                                )})}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <p>You haven't completed any lessons yet.</p>
                                <p className="text-sm">Start your first lesson to see your progress here!</p>
                            </div>
                        )}
                    
                    </div>
                </div>
            </div>
        </div>
      </div>
  );
};

export default UserProfile;
