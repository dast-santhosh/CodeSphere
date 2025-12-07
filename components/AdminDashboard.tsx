import React from 'react';
import { Plus, BookOpen, Video, Users, Edit, Trash, BarChart } from 'lucide-react';
import { Lesson } from '../types';
import { db } from '../services/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

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

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this lesson?")) {
        try {
            await deleteDoc(doc(db, "lessons", id));
        } catch (e) {
            console.error("Error deleting lesson", e);
            alert("Could not delete lesson.");
        }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <header className="flex justify-between items-end mb-10">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Instructor Dashboard</h1>
            <p className="text-slate-400">Manage curriculum, quizzes, and live sessions.</p>
        </div>
        <button 
            onClick={onCreateLesson}
            className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl font-medium flex items-center shadow-lg shadow-primary-500/20 transition-all"
        >
            <Plus size={20} className="mr-2" />
            Create Lesson
        </button>
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
                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400"><Users size={24} /></div>
                <span className="text-slate-500 text-sm">Active Students</span>
            </div>
            <p className="text-3xl font-bold text-white">24</p>
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

      <h2 className="text-xl font-bold text-white mb-6">Course Curriculum</h2>
      
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
                                    onClick={() => handleDelete(lesson.id)}
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
    </div>
  );
};

export default AdminDashboard;