
import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Video, Users, Edit, Trash, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Lesson, User } from '../types';
import { db } from '../services/firebase';
import { doc, deleteDoc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';

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
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'content' | 'users'>('content');

  // Listen for pending users
  useEffect(() => {
    const q = query(collection(db, "users"), where("status", "==", "pending"));
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
                completedLessonIds: data.completedLessonIds || []
            } as User);
        });
        setPendingUsers(users);
    });
    return () => unsubscribe();
  }, []);

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

  const handleApproveUser = async (userId: string) => {
      try {
          await updateDoc(doc(db, "users", userId), { status: 'active' });
      } catch (error) {
          console.error("Error approving user:", error);
          alert("Failed to approve user.");
      }
  };

  const handleRejectUser = async (userId: string) => {
      if (window.confirm("Reject this user? They will not be able to access the course.")) {
          try {
              await updateDoc(doc(db, "users", userId), { status: 'rejected' });
          } catch (error) {
              console.error("Error rejecting user:", error);
          }
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <header className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Instructor Dashboard</h1>
            <p className="text-slate-400">Manage curriculum, quizzes, and live sessions.</p>
        </div>
        
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button 
                onClick={() => setActiveTab('content')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'content' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
            >
                Curriculum
            </button>
            <button 
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${activeTab === 'users' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
            >
                Enrollments
                {pendingUsers.length > 0 && (
                    <span className="ml-2 bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {pendingUsers.length}
                    </span>
                )}
            </button>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><BookOpen size={24} /></div>
                <span className="text-slate-500 text-sm">Total Lessons</span>
            </div>
            <p className="text-3xl font-bold text-white">{lessons.length}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400"><Clock size={24} /></div>
                <span className="text-slate-500 text-sm">Pending Approval</span>
            </div>
            <p className="text-3xl font-bold text-white">{pendingUsers.length}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 cursor-pointer hover:border-red-500/50 transition-colors" onClick={onStartLiveClass}>
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-500/10 rounded-xl text-red-400"><Video size={24} /></div>
                <span className="text-slate-500 text-sm">Live Class</span>
            </div>
            <p className="text-lg font-bold text-white flex items-center">
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
                    Create Lesson
                </button>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-semibold">Title</th>
                            <th className="p-4 font-semibold">Difficulty</th>
                            <th className="p-4 font-semibold">Topics</th>
                            <th className="p-4 font-semibold">Quiz Qs</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {lessons.map(lesson => (
                            <tr key={lesson.id} className="hover:bg-slate-800/50 transition-colors group">
                                <td className="p-4 text-white font-medium">{lesson.title}</td>
                                <td className="p-4">
                                    <span className={`text-xs px-2 py-1 rounded-full border ${
                                        lesson.difficulty === 'Beginner' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                        lesson.difficulty === 'Intermediate' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                                        'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}>
                                        {lesson.difficulty}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-400 text-sm">
                                    {lesson.topics.slice(0, 3).join(', ')}
                                    {lesson.topics.length > 3 && '...'}
                                </td>
                                <td className="p-4 text-slate-400 text-sm">
                                    {lesson.quiz?.length || 0} Questions
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => onEditLesson(lesson)}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                                            title="Edit Lesson"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteLesson(lesson.id)}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg"
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
            </div>
        </>
      ) : (
        <>
            <h2 className="text-xl font-bold text-white mb-6">Pending Enrollment Requests</h2>
            {pendingUsers.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                        <Users size={32} />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">No Pending Requests</h3>
                    <p className="text-slate-400">All student accounts have been processed.</p>
                </div>
            ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 font-semibold">Student Name</th>
                                <th className="p-4 font-semibold">Email</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {pendingUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 flex items-center">
                                        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full bg-slate-800 mr-3" />
                                        <span className="text-white font-medium">{user.name}</span>
                                    </td>
                                    <td className="p-4 text-slate-400 text-sm">
                                        {user.email}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button 
                                                onClick={() => handleRejectUser(user.id)}
                                                className="text-slate-500 hover:text-red-400 text-sm font-medium transition-colors"
                                            >
                                                Reject
                                            </button>
                                            <button 
                                                onClick={() => handleApproveUser(user.id)}
                                                className="bg-primary-600 hover:bg-primary-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center shadow-lg shadow-primary-500/20"
                                            >
                                                <CheckCircle size={14} className="mr-1.5" /> Approve
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
