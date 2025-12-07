
import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Video, Users, Edit, Trash, CheckCircle, XCircle, Clock, ShieldOff, RotateCcw, Search, MoreVertical } from 'lucide-react';
import { Lesson, User, UserStatus } from '../types';
import { db } from '../services/firebase';
import { doc, deleteDoc, updateDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';

interface AdminDashboardProps {
  lessons: Lesson[];
  onCreateLesson: () => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (id: string) => void;
  onStartLiveClass: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  lessons, 
  onCreateLesson, 
  onEditLesson, 
  onDeleteLesson,
  onStartLiveClass
}) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'content' | 'users'>('content');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'pending' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch ALL users real-time
  useEffect(() => {
    // Order by joinedAt desc to see newest users first
    const q = query(collection(db, "users"), orderBy("joinedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const users: User[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Skip showing the admin themselves in the list to prevent accidents
            if (data.role === 'admin') return;

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
        setAllUsers(users);
    }, (error) => {
        console.error("Error fetching users:", error);
    });
    return () => unsubscribe();
  }, []);

  // -- Stats Calculation --
  const pendingCount = allUsers.filter(u => u.status === 'pending').length;
  const activeCount = allUsers.filter(u => u.status === 'active').length;
  const totalStudents = allUsers.length;

  const handleDeleteLesson = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this lesson?")) {
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
          alert("Failed to update status.");
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
                <p className="text-slate-400">Manage curriculum, monitor student progress, and control access.</p>
            </div>
            
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button 
                    onClick={() => setActiveTab('content')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${activeTab === 'content' ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' : 'text-slate-500 hover:text-white'}`}
                >
                    <BookOpen size={16} className="mr-2" /> Curriculum
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
            </div>
        </header>

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
                    <span className="text-slate-500 text-xs font-bold uppercase">Pending Approval</span>
                </div>
                <p className="text-3xl font-bold text-white relative z-10">{pendingCount}</p>
                 <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 cursor-pointer hover:border-red-500/50 transition-all group relative overflow-hidden" onClick={onStartLiveClass}>
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="p-3 bg-red-500/10 rounded-xl text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors"><Video size={24} /></div>
                    <span className="text-slate-500 text-xs font-bold uppercase group-hover:text-white/70">Live Room</span>
                </div>
                <p className="text-lg font-bold text-white flex items-center relative z-10">
                    Start Session <span className="ml-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                </p>
            </div>
        </div>

        {activeTab === 'content' ? (
            <>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Course Curriculum</h2>
                    <button 
                        onClick={onCreateLesson}
                        className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-lg shadow-primary-500/20 transition-all text-sm"
                    >
                        <Plus size={16} className="mr-2" />
                        New Lesson
                    </button>
                </div>
                
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-5 font-semibold">Lesson Title</th>
                                <th className="p-5 font-semibold">Level</th>
                                <th className="p-5 font-semibold">Topics</th>
                                <th className="p-5 font-semibold">Quiz</th>
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
                                        {lesson.quiz?.length || 0} Qs
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => onEditLesson(lesson)}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                title="Edit Lesson"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteLesson(lesson.id)}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete Lesson"
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
                            No lessons found. Click "New Lesson" to start building your curriculum.
                        </div>
                    )}
                </div>
            </>
        ) : (
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
                    {filteredUsers.length === 0 && (
                        <div className="p-10 text-center text-slate-500">
                            No users found matching your filter.
                        </div>
                    )}
                </div>
            </>
        )}
        </div>
    </div>
  );
};

export default AdminDashboard;
    