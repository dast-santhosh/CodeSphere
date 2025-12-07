
import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Video, Users, Edit, Trash, CheckCircle, XCircle, Clock, ShieldOff, RotateCcw, Search, Calendar, Save } from 'lucide-react';
import { Lesson, User, UserStatus, ScheduledClass } from '../types';
import { db } from '../services/firebase';
import { doc, deleteDoc, updateDoc, collection, onSnapshot, query, setDoc, serverTimestamp } from 'firebase/firestore';

interface AdminDashboardProps {
  lessons: Lesson[];
  scheduledClasses?: ScheduledClass[];
  onCreateLesson: () => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (id: string) => void;
  onStartLiveClass: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  lessons, 
  scheduledClasses = [],
  onCreateLesson, 
  onEditLesson, 
  onDeleteLesson,
  onStartLiveClass
}) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'content' | 'users' | 'schedule'>('content');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'pending' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Class Scheduling State
  const [newClassDate, setNewClassDate] = useState('');
  const [newClassTime, setNewClassTime] = useState('');
  const [newClassTitle, setNewClassTitle] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // Fetch ALL users real-time
  useEffect(() => {
    const q = query(collection(db, "users"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const users: User[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            users.push({
                id: doc.id,
                name: data.name || 'Unknown',
                email: data.email || '',
                role: data.role || 'student',
                status: data.status || 'pending',
                avatar: data.avatar || '',
                completedLessonIds: data.completedLessonIds || [],
                joinedAt: data.joinedAt 
            } as User);
        });

        // Client-side Sort: Newest first
        users.sort((a, b) => {
            const timeA = a.joinedAt?.seconds ? a.joinedAt.seconds : 0;
            const timeB = b.joinedAt?.seconds ? b.joinedAt.seconds : 0;
            return timeB - timeA;
        });

        setAllUsers(users);
    }, (error) => {
        console.error("Error fetching users:", error);
    });
    return () => unsubscribe();
  }, []);

  // -- Stats Calculation --
  const pendingUsers = allUsers.filter(u => u.status === 'pending');
  const pendingCount = pendingUsers.length;
  const activeCount = allUsers.filter(u => u.status === 'active').length;
  const totalStudents = allUsers.length;

  const handleDeleteLesson = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this module?")) {
        try {
            await deleteDoc(doc(db, "lessons", id));
        } catch (e) {
            console.error("Error deleting lesson", e);
            alert("Could not delete lesson.");
        }
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: UserStatus) => {
      try {
          await updateDoc(doc(db, "users", userId), { status: newStatus });
      } catch (error) {
          console.error(`Error updating user status to ${newStatus}:`, error);
          alert("Failed to update status. Check console for details.");
      }
  };

  const handleDeleteUser = async (userId: string) => {
      if (window.confirm("DANGER: This will permanently delete the user's account and all progress. Continue?")) {
          try {
              await deleteDoc(doc(db, "users", userId));
          } catch (error) {
               console.error("Error deleting user:", error);
               alert("Failed to delete user.");
          }
      }
  };
  
  const handleScheduleClass = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsScheduling(true);
      try {
          const classId = Date.now().toString();
          const dateTime = new Date(`${newClassDate}T${newClassTime}`);
          const newClass: ScheduledClass = {
              id: classId,
              title: newClassTitle,
              date: dateTime.toISOString(),
              durationMinutes: 60,
              instructorName: "Apex Instructor"
          };
          
          await setDoc(doc(db, "classes", classId), newClass);
          setNewClassTitle('');
          setNewClassDate('');
          setNewClassTime('');
      } catch (err) {
          console.error("Error scheduling class", err);
          alert("Failed to schedule class");
      } finally {
          setIsScheduling(false);
      }
  };
  
  const handleDeleteClass = async (id: string) => {
      if (window.confirm("Cancel this class?")) {
          await deleteDoc(doc(db, "classes", id));
      }
  };

  const handleGoLive = async () => {
      // Mark room as active before navigating
      try {
          await setDoc(doc(db, "rooms", "main-class"), { 
              active: true, 
              startedAt: serverTimestamp() 
          }, { merge: true });
          onStartLiveClass();
      } catch (e) {
          console.error("Error starting class:", e);
          onStartLiveClass(); // Navigate anyway
      }
  };

  // Filter Users Logic
  const filteredUsers = allUsers.filter(user => {
      const matchesFilter = userFilter === 'all' ? true : user.status === userFilter;
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            user.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
  });

  return (
    <div className="h-full overflow-y-auto bg-slate-950">
        <div className="p-8 max-w-7xl mx-auto pb-20">
        <header className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Admin Control Center</h1>
                <p className="text-slate-400">Manage curriculum, monitor student progress, and schedule classes.</p>
            </div>
            
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button 
                    onClick={() => setActiveTab('content')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${activeTab === 'content' ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' : 'text-slate-500 hover:text-white'}`}
                >
                    <BookOpen size={16} className="mr-2" /> Modules
                </button>
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${activeTab === 'users' ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' : 'text-slate-500 hover:text-white'}`}
                >
                    <Users size={16} className="mr-2" /> Students
                    {pendingCount > 0 && (
                        <span className="ml-2 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {pendingCount}
                        </span>
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('schedule')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${activeTab === 'schedule' ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' : 'text-slate-500 hover:text-white'}`}
                >
                    <Calendar size={16} className="mr-2" /> Live Schedule
                </button>
            </div>
        </header>

        {/* 1. URGENT APPROVAL SECTION */}
        {pendingCount > 0 && (
            <div className="mb-8 bg-slate-900 border border-yellow-500/30 rounded-2xl p-6 shadow-2xl shadow-yellow-500/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white flex items-center">
                        <Clock className="text-yellow-500 mr-2" size={20} />
                        Pending Approvals ({pendingCount})
                    </h2>
                    <button onClick={() => setActiveTab('users')} className="text-sm text-yellow-500 hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                    {pendingUsers.slice(0, 3).map(user => (
                        <div key={user.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <div className="flex items-center">
                                <img src={user.avatar} className="w-8 h-8 rounded-full mr-3" alt=""/>
                                <div>
                                    <div className="text-sm font-bold text-white">{user.name}</div>
                                    <div className="text-xs text-slate-500">{user.email}</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleUpdateStatus(user.id, 'active')} className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-500/30">Approve</button>
                                <button onClick={() => handleUpdateStatus(user.id, 'rejected')} className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-500/30">Reject</button>
                            </div>
                        </div>
                    ))}
                    {pendingCount > 3 && <div className="text-center text-xs text-slate-500">...and {pendingCount - 3} more</div>}
                </div>
            </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><BookOpen size={24} /></div>
                    <span className="text-slate-500 text-xs font-bold uppercase">Modules</span>
                </div>
                <p className="text-3xl font-bold text-white relative z-10">{lessons.length}</p>
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
            </div>
            
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="p-3 bg-green-500/10 rounded-xl text-green-400"><Users size={24} /></div>
                    <span className="text-slate-500 text-xs font-bold uppercase">Active Students</span>
                </div>
                <p className="text-3xl font-bold text-white relative z-10">{activeCount}</p>
                 <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400"><Clock size={24} /></div>
                    <span className="text-slate-500 text-xs font-bold uppercase">Pending</span>
                </div>
                <p className="text-3xl font-bold text-white relative z-10">{pendingCount}</p>
                 <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 cursor-pointer hover:border-red-500/50 transition-all group relative overflow-hidden" onClick={handleGoLive}>
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="p-3 bg-red-500/10 rounded-xl text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors"><Video size={24} /></div>
                    <span className="text-slate-500 text-xs font-bold uppercase group-hover:text-white/70">Instant Live</span>
                </div>
                <p className="text-lg font-bold text-white flex items-center relative z-10">
                    Start Session <span className="ml-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                </p>
            </div>
        </div>

        {/* Existing Tab Content Logic... */}
        {activeTab === 'content' && (
            <>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Course Curriculum</h2>
                    <button 
                        onClick={onCreateLesson}
                        className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-lg shadow-primary-500/20 transition-all text-sm"
                    >
                        <Plus size={16} className="mr-2" />
                        Create Module
                    </button>
                </div>
                
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-5 font-semibold">Module Title</th>
                                <th className="p-5 font-semibold">Level</th>
                                <th className="p-5 font-semibold">Topics</th>
                                <th className="p-5 font-semibold">Test Qs</th>
                                <th className="p-5 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {lessons.map(lesson => (
                                <tr key={lesson.id} className="hover:bg-slate-800/40 transition-colors group">
                                    <td className="p-5 text-white font-medium">
                                        {lesson.title}
                                    </td>
                                    <td className="p-5">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                                            lesson.difficulty === 'Beginner' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                            lesson.difficulty === 'Intermediate' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                            {lesson.difficulty}
                                        </span>
                                    </td>
                                    <td className="p-5 text-slate-400 text-sm">
                                        <div className="flex flex-wrap gap-1">
                                            {lesson.topics.slice(0, 2).map(t => (
                                                <span key={t} className="bg-slate-800 px-2 py-0.5 rounded text-xs">{t}</span>
                                            ))}
                                            {lesson.topics.length > 2 && <span className="text-xs self-center">+{lesson.topics.length - 2}</span>}
                                        </div>
                                    </td>
                                    <td className="p-5 text-slate-400 text-sm">
                                        {lesson.quiz?.length || 0}
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => onEditLesson(lesson)}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                title="Edit Module"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteLesson(lesson.id)}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete Module"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {lessons.length === 0 && (
                        <div className="p-10 text-center text-slate-500">
                            No modules found. Click "Create Module" to start building your curriculum.
                        </div>
                    )}
                </div>
            </>
        )}

        {/* ... Users Tab (Same as before) ... */}
        {activeTab === 'users' && (
            <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-xl font-bold text-white">Student Directory</h2>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Search students..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:border-primary-500 outline-none w-full sm:w-64"
                            />
                        </div>
                        <select 
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value as any)}
                            className="bg-slate-900 border border-slate-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-primary-500"
                        >
                            <option value="all">All Students ({totalStudents})</option>
                            <option value="pending">Pending ({pendingCount})</option>
                            <option value="active">Active ({activeCount})</option>
                            <option value="rejected">Banned/Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-5 font-semibold">Student</th>
                                <th className="p-5 font-semibold">Status</th>
                                <th className="p-5 font-semibold">Progress</th>
                                <th className="p-5 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 mr-3 overflow-hidden border border-slate-700">
                                                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">{user.name}</div>
                                                <div className="text-slate-500 text-xs">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border uppercase tracking-wide flex w-fit items-center ${
                                            user.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                            user.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                            {user.status === 'active' && <CheckCircle size={10} className="mr-1.5" />}
                                            {user.status === 'pending' && <Clock size={10} className="mr-1.5" />}
                                            {user.status === 'rejected' && <ShieldOff size={10} className="mr-1.5" />}
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="p-5 text-slate-400 text-sm">
                                        <div className="flex items-center">
                                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full w-24 mr-2 overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary-500 rounded-full" 
                                                    style={{ width: `${lessons.length > 0 ? (user.completedLessonIds.length / lessons.length) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-mono">{user.completedLessonIds.length}/{lessons.length}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {user.status === 'pending' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleUpdateStatus(user.id, 'active')}
                                                        className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg transition-colors"
                                                        title="Approve User"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateStatus(user.id, 'rejected')}
                                                        className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 p-2 rounded-lg transition-colors"
                                                        title="Reject User"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </>
                                            )}
                                            
                                            {user.status === 'active' && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(user.id, 'rejected')}
                                                    className="bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 p-2 rounded-lg transition-colors"
                                                    title="Suspend/Ban User"
                                                >
                                                    <ShieldOff size={16} />
                                                </button>
                                            )}

                                            {user.status === 'rejected' && (
                                                 <button 
                                                    onClick={() => handleUpdateStatus(user.id, 'active')}
                                                    className="bg-slate-800 hover:bg-green-900/30 text-slate-400 hover:text-green-400 p-2 rounded-lg transition-colors"
                                                    title="Reactivate User"
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                            )}

                                            <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white p-2 rounded-lg transition-colors ml-2"
                                                title="Delete User Permanently"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </>
        )}
        
        {/* ... Schedule Tab (Same as before) ... */}
        {activeTab === 'schedule' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Schedule Form */}
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 h-fit">
                    <h2 className="text-xl font-bold text-white mb-6">Schedule Class</h2>
                    <form onSubmit={handleScheduleClass} className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Class Topic</label>
                            <input 
                                type="text"
                                required
                                value={newClassTitle}
                                onChange={e => setNewClassTitle(e.target.value)}
                                placeholder="e.g. Advanced Python Functions"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-primary-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm text-slate-400 mb-1">Date</label>
                                <input 
                                    type="date"
                                    required
                                    value={newClassDate}
                                    onChange={e => setNewClassDate(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Time</label>
                                <input 
                                    type="time"
                                    required
                                    value={newClassTime}
                                    onChange={e => setNewClassTime(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-primary-500"
                                />
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isScheduling}
                            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-xl mt-4"
                        >
                            {isScheduling ? 'Scheduling...' : 'Schedule Class'}
                        </button>
                    </form>
                </div>
                
                {/* Upcoming List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-white mb-2">Upcoming Sessions</h2>
                    {scheduledClasses.length === 0 ? (
                        <div className="text-center p-10 bg-slate-900 rounded-2xl border border-slate-800 text-slate-500">
                            No classes scheduled.
                        </div>
                    ) : (
                        scheduledClasses.map(cls => (
                            <div key={cls.id} className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center mb-1">
                                        <Calendar size={16} className="text-primary-500 mr-2" />
                                        <span className="text-primary-400 text-sm font-bold">
                                            {new Date(cls.date).toLocaleDateString()} at {new Date(cls.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white">{cls.title}</h3>
                                    <p className="text-sm text-slate-500">Instructor: {cls.instructorName}</p>
                                </div>
                                <button 
                                    onClick={() => handleDeleteClass(cls.id)}
                                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}
        </div>
    </div>
  );
};

export default AdminDashboard;
