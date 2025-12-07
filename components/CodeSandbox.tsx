
import React, { useState, useEffect } from 'react';
import CodeEditor from './CodeEditor';
import { executePythonCode } from '../services/geminiService';
import { Save, Trash2, Check, Download, RotateCcw } from 'lucide-react';

const DEFAULT_CODE = `# Welcome to the Apex Code Labs Sandbox!
# Experiment with Python code here.

def fibonacci(n):
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)

print("Fibonacci sequence:")
for i in range(10):
    print(fibonacci(i))
`;

const CodeSandbox: React.FC = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedCode = localStorage.getItem('apex_sandbox_code');
    if (savedCode) {
      setCode(savedCode);
    }
  }, []);

  const handleRun = async (codeToRun: string) => {
    setIsRunning(true);
    setOutput('');
    setError('');
    
    const result = await executePythonCode(codeToRun);
    
    setIsRunning(false);
    if (result.error) {
      setError(result.error);
    } else {
      setOutput(result.output);
    }
  };

  const handleSave = () => {
    localStorage.setItem('apex_sandbox_code', code);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear your code? This cannot be undone.")) {
      setCode('');
      localStorage.removeItem('apex_sandbox_code');
      setOutput('');
      setError('');
    }
  };

  const handleReset = () => {
     if (window.confirm("Reset to default example code?")) {
        setCode(DEFAULT_CODE);
     }
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6 bg-slate-950">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-white mb-1">Python Sandbox</h1>
            <p className="text-slate-400 text-sm">Write, execute, and save your Python experiments.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
            <button 
                onClick={handleSave}
                className="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-all border border-transparent hover:border-slate-600"
                title="Save to Browser Storage"
            >
                {saveStatus === 'saved' ? (
                    <><Check size={16} className="mr-2 text-green-500" /> Saved</>
                ) : (
                    <><Save size={16} className="mr-2" /> Save</>
                )}
            </button>
            <div className="w-px h-5 bg-slate-700 mx-1"></div>
            <button 
                onClick={handleReset}
                className="flex items-center px-3 py-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-sm font-medium transition-all"
                title="Reset to Example"
            >
                <RotateCcw size={16} />
            </button>
            <button 
                onClick={handleClear}
                className="flex items-center px-3 py-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg text-sm font-medium transition-all"
                title="Clear All Code"
            >
                <Trash2 size={16} />
            </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <CodeEditor 
            initialCode={code} 
            onChange={(newCode) => setCode(newCode)}
            onRun={handleRun}
            output={output}
            error={error}
            isRunning={isRunning}
        />
      </div>
    </div>
  );
};

export default CodeSandbox;
