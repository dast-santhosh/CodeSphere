import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, HelpCircle, BookOpen, CheckSquare, XCircle, ArrowRight } from 'lucide-react';
import { Lesson } from '../types';
import CodeEditor from './CodeEditor';
import { gradeCode, getAiAssistance } from '../services/geminiService';
import confetti from 'canvas-confetti';

interface LessonViewProps {
  lesson: Lesson;
  onBack: () => void;
  onComplete: (lessonId: string) => void;
}

const LessonView: React.FC<LessonViewProps> = ({ lesson, onBack, onComplete }) => {
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [aiFeedback, setAiFeedback] = useState('');
  const [showAiHelp, setShowAiHelp] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'learn' | 'quiz'>('learn');
  
  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<{[key: string]: number}>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    // Reset all state when lesson changes
    setOutput('');
    setError('');
    setIsRunning(false);
    setIsCorrect(null);
    setAiFeedback('');
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setActiveTab('learn');
  }, [lesson]);

  const triggerCelebration = () => {
      confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0ea5e9', '#a855f7', '#fbbf24']
      });
  };

  const handleRunCode = async (code: string) => {
    setIsRunning(true);
    setError('');
    setOutput('');
    setAiFeedback('');
    setIsCorrect(null);

    const result = await gradeCode(code, lesson.task);
    
    setIsRunning(false);
    setOutput(result.output);
    
    if (result.error) {
      setError(result.error);
    } else {
      setIsCorrect(result.isCorrect || false);
      if (result.feedback) {
        setAiFeedback(result.feedback);
      }
      
      if (result.isCorrect) {
          triggerCelebration();
          onComplete(lesson.id);
      }
    }
  };

  const handleAskAi = async () => {
    if (!userQuestion.trim()) return;
    setIsAiThinking(true);
    const answer = await getAiAssistance(lesson.content, userQuestion);
    setAiAnswer(answer);
    setIsAiThinking(false);
  };

  const handleQuizSelect = (questionId: string, optionIndex: number) => {
      if (quizSubmitted) return;
      setQuizAnswers(prev => ({...prev, [questionId]: optionIndex}));
  };

  const submitQuiz = () => {
      if (!lesson.quiz) return;
      let correctCount = 0;
      lesson.quiz.forEach(q => {
          if (quizAnswers[q.id] === q.correctAnswer) {
              correctCount++;
          }
      });
      setQuizScore(correctCount);
      setQuizSubmitted(true);
      
      // Mark as complete if score is > 70% or if all correct for small quizzes
      const percentage = correctCount / lesson.quiz.length;
      if (percentage >= 0.7 || (lesson.quiz.length < 3 && correctCount === lesson.quiz.length)) {
          triggerCelebration();
          onComplete(lesson.id);
      }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex-none h-16 border-b border-slate-800 bg-slate-900 flex items-center px-6 justify-between">
        <div className="flex items-center">
            <button 
            onClick={onBack}
            className="mr-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
            <ArrowLeft size={20} />
            </button>
            <div>
                <h2 className="font-bold text-white">{lesson.title}</h2>
                <div className="flex items-center text-xs text-slate-500">
                    <span className="mr-2">{lesson.difficulty}</span>
                </div>
            </div>
        </div>
        <button 
            onClick={() => setShowAiHelp(!showAiHelp)}
            className="flex items-center px-3 py-1.5 bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20 text-sm font-medium transition-colors border border-primary-500/20"
        >
            <HelpCircle size={16} className="mr-2" />
            AI Tutor
        </button>
      </header>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Content & Quiz */}
        <div className="w-1/2 lg:w-5/12 flex flex-col border-r border-slate-800 bg-slate-950">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/50">
            <button 
                onClick={() => setActiveTab('learn')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all flex items-center justify-center
                ${activeTab === 'learn' ? 'border-primary-500 text-white bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'}`}
            >
                <BookOpen size={16} className="mr-2" />
                Lesson
            </button>
            <button 
                onClick={() => setActiveTab('quiz')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all flex items-center justify-center
                ${activeTab === 'quiz' ? 'border-primary-500 text-white bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'}`}
            >
                <CheckSquare size={16} className="mr-2" />
                Quiz
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'learn' ? (
                <>
                    <div className="prose prose-invert prose-slate max-w-none">
                        {/* Simple Markdown Rendering Replacement */}
                        {lesson.content.split('\n').map((line, idx) => {
                            if (line.startsWith('# ')) return <h1 key={idx} className="text-3xl font-bold text-white mb-6">{line.replace('# ', '')}</h1>
                            if (line.startsWith('### ')) return <h3 key={idx} className="text-xl font-semibold text-primary-400 mt-8 mb-4">{line.replace('### ', '')}</h3>
                            if (line.startsWith('```')) return null; 
                            if (line.trim().startsWith('print') || line.trim().startsWith('x =') || line.trim().startsWith('def ') || line.trim().startsWith('a =')) {
                                return <pre key={idx} className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-sm font-mono text-slate-300 my-4 overflow-x-auto">{line}</pre>
                            }
                            if (line.startsWith('* ')) return <li key={idx} className="ml-4 list-disc text-slate-300 mb-1">{line.replace('* ', '')}</li>
                            return <p key={idx} className="text-slate-300 mb-4 leading-relaxed">{line}</p>
                        })}
                    </div>

                    <div className="mt-10 p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-lg">
                        <h4 className="font-bold text-white mb-2 flex items-center">
                            <CheckCircle size={18} className="text-primary-500 mr-2" />
                            Your Task
                        </h4>
                        <p className="text-slate-300 text-sm">{lesson.task}</p>
                    </div>
                    
                    {aiFeedback && (
                        <div className={`mt-6 p-4 rounded-xl border ${isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
                            <p className="text-sm font-medium mb-1 text-white">AI Feedback:</p>
                            <p className={`text-sm ${isCorrect ? 'text-green-400' : 'text-orange-400'}`}>{aiFeedback}</p>
                            {isCorrect && (
                                <button onClick={onBack} className="mt-3 flex items-center text-sm font-bold text-white hover:underline">
                                    Return to Dashboard <ArrowRight size={14} className="ml-1"/>
                                </button>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-8">
                    {!lesson.quiz || lesson.quiz.length === 0 ? (
                        <div className="text-center text-slate-500 mt-10">
                            <CheckSquare size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No quiz available for this lesson.</p>
                        </div>
                    ) : (
                        <>
                            {lesson.quiz.map((q, qIdx) => (
                                <div key={q.id} className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                                    <h3 className="text-white font-medium mb-4 flex items-start">
                                        <span className="text-primary-500 mr-2">{qIdx + 1}.</span>
                                        {q.question}
                                    </h3>
                                    <div className="space-y-2">
                                        {q.options.map((opt, optIdx) => {
                                            const isSelected = quizAnswers[q.id] === optIdx;
                                            const isCorrectAnswer = q.correctAnswer === optIdx;
                                            
                                            let btnClass = "border-slate-700 hover:bg-slate-800 text-slate-300";
                                            if (quizSubmitted) {
                                                if (isCorrectAnswer) btnClass = "bg-green-500/20 border-green-500/50 text-green-400";
                                                else if (isSelected && !isCorrectAnswer) btnClass = "bg-red-500/20 border-red-500/50 text-red-400";
                                                else btnClass = "border-slate-800 opacity-50";
                                            } else {
                                                if (isSelected) btnClass = "bg-primary-500/20 border-primary-500 text-primary-400";
                                            }

                                            return (
                                                <button
                                                    key={optIdx}
                                                    disabled={quizSubmitted}
                                                    onClick={() => handleQuizSelect(q.id, optIdx)}
                                                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all flex justify-between items-center ${btnClass}`}
                                                >
                                                    {opt}
                                                    {quizSubmitted && isCorrectAnswer && <CheckCircle size={16} className="text-green-500" />}
                                                    {quizSubmitted && isSelected && !isCorrectAnswer && <XCircle size={16} className="text-red-500" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            
                            {!quizSubmitted ? (
                                <button 
                                    onClick={submitQuiz}
                                    disabled={Object.keys(quizAnswers).length !== lesson.quiz.length}
                                    className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold transition-all"
                                >
                                    Submit Quiz
                                </button>
                            ) : (
                                <div className="p-4 bg-slate-800 rounded-xl text-center border border-slate-700">
                                    <p className="text-slate-400 mb-1">You scored</p>
                                    <p className="text-2xl font-bold text-white mb-2">{quizScore} / {lesson.quiz.length}</p>
                                    <div className="flex justify-center gap-4">
                                        <button 
                                            onClick={() => {
                                                setQuizSubmitted(false);
                                                setQuizAnswers({});
                                            }}
                                            className="text-primary-400 text-sm hover:underline"
                                        >
                                            Retake Quiz
                                        </button>
                                         <button 
                                            onClick={onBack}
                                            className="text-white text-sm font-bold hover:underline"
                                        >
                                            Return to Dashboard
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
          </div>
        </div>

        {/* Right: Code Editor */}
        <div className="w-1/2 lg:w-7/12 bg-slate-950 p-4 flex flex-col relative">
           <CodeEditor 
            initialCode={lesson.initialCode} 
            onRun={handleRunCode}
            output={output}
            error={error}
            isCorrect={isCorrect}
            isRunning={isRunning}
           />
           
           {/* AI Tutor Overlay */}
           {showAiHelp && (
               <div className="absolute right-6 top-6 w-80 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl flex flex-col overflow-hidden z-20">
                   <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                       <span className="text-sm font-bold text-white">Codesphere Tutor</span>
                       <button onClick={() => setShowAiHelp(false)} className="text-slate-500 hover:text-white">&times;</button>
                   </div>
                   <div className="p-4 flex-1 max-h-60 overflow-y-auto">
                       {aiAnswer ? (
                           <div className="bg-primary-500/10 p-3 rounded-lg text-sm text-slate-200">
                               {aiAnswer}
                           </div>
                       ) : (
                           <p className="text-xs text-slate-500 text-center">Ask me anything about this lesson!</p>
                       )}
                   </div>
                   <div className="p-3 border-t border-slate-700 bg-slate-900">
                       <div className="flex">
                           <input 
                            type="text" 
                            value={userQuestion}
                            onChange={(e) => setUserQuestion(e.target.value)}
                            placeholder="Ask a question..."
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-l-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary-500"
                            onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                           />
                           <button 
                            onClick={handleAskAi}
                            disabled={isAiThinking}
                            className="bg-primary-600 px-3 py-1.5 rounded-r-lg text-white hover:bg-primary-500 disabled:opacity-50"
                           >
                               {isAiThinking ? '...' : 'Ask'}
                           </button>
                       </div>
                   </div>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default LessonView;