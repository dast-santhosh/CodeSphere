
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
      requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = start + 4;
      });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      onRun && onRun(code);
    }
  };

  const getHighlightedCode = (code: string) => {
      let text = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const replacements: Record<string, string> = {};
      let idCounter = 0;

      const store = (html: string) => {
          const key = `__TOKEN_${idCounter++}__`;
          replacements[key] = html;
          return key;
      };

      text = text.replace(/('.*?'|".*?")/g, (match) => store(`<span class="text-green-400">${match}</span>`));
      text = text.replace(/(#.*)/g, (match) => store(`<span class="text-red-400 italic">${match}</span>`));

      const keywords = /\b(def|class|return|if|else|elif|while|for|in|try|except|import|from|as|pass|break|continue|and|or|not|is|None|True|False)\b/g;
      text = text.replace(keywords, (match) => store(`<span class="text-orange-400 font-bold">${match}</span>`));

      const builtins = /\b(print|len|range|int|str|float|list|dict|set|input|open|type|super)\b/g;
      text = text.replace(builtins, (match) => store(`<span class="text-purple-400">${match}</span>`));

      text = text.replace(/\b(\d+)\b/g, (match) => store(`<span class="text-blue-400">${match}</span>`));

      Object.keys(replacements).forEach(key => {
          text = text.replace(key, replacements[key]);
      });

      return text;
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-none shadow-inner overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-800 border-b border-neutral-700 z-20">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 bg-red-500/50"></div>
            <div className="w-3 h-3 bg-yellow-500/50"></div>
            <div className="w-3 h-3 bg-green-500/50"></div>
          </div>
          <span className="ml-4 text-xs font-mono text-neutral-400">main.py</span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => {
                setCode(initialCode);
                if(onChange) onChange(initialCode);
            }}
            className="p-2 text-neutral-400 hover:text-white transition-colors"
            title="Reset Code"
          >
            <RotateCcw size={16} />
          </button>
          <button 
            onClick={() => onRun && onRun(code)}
            disabled={isRunning}
            className={`flex items-center px-4 py-1.5 text-sm font-semibold transition-all
              ${isRunning 
                ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed' 
                : 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20'
              }`}
          >
            {isRunning ? (
                <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
                <Play size={16} className="mr-2 fill-current" />
            )}
            Run Code
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative font-mono text-sm group overflow-hidden bg-neutral-900">
        <pre
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 p-4 m-0 pointer-events-none whitespace-pre break-normal overflow-hidden"
            style={{ fontFamily: 'monospace', tabSize: 4 }}
            dangerouslySetInnerHTML={{ __html: getHighlightedCode(code) + '<br>' }} 
        />
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white resize-none focus:outline-none overflow-auto z-10 whitespace-pre"
          style={{ fontFamily: 'monospace', tabSize: 4 }}
          spellCheck="false"
          autoCapitalize="off"
          autoComplete="off"
        />
      </div>

      {/* Output Console */}
      <div className="h-1/3 min-h-[150px] border-t border-neutral-700 bg-neutral-950 flex flex-col z-20">
        <div className="px-4 py-2 bg-neutral-900/50 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            <Terminal size={14} className="mr-2" />
            Console Output
          </div>
          {isCorrect !== null && isCorrect !== undefined && (
            <div className={`flex items-center text-xs font-bold px-2 py-0.5 ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isCorrect ? <CheckCircle2 size={14} className="mr-1" /> : <AlertCircle size={14} className="mr-1" />}
              {isCorrect ? 'PASSED' : 'FAILED'}
            </div>
          )}
        </div>
        <div className="flex-1 p-4 overflow-auto font-mono text-sm">
          {error ? (
            <div className="text-red-400 whitespace-pre-wrap">{error}</div>
          ) : output ? (
            <div className="text-neutral-300 whitespace-pre-wrap">{output}</div>
          ) : (
            <div className="text-neutral-600 italic">No output yet. Run your code to see results.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
