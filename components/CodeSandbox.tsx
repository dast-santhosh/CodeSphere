import React, { useState } from 'react';
import CodeEditor from './CodeEditor';
import { executePythonCode } from '../services/geminiService';

const CodeSandbox: React.FC = () => {
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const initialCode = `# Welcome to the CodeSphere Sandbox!
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

  const handleRun = async (code: string) => {
    setIsRunning(true);
    setOutput('');
    setError('');
    
    // Simulate slight network delay for realism if Gemini is super fast
    const result = await executePythonCode(code);
    
    setIsRunning(false);
    if (result.error) {
      setError(result.error);
    } else {
      setOutput(result.output);
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">Python Sandbox</h1>
        <p className="text-slate-400">Write and execute Python code in a safe environment.</p>
      </div>
      <div className="flex-1">
        <CodeEditor 
            initialCode={initialCode} 
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