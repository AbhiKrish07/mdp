import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Mic, MicOff, Paperclip, Volume2, Copy, 
  ThumbsUp, Sparkles, Plus, Search, ExternalLink,
  MessageSquare, Radio
} from 'lucide-react';

interface ChatViewProps {
  isDark: boolean;
  onNavigateToAgentConsole: () => void;
  backendOnline: boolean;
}

interface Message {
  id: string;
  sender: 'user' | 'still';
  time: string;
  text: string;
  hasAgentAction?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  isDark,
  onNavigateToAgentConsole,
  backendOnline
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'user',
      time: '09:34',
      text: 'Help me make space for focused work before my design review.'
    },
    {
      id: 'm2',
      sender: 'still',
      time: '09:34',
      text: `You have a clear window until 11:00. I'd suggest keeping it simple:\n\n10:00–10:45  Review the desk layout without distractions.\n10:45–11:00  Collect questions for the design review.\n\nI've drafted the focus block. Nothing will be added to your calendar until you approve it.`,
      hasAgentAction: true
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState("Actually, let's start at ten fifteen…");
  const [activeThread, setActiveThread] = useState('Plan my morning');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech Recognition hook
  useEffect(() => {
    let recognition: any = null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (isListening && SpeechRecognition) {
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          setTranscribedText(transcript);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.start();
      } catch (err) {
        console.warn("Speech recognition not allowed or unavailable", err);
      }
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isListening]);

  // Handle Send message
  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputVal;
    if (!textToSend.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: textToSend
    };

    setMessages(prev => [...prev, newMsg]);
    setInputVal('');
    setIsListening(false);

    // Call backend or provide structured assistant reply
    let replyText = "I have noted that and updated your active workspace context.";
    let hasAction = false;

    if (backendOnline) {
      try {
        const res = await fetch('http://localhost:8088/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: textToSend })
        });
        if (res.ok) {
          const data = await res.json();
          replyText = data.response || data.answer || replyText;
        }
      } catch {
        // Fallback
      }
    } else {
      if (textToSend.toLowerCase().includes('ten fifteen') || textToSend.toLowerCase().includes('10:15')) {
        replyText = "Updated. I've adjusted the focus block to 10:15–10:45 in the draft. You can approve the adjusted event in the Agent Console.";
        hasAction = true;
      }
    }

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'still',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: replyText,
          hasAgentAction: hasAction
        }
      ]);

      // Speak response if browser TTS is available
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(replyText.slice(0, 140));
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }, 600);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-170px)] min-h-[580px] animate-fadeIn">
      
      {/* Left Sidebar: Threads / History */}
      <div className={`lg:col-span-4 p-5 rounded-3xl border flex flex-col justify-between overflow-hidden transition-colors ${
        isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
      }`}>
        <div className="space-y-4 overflow-y-auto pr-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Conversations</span>
            <button
              onClick={() => {
                setActiveThread('New conversation');
                setMessages([{
                  id: Date.now().toString(),
                  sender: 'still',
                  time: 'Just now',
                  text: 'How can I assist your focus or thinking right now?'
                }]);
              }}
              className={`p-1.5 rounded-xl border text-xs flex items-center gap-1 transition-colors ${
                isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-[#d8d6cc] hover:bg-slate-100'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
            isDark ? 'bg-[#181a1d] border-slate-700' : 'bg-[#f7f6f1] border-[#e0ded5]'
          }`}>
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search conversations"
              className="bg-transparent border-none outline-none w-full text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400"
            />
          </div>

          <div className="space-y-3 pt-1">
            <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">Today</div>
            <button
              onClick={() => setActiveThread('Plan my morning')}
              className={`w-full p-2.5 rounded-xl text-left text-xs transition-colors border ${
                activeThread === 'Plan my morning'
                  ? (isDark ? 'bg-[#2c3138] border-slate-700 text-white font-medium' : 'bg-[#f4f2ea] border-[#dad7cc] text-slate-900 font-medium')
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <div>Plan my morning</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">09:34 · 4 messages</div>
            </button>
            <button
              onClick={() => setActiveThread('Desk layout ideas')}
              className="w-full p-2.5 rounded-xl text-left text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Desk layout ideas
            </button>

            <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider pt-2">Yesterday</div>
            <button className="w-full p-2.5 rounded-xl text-left text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
              Interview takeaways
            </button>
            <button className="w-full p-2.5 rounded-xl text-left text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
              A quieter workspace
            </button>
            <button className="w-full p-2.5 rounded-xl text-left text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
              Weekly reflection
            </button>

            <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider pt-2">Last week</div>
            <button className="w-full p-2.5 rounded-xl text-left text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
              Research questions
            </button>
            <button className="w-full p-2.5 rounded-xl text-left text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
              Reading list for October
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-700/10 dark:border-slate-800">
          Conversations stay for 30 days.<br />
          <span className="text-emerald-600 dark:text-emerald-400 cursor-pointer">Manage in Memory & privacy.</span>
        </div>
      </div>

      {/* Right Column: Chat Stream & Dictation Bar */}
      <div className={`lg:col-span-8 p-6 rounded-3xl border flex flex-col justify-between overflow-hidden transition-colors shadow-sm ${
        isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
      }`}>
        
        {/* Thread Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/10 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold">{activeThread}</h2>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Still Balanced · Workspace context on
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Head connected</span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-2">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.sender === 'user' ? (
                <div className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed ${
                  isDark ? 'bg-[#2a382c] text-emerald-100' : 'bg-[#e7eee6] text-[#203923]'
                }`}>
                  <p>{msg.text}</p>
                  <span className="block text-[10px] text-slate-400 mt-2 font-mono text-right">
                    You · {msg.time}
                  </span>
                </div>
              ) : (
                <div className="max-w-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Still</span>
                    <span className="text-[10px] text-slate-400 font-mono">{msg.time}</span>
                  </div>

                  <div className={`p-4 rounded-2xl border text-xs leading-relaxed whitespace-pre-line ${
                    isDark ? 'bg-[#181a1d] border-slate-700 text-slate-200' : 'bg-[#faf9f5] border-[#e8e6dc] text-slate-800'
                  }`}>
                    {msg.text}
                  </div>

                  {msg.hasAgentAction && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={onNavigateToAgentConsole}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium text-white transition-all ${
                          isDark ? 'bg-[#405644] hover:bg-[#4d6752]' : 'bg-[#3b4d3c] hover:bg-[#2e3c2f]'
                        }`}
                      >
                        Review in Agent Console
                      </button>
                      <button
                        onClick={() => handleSend("Can we adjust the start time of the focus block?")}
                        className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${
                          isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-[#d8d6cc] hover:bg-slate-100'
                        }`}
                      >
                        Adjust the plan
                      </button>
                      <button 
                        onClick={() => {
                          if ('speechSynthesis' in window) {
                            const u = new SpeechSynthesisUtterance(msg.text);
                            window.speechSynthesis.speak(u);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* Live Audio Listening Waveform Card (Page 6) */}
        {isListening && (
          <div className="mb-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              {/* Dynamic waveform visualizer */}
              <div className="flex items-center gap-1 h-5">
                {[0.4, 0.8, 0.3, 1.0, 0.6, 0.9, 0.5, 0.2].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h * 20}px` }}
                    className="w-1 rounded-full bg-emerald-500 animate-pulse"
                  />
                ))}
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Listening…
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono italic">
                  "{transcribedText}"
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSend(transcribedText)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-medium shadow-sm hover:bg-emerald-500"
              >
                Insert
              </button>
              <button
                onClick={() => setIsListening(false)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200/50"
              >
                Stop listening
              </button>
            </div>
          </div>
        )}

        {/* Bottom Input Area */}
        <div className="space-y-2 pt-2">
          <div className={`p-2.5 rounded-2xl border flex items-center gap-3 ${
            isDark ? 'bg-[#181a1d] border-slate-700' : 'bg-[#faf9f5] border-[#e8e6dc]'
          }`}>
            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[11px] font-mono">
              <Paperclip className="w-4 h-4" />
              <span>Desk refresh</span>
            </button>

            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask a question or share a thought…"
              className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />

            <button
              onClick={() => setIsListening(!isListening)}
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : (isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700')
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{isListening ? 'Listening' : 'Voice'}</span>
            </button>

            <button
              onClick={() => handleSend()}
              className={`p-2 px-3 rounded-xl text-xs font-medium text-white transition-all shadow-sm ${
                isDark ? 'bg-[#405644] hover:bg-[#4d6752]' : 'bg-[#3b4d3c] hover:bg-[#2e3c2f]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[10px] text-slate-400 text-center font-mono">
            Still can make mistakes. Review important information. · Enter to send, Shift + Enter for a new line
          </div>
        </div>

      </div>

    </div>
  );
};
