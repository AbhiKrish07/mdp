import { useState } from 'react';
import { Mic, Send, Key, Bot, User, Sparkles } from 'lucide-react';
import type { FaceState } from './RobotFace';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  expression?: FaceState;
  gesture?: string;
}

interface VoiceChatProps {
  messages: ChatMessage[];
  onSendMessage: (query: string) => void;
  apiKey: string;
  onUpdateApiKey: (key: string) => void;
  privacyActive: boolean;
  isProcessing: boolean;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({
  messages,
  onSendMessage,
  apiKey,
  onUpdateApiKey,
  privacyActive,
  isProcessing
}) => {
  const [inputText, setInputText] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || privacyActive || isProcessing) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleMicClick = () => {
    if (privacyActive) return;
    
    // Check if browser Web Speech API is available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onSendMessage(transcript);
        }
      };
      recognition.start();
    } else {
      // Fallback simulated STT prompt
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        onSendMessage("Hey companion, how is my work session going?");
      }, 1500);
    }
  };

  return (
    <div className="glass-panel p-5 flex flex-col gap-4 h-[420px]">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold text-slate-100 text-base">Spoken & Text Companion Chat</h3>
        </div>

        <button
          onClick={() => setShowKeyInput(!showKeyInput)}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ${
            apiKey ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>{apiKey ? 'Groq Key Active' : 'Set Groq API Key'}</span>
        </button>
      </div>

      {/* Groq API Key Config Modal input */}
      {showKeyInput && (
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex flex-col gap-2">
          <label className="text-xs text-slate-300 font-medium">Groq API Key (Ultra-low latency LLM & Vision)</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => onUpdateApiKey(e.target.value)}
              placeholder="gsk_..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={() => setShowKeyInput(false)}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold"
            >
              Save Key
            </button>
          </div>
          <span className="text-[10px] text-slate-500">If no key is provided, the dual-mode mock reasoning engine handles all queries seamlessly.</span>
        </div>
      )}

      {/* Message History List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
            <Sparkles className="w-6 h-6 text-cyan-500/40" />
            <span>Say "Hey companion" or ask a question to start</span>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
              }`}>
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}>
                <p>{msg.content}</p>
                {msg.expression && (
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] font-mono text-cyan-400/80 pt-1 border-t border-slate-800">
                    <span>Exp: {msg.expression}</span>
                    {msg.gesture && <span>• Gesture: {msg.gesture}</span>}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isProcessing && (
          <div className="flex gap-2 items-center text-xs text-slate-400 italic">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>AI Companion is thinking...</span>
          </div>
        )}
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <button
          type="button"
          onClick={handleMicClick}
          disabled={privacyActive}
          className={`p-2.5 rounded-xl border transition-all ${
            isListening
              ? 'bg-red-500 border-red-400 text-white animate-pulse'
              : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-cyan-400'
          }`}
          title="Hold/Click to Speak"
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={privacyActive}
          placeholder={privacyActive ? 'Privacy switch engaged...' : 'Ask a question or request a vision scan...'}
          className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={privacyActive || !inputText.trim() || isProcessing}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>

    </div>
  );
};
