
import React, { useState } from 'react';
import { Save, Plus, Trash2, CheckSquare, Code, FileText, ArrowLeft } from 'lucide-react';
import { Lesson, Difficulty, QuizQuestion } from '../types';
import { db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface LessonEditorProps {
  onSave: () => void;
  onCancel: () => void;
  initialData?: Lesson | null;
}

const LessonEditor: React.FC<LessonEditorProps> = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState<Lesson>(initialData || {
    id: Date.now().toString(),
    title: '',
    description: '',
    difficulty: Difficulty.Beginner,
    content: '# New Lesson\n\nIntroduction...',
    initialCode: '# Write your code here\n',
    task: '',
    topics: [],
    quiz: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [topicInput, setTopicInput] = useState('');

  const handleSaveToDb = async () => {
    setIsSaving(true);
    try {
        const lessonRef = doc(db, "lessons", formData.id);
        await setDoc(lessonRef, formData);
        onSave();
    } catch (error) {
        console.error("Error saving lesson: ", error);
        alert("Failed to save lesson.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleAddTopic = () => {
    if (topicInput.trim()) {
      setFormData({ ...formData, topics: [...formData.topics, topicInput.trim()] });
      setTopicInput('');
    }
  };

  const removeTopic = (index: number) => {
    const newTopics = [...formData.topics];
    newTopics.splice(index, 1);
    setFormData({ ...formData, topics: newTopics });
  };

  const addQuizQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    };
    setFormData({ ...formData, quiz: [...(formData.quiz || []), newQuestion] });
  };

  const updateQuizQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const newQuiz = [...(formData.quiz || [])];
    newQuiz[index] = { ...newQuiz[index], [field]: value };
    setFormData({ ...formData, quiz: newQuiz });
  };

  const updateQuizOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuiz = [...(formData.quiz || [])];
    const newOptions = [...newQuiz[qIndex].options];
    newOptions[oIndex] = value;
    newQuiz[qIndex] = { ...newQuiz[qIndex], options: newOptions };
    setFormData({ ...formData, quiz: newQuiz });
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950 overflow-hidden">
      <div className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-900">
        <div className="flex items-center">
            <button onClick={onCancel} className="mr-4 p-2 hover:bg-neutral-800 text-neutral-400">
                <ArrowLeft size={20} />
            </button>
            <h2 className="text-lg font-bold text-white">
                {initialData ? 'Edit Lesson' : 'Create New Lesson'}
            </h2>
        </div>
        <button 
            onClick={handleSaveToDb}
            disabled={isSaving}
            className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-neutral-700 text-white font-medium transition-colors"
        >
            {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin mr-2"></div>
            ) : (
                <Save size={18} className="mr-2" />
            )}
            Save Lesson
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full space-y-8">
        <div className="bg-neutral-900 p-6 border border-neutral-800 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center mb-4">
                <FileText size={20} className="mr-2 text-primary-500" />
                Lesson Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Title</label>
                    <input 
                        type="text" 
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-neutral-950 border border-neutral-700 px-4 py-2 text-white focus:border-primary-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Difficulty</label>
                    <select 
                        value={formData.difficulty}
                        onChange={e => setFormData({...formData, difficulty: e.target.value as Difficulty})}
                        className="w-full bg-neutral-950 border border-neutral-700 px-4 py-2 text-white focus:border-primary-500 outline-none"
                    >
                        <option value={Difficulty.Beginner}>Beginner</option>
                        <option value={Difficulty.Intermediate}>Intermediate</option>
                        <option value={Difficulty.Advanced}>Advanced</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Description</label>
                <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-neutral-950 border border-neutral-700 px-4 py-2 text-white focus:border-primary-500 outline-none h-20 resize-none"
                />
            </div>

             <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Topics</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                    {formData.topics.map((t, idx) => (
                        <span key={idx} className="bg-neutral-800 text-xs px-2 py-1 border border-neutral-700 flex items-center text-neutral-300">
                            {t}
                            <button onClick={() => removeTopic(idx)} className="ml-2 hover:text-red-400"><Trash2 size={12} /></button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={topicInput}
                        onChange={e => setTopicInput(e.target.value)}
                        placeholder="Add a topic (e.g., loops)"
                        className="flex-1 bg-neutral-950 border border-neutral-700 px-4 py-2 text-white text-sm focus:border-primary-500 outline-none"
                        onKeyDown={e => e.key === 'Enter' && handleAddTopic()}
                    />
                    <button onClick={handleAddTopic} className="bg-neutral-800 px-4 py-2 text-white text-sm hover:bg-neutral-700">Add</button>
                </div>
            </div>
        </div>

        <div className="bg-neutral-900 p-6 border border-neutral-800 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center mb-4">
                <Code size={20} className="mr-2 text-primary-500" />
                Content & Code
            </h3>

            <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Lesson Content (Markdown)</label>
                <textarea 
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    className="w-full bg-neutral-950 border border-neutral-700 px-4 py-2 text-white focus:border-primary-500 outline-none h-64 font-mono text-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Initial Code for Student</label>
                    <textarea 
                        value={formData.initialCode}
                        onChange={e => setFormData({...formData, initialCode: e.target.value})}
                        className="w-full bg-neutral-950 border border-neutral-700 px-4 py-2 text-white focus:border-primary-500 outline-none h-40 font-mono text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Task Description (for Auto-Grader)</label>
                    <textarea 
                        value={formData.task}
                        onChange={e => setFormData({...formData, task: e.target.value})}
                        className="w-full bg-neutral-950 border border-neutral-700 px-4 py-2 text-white focus:border-primary-500 outline-none h-40 text-sm"
                    />
                </div>
            </div>
        </div>

        <div className="bg-neutral-900 p-6 border border-neutral-800 space-y-4">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                    <CheckSquare size={20} className="mr-2 text-primary-500" />
                    Quiz Questions
                </h3>
                <button 
                    onClick={addQuizQuestion}
                    className="text-xs bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 flex items-center transition-colors"
                >
                    <Plus size={14} className="mr-1" /> Add Question
                </button>
            </div>

            {(formData.quiz || []).map((q, qIdx) => (
                <div key={q.id} className="bg-neutral-950 border border-neutral-800 p-4 relative">
                    <button 
                        onClick={() => {
                            const newQuiz = [...(formData.quiz || [])];
                            newQuiz.splice(qIdx, 1);
                            setFormData({...formData, quiz: newQuiz});
                        }}
                        className="absolute top-2 right-2 text-neutral-600 hover:text-red-500"
                    >
                        <Trash2 size={16} />
                    </button>
                    
                    <div className="mb-3">
                        <label className="text-xs text-neutral-500 uppercase font-bold">Question {qIdx + 1}</label>
                        <input 
                            type="text" 
                            value={q.question}
                            onChange={e => updateQuizQuestion(qIdx, 'question', e.target.value)}
                            className="w-full bg-neutral-900 border-b border-neutral-700 px-0 py-2 text-white focus:border-primary-500 outline-none"
                            placeholder="Enter question here..."
                        />
                    </div>

                    <div className="space-y-2">
                        {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center">
                                <input 
                                    type="radio" 
                                    name={`correct-${q.id}`}
                                    checked={q.correctAnswer === oIdx}
                                    onChange={() => updateQuizQuestion(qIdx, 'correctAnswer', oIdx)}
                                    className="mr-3 accent-primary-500"
                                />
                                <input 
                                    type="text"
                                    value={opt}
                                    onChange={e => updateQuizOption(qIdx, oIdx, e.target.value)}
                                    className="flex-1 bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-sm text-neutral-300 focus:border-primary-500 outline-none"
                                    placeholder={`Option ${oIdx + 1}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default LessonEditor;
