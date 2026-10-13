import React, { useState } from 'react';
import { Hash, Send, Bot, User, Bell, Sparkles } from 'lucide-react';

interface SlackMessage {
  id: string;
  sender: string;
  role: 'bot' | 'user' | 'colleague';
  avatar?: string;
  content: string;
  timestamp: string;
  badge?: string;
}

interface SlackWorkspaceProps {
  onPostMessage: (msg: string) => void;
}

export const SlackWorkspace: React.FC<SlackWorkspaceProps> = ({ onPostMessage }) => {
  const [activeChannel, setActiveChannel] = useState<'#engineering' | '#desk-companion-bot' | '#alerts'>('#desk-companion-bot');
  const [inputMsg, setInputMsg] = useState('');
  const [messages, setMessages] = useState<SlackMessage[]>([
    {
      id: '1',
      sender: 'Desk Companion Agent',
      role: 'bot',
      content: '🟢 Station booted. Vision tracker locked on breadboard workspace. Pytest suites ready.',
      timestamp: '22:10',
      badge: 'APP'
    },
    {
      id: '2',
      sender: 'Alex (Firmware Lead)',
      role: 'colleague',
      content: 'Hey! Did the Pico UART baud rate test finish on the companion robot?',
      timestamp: '22:12'
    },
    {
      id: '3',
      sender: 'Desk Companion Agent',
      role: 'bot',
      content: '✅ Confirmed Alex! Pico UART communication verified at 115200 baud. Servo packets zero dropped.',
      timestamp: '22:13',
      badge: 'APP'
    }
  ]);

  const handleSend = () => {
    if (!inputMsg.trim()) return;
    const userMsg: SlackMessage = {
      id: Date.now().toString(),
      sender: 'You',
      role: 'user',
      content: inputMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    onPostMessage(inputMsg);
    const sentText = inputMsg;
    setInputMsg('');

    // Agent bot reply
    setTimeout(() => {
      let reply = "Got it! Dispatched command to the AI Desk Companion agent pipeline.";
      if (sentText.toLowerCase().includes('status') || sentText.toLowerCase().includes('report')) {
        reply = "📊 Station Telemetry: CPU 24%, Battery 92%, Posture Score: Good (25m sitting). No hardware alarms.";
      } else if (sentText.toLowerCase().includes('break')) {
        reply = "🕒 Pomodoro timer checked. 15 minutes remaining until next stretch break.";
      }
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'Desk Companion Agent',
          role: 'bot',
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          badge: 'APP'
        }
      ]);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1d21] text-slate-200 rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-sans text-xs">
      {/* Slack Header */}
      <div className="bg-[#121518] px-3 py-2 flex items-center justify-between border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm">Robotics Engineering Workspace</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
            ● Connected to Slack Webhook
          </span>
        </div>
        <Bell className="w-4 h-4 text-slate-400" />
      </div>

      <div className="flex flex-1 min-h-[340px]">
        {/* Sidebar Channels */}
        <div className="w-48 bg-[#121518] border-r border-slate-800/80 p-2 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1">Channels</span>
          {(['#desk-companion-bot', '#engineering', '#alerts'] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-left transition-colors ${
                activeChannel === ch
                  ? 'bg-cyan-950 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Hash className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{ch.replace('#', '')}</span>
            </button>
          ))}

          <div className="mt-auto p-2 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
            <span className="font-medium text-slate-300 block mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Auto-Bot Sync
            </span>
            Companion posts summaries directly when test runs or posture alerts trigger.
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 flex flex-col bg-[#1a1d21]">
          <div className="p-2 border-b border-slate-800/80 font-semibold text-slate-300 flex items-center gap-2">
            <Hash className="w-4 h-4 text-slate-400" />
            <span>{activeChannel}</span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="flex items-start gap-2.5 group">
                <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                  m.role === 'bot' ? 'bg-cyan-600 text-slate-950 font-bold' :
                  m.role === 'colleague' ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {m.role === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{m.sender}</span>
                    {m.badge && (
                      <span className="text-[9px] px-1 rounded bg-slate-700 text-slate-300 uppercase font-mono">
                        {m.badge}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">{m.timestamp}</span>
                  </div>
                  <div className="text-slate-300 mt-0.5 leading-relaxed">{m.content}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Send Box */}
          <div className="p-2.5 bg-[#121518] border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Message ${activeChannel}...`}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleSend}
              className="p-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-medium transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
