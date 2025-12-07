
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, HelpCircle, BookOpen, CheckSquare, XCircle, ArrowRight } from 'lucide-react';
import { Lesson } from '../types';
import CodeEditor from './CodeEditor';
import { gradeCode, getAiAssistance } from '../services/geminiService';
import confetti from 'canvas-confetti';

interface LessonViewProps {
  lesson: Lesson;
  onBack: () => void;
  onComplete: (lessonId: string, score: number) => void;
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
  const [activeTab, setActiveTab] = useState<'learn' | 'quiz'>('learn');
  const [quizAnswers, setQuizAnswers] = useState<{[key: string]: number}>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
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
          onComplete(lesson.id, 100);
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
      
      const percentage = (correctCount / lesson.quiz.length) * 100;
      if (percentage >= 70 || (lesson.quiz.length < 3 && correctCount === lesson.quiz.length)) {
          triggerCelebration();
          onComplete(lesson.id, Math.round(percentage));
      }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="flex-none h-16 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center px-6 justify-between">
        <div className="flex items-center">
            <button 
            onClick={onBack}
            className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg"
            >
            <ArrowLeft size={20} />
            </button>
            <div>
                <h2 className="font-bold text-gray-900 dark:text-white">{lesson.title}</h2>
                <div className="flex items-center text-xs text-gray-500 dark:text-neutral-500">
                    <span className="mr-2">{lesson.difficulty}</span>
                </div>
            </div>
        </div>
        <button 
            onClick={() => setShowAiHelp(!showAiHelp)}
            className="flex items-center px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20 text-sm font-medium transition-colors border border-primary-200 dark:border-primary-500/20 rounded-lg"
        >
            <HelpCircle size={16} className="mr-2" />
            AI Tutor
        </button>
      </header>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Content & Quiz */}
        <div className="w-1/2 lg:w-5/12 flex flex-col border-r border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50">
            <button 
                onClick={() => setActiveTab('learn')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all flex items-center justify-center
                ${activeTab === 'learn' ? 'border-primary-500 text-primary-600 dark:text-white bg-white dark:bg-neutral-800/50' : 'border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800/30'}`}
            >
                <BookOpen size={16} className="mr-2" />
                Lesson
            </button>
            <button 
                onClick={() => setActiveTab('quiz')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all flex items-center justify-center
                ${activeTab === 'quiz' ? 'border-primary-500 text-primary-600 dark:text-white bg-white dark:bg-neutral-800/50' : 'border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800/30'}`}
            >
                <CheckSquare size={16} className="mr-2" />
                Quiz
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'learn' ? (
                <>
                    <div className="prose prose-neutral dark:prose-invert max-w-none">
                        {lesson.content.split('\n').map((line, idx) => {
                            if (line.startsWith('# ')) return <h1 key={idx} className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{line.replace('# ', '')}</h1>
                            if (line.startsWith('### ')) return <h3 key={idx} className="text-xl font-semibold text-primary-600 dark:text-primary-400 mt-8 mb-4">{line.replace('### ', '')}</h3>
                            if (line.startsWith('```')) return null; 
                            if (line.trim().startsWith('print') || line.trim().startsWith('x =') || line.trim().startsWith('def ') || line.trim().startsWith('a =')) {
                                return <pre key={idx} className="bg-gray-100 dark:bg-neutral-900 p-4 border border-gray-200 dark:border-neutral-800 text-sm font-mono text-gray-800 dark:text-neutral-300 my-4 overflow-x-auto rounded-lg">{line}</pre>
                            }
                            if (line.startsWith('* ')) return <li key={idx} className="ml-4 list-disc text-gray-700 dark:text-neutral-300 mb-1">{line.replace('* ', '')}</li>
                            return <p key={idx} className="text-gray-700 dark:text-neutral-300 mb-4 leading-relaxed">{line}</p>
                        })}
                    </div>

                    <div className="mt-10 p-6 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm rounded-xl">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                            <CheckCircle size={18} className="text-primary-500 mr-2" />
                            Your Task
                        </h4>
                        <p className="text-gray-600 dark:text-neutral-300 text-sm">{lesson.task}</p>
                    </div>
                    
                    {aiFeedback && (
                        <div className={`mt-6 p-4 border rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30' : 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30'}`}>
                            <p className="text-sm font-medium mb-1 text-gray-900 dark:text-white">AI Feedback:</p>
                            <p className={`text-sm ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>{aiFeedback}</p>
                            {isCorrect && (
                                <button onClick={onBack} className="mt-3 flex items-center text-sm font-bold text-gray-900 dark:text-white hover:underline">
                                    Return to Dashboard <ArrowRight size={14} className="ml-1"/>
                                </button>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-8">
                    {!lesson.quiz || lesson.quiz.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-neutral-500 mt-10">
                            <CheckSquare size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No quiz available for this lesson.</p>
                        </div>
                    ) : (
                        <>
                            {lesson.quiz.map((q, qIdx) => (
                                <div key={q.id} className="bg-gray-50 dark:bg-neutral-900/50 p-6 border border-gray-200 dark:border-neutral-800 rounded-xl">
                                    <h3 className="text-gray-900 dark:text-white font-medium mb-4 flex items-start">
                                        <span className="text-primary-600 dark:text-primary-500 mr-2">{qIdx + 1}.</span>
                                        {q.question}
                                    </h3>
                                    <div className="space-y-2">
                                        {q.options.map((opt, optIdx) => {
                                            const isSelected = quizAnswers[q.id] === optIdx;
                                            const isCorrectAnswer = q.correctAnswer === optIdx;
                                            
                                            let btnClass = "border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300";
                                            if (quizSubmitted) {
                                                if (isCorrectAnswer) btnClass = "bg-green-100 dark:bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-400";
                                                else if (isSelected && !isCorrectAnswer) btnClass = "bg-red-100 dark:bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-400";
                                                else btnClass = "border-gray-200 dark:border-neutral-800 opacity-50";
                                            } else {
                                                if (isSelected) btnClass = "bg-primary-50 dark:bg-primary-500/20 border-primary-500 text-primary-700 dark:text-primary-400";
                                            }

                                            return (
                                                <button
                                                    key={optIdx}
                                                    disabled={quizSubmitted}
                                                    onClick={() => handleQuizSelect(q.id, optIdx)}
                                                    className={`w-full text-left px-4 py-3 border text-sm transition-all flex justify-between items-center rounded-lg ${btnClass}`}
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
                                    className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-300 dark:disabled:bg-neutral-800 disabled:text-gray-500 dark:disabled:text-neutral-500 text-white font-bold transition-all rounded-lg"
                                >
                                    Submit Quiz
                                </button>
                            ) : (
                                <div className="p-4 bg-gray-100 dark:bg-neutral-800 text-center border border-gray-200 dark:border-neutral-700 rounded-lg">
                                    <p className="text-gray-500 dark:text-neutral-400 mb-1">You scored</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{quizScore} / {lesson.quiz.length}</p>
                                    <div className="flex justify-center gap-4">
                                        <button 
                                            onClick={() => {
                                                setQuizSubmitted(false);
                                                setQuizAnswers({});
                                            }}
                                            className="text-primary-600 dark:text-primary-400 text-sm hover:underline"
                                        >
                                            Retake Quiz
                                        </button>
                                         <button 
                                            onClick={onBack}
                                            className="text-gray-900 dark:text-white text-sm font-bold hover:underline"
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
        <div className="w-1/2 lg:w-7/12 bg-gray-100 dark:bg-neutral-950 p-4 flex flex-col relative">
           <div className="flex-1 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-neutral-800">
             <CodeEditor 
                initialCode={lesson.initialCode} 
                onRun={handleRunCode}
                output={output}
                error={error}
                isCorrect={isCorrect}
                isRunning={isRunning}
             />
           </div>
           
           {/* AI Tutor Overlay */}
           {showAiHelp && (
               <div className="absolute right-6 top-6 w-80 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 shadow-2xl flex flex-col overflow-hidden z-20 rounded-xl">
                   <div className="p-3 bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 flex justify-between items-center">
                       <span className="text-sm font-bold text-gray-900 dark:text-white">Codesphere Tutor</span>
                       <button onClick={() => setShowAiHelp(false)} className="text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white">&times;</button>
                   </div>
                   <div className="p-4 flex-1 max-h-60 overflow-y-auto">
                       {aiAnswer ? (
                           <div className="bg-primary-50 dark:bg-primary-500/10 p-3 text-sm text-gray-800 dark:text-neutral-200 rounded-lg">
                               {aiAnswer}
                           </div>
                       ) : (
                           <p className="text-xs text-gray-500 dark:text-neutral-500 text-center">Ask me anything about this lesson!</p>
                       )}
                   </div>
                   <div className="p-3 border-t border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                       <div className="flex gap-2">
                           <input 
                            type="text" 
                            value={userQuestion}
                            onChange={(e) => setUserQuestion(e.target.value)}
                            placeholder="Ask a question..."
                            className="flex-1 bg-gray-100 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 rounded-lg"
                            onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                           />
                           <button 
                            onClick={handleAskAi}
                            disabled={isAiThinking}
                            className="bg-primary-600 px-3 py-1.5 text-white hover:bg-primary-500 disabled:opacity-50 rounded-lg"
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
