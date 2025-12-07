
import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Terminal, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CodeEditorProps {
  initialCode: string;
  onRun?: (code: string) => void;
  onChange?: (code: string) => void;
  output?: string;
  error?: string;
  isCorrect?: boolean | null;
  isRunning?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ initialCode, onRun, onChange, output, error, isCorrect, isRunning }) => {
  const [code, setCode] = useState(initialCode);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setCode(val);
      if (onChange) onChange(val);
  };

  // Sync scroll between textarea and syntax highlighter
  const handleScroll = () => {
      if (textareaRef.current && preRef.current) {
          preRef.current.scrollTop = textareaRef.current.scrollTop;
          preRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);
      if (onChange) onChange(newCode);
      
      // Request animation frame to set cursor position after render
      requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = start + 4;
      });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      onRun && onRun(code);
    }
  };

  // Simple Regex-based Syntax Highlighting for Python
  const getHighlightedCode = (code: string) => {
      let highlighted = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // 1. Strings (Green in IDLE) - Single and Double Quotes
      highlighted = highlighted.replace(/('.*?'|".*?")/g, '<span class="text-green-400">$1</span>');

      // 2. Comments (Red in IDLE)
      highlighted = highlighted.replace(/(#.*)/g, '<span class="text-red-400 italic">$1</span>');

      // 3. Keywords (Orange in IDLE)
      const keywords = /\b(def|class|return|if|else|elif|while|for|in|try|except|import|from|as|pass|break|continue|and|or|not|is|None|True|False)\b/g;
      highlighted = highlighted.replace(keywords, '<span class="text-orange-400 font-bold">$1</span>');

      // 4. Built-ins / Functions (Purple in IDLE)
      const builtins = /\b(print|len|range|int|str|float|list|dict|set|input|open|type|super)\b/g;
      highlighted = highlighted.replace(builtins, '<span class="text-purple-400">$1</span>');

      // 5. Numbers (Blueish)
      highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-blue-400">$1</span>');

      return highlighted;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-none rounded-none md:rounded-xl shadow-inner overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 z-20">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
          </div>
          <span className="ml-4 text-xs font-mono text-slate-400">main.py</span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => {
                setCode(initialCode);
                if(onChange) onChange(initialCode);
            }}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Reset Code"
          >
            <RotateCcw size={16} />
          </button>
          <button 
            onClick={() => onRun && onRun(code)}
            disabled={isRunning}
            className={`flex items-center px-4 py-1.5 rounded-md text-sm font-semibold transition-all
              ${isRunning 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20'
              }`}
          >
            {isRunning ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
                <Play size={16} className="mr-2 fill-current" />
            )}
            Run Code
          </button>
        </div>
      </div>

      {/* Editor Area with Syntax Highlighting Overlay */}
      <div className="flex-1 relative font-mono text-sm group overflow-hidden bg-slate-900">
        
        {/* Syntax Highlight Layer (Behind) */}
        <pre
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 p-4 m-0 pointer-events-none whitespace-pre-wrap break-words leading-relaxed"
            style={{ fontFamily: 'monospace' }}
            dangerouslySetInnerHTML={{ __html: getHighlightedCode(code) + '<br>' }} 
        />

        {/* Editing Layer (Transparent Text, Visible Caret) */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white resize-none focus:outline-none leading-relaxed z-10"
          style={{ fontFamily: 'monospace' }}
          spellCheck="false"
          autoCapitalize="off"
          autoComplete="off"
        />
      </div>

      {/* Output Console */}
      <div className="h-1/3 min-h-[150px] border-t border-slate-700 bg-slate-950 flex flex-col z-20">
        <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Terminal size={14} className="mr-2" />
            Console Output
          </div>
          {isCorrect !== null && isCorrect !== undefined && (
            <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isCorrect ? <CheckCircle2 size={14} className="mr-1" /> : <AlertCircle size={14} className="mr-1" />}
              {isCorrect ? 'PASSED' : 'FAILED'}
            </div>
          )}
        </div>
        <div className="flex-1 p-4 overflow-auto font-mono text-sm">
          {error ? (
            <div className="text-red-400 whitespace-pre-wrap">{error}</div>
          ) : output ? (
            <div className="text-slate-300 whitespace-pre-wrap">{output}</div>
          ) : (
            <div className="text-slate-600 italic">No output yet. Run your code to see results.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
