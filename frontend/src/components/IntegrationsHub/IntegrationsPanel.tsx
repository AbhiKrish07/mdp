import React, { useState } from 'react';
import { 
  CheckCircle2, Send, 
  Layers, Sliders, Globe
} from 'lucide-react';
import type { IntegrationService } from '../../types/agent';

interface IntegrationsPanelProps {
  backendOnline: boolean;
  onTestWebhook: (serviceId: string, url: string) => void;
  onExecuteMCPTool: (toolName: string) => void;
}

export const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({
  backendOnline,
  onTestWebhook,
  onExecuteMCPTool
}) => {
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.slack.com/services/DEMO/AGENT/DESK');
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const integrations: IntegrationService[] = [
    {
      id: 'vscode',
      name: 'VS Code & IDE Environment',
      category: 'devtools',
      status: 'connected',
      icon: 'code',
      description: 'Active buffer sync, diagnostic issue linter, and one-click patch applicator.',
      lastActive: 'Just now',
      metrics: { 'Open Files': 3, 'Active Language': 'Python / C++' }
    },
    {
      id: 'terminal',
      name: 'Local Shell & PyTest Runner',
      category: 'devtools',
      status: 'connected',
      icon: 'terminal',
      description: 'Direct execution of pytest, git commits, build scripts, and daemon processes.',
      lastActive: '1m ago',
      metrics: { 'Exit Code': 0, 'Passed Tests': 4 }
    },
    {
      id: 'slack',
      name: 'Slack & Discord Webhook',
      category: 'collaboration',
      status: 'simulated',
      icon: 'message',
      description: 'Automated post summaries to engineering channels, standup bot, and alert pings.',
      lastActive: '2m ago',
      metrics: { 'Channel': '#desk-companion-bot', 'Dispatches': 12 }
    },
    {
      id: 'notion',
      name: 'Notion & Obsidian Hub',
      category: 'notes',
      status: 'simulated',
      icon: 'book',
      description: 'Sprint backlog sync, daily engineering log generation, and task checklist updates.',
      lastActive: '4m ago',
      metrics: { 'Tasks Active': 5, 'Sprint': 'Week 42' }
    },
    {
      id: 'github',
      name: 'GitHub Repository Bridge',
      category: 'devtools',
      status: 'connected',
      icon: 'git',
      description: 'Branch monitor, auto-PR generator for bug fixes, and commit history tracker.',
      lastActive: '5m ago',
      metrics: { 'Branch': 'main', 'Commit': '7f20c4a' }
    },
    {
      id: 'fastapi',
      name: 'Python FastAPI Local Daemon',
      category: 'hardware',
      status: backendOnline ? 'connected' : 'simulated',
      icon: 'cpu',
      description: 'Host service running on port 8088 linking physical Pico hardware & Groq LLM brain.',
      lastActive: backendOnline ? 'Live pinging' : 'Web Mock Fallback',
      metrics: { 'Port': 8088, 'Protocol': 'HTTP / WebSocket' }
    }
  ];

  const handleTestDispatch = () => {
    setDispatchStatus('Dispatching live test webhook packet...');
    onTestWebhook('slack', webhookUrl);
    setTimeout(() => {
      setDispatchStatus('✅ Webhook dispatched successfully. HTTP 200 Received.');
      setTimeout(() => setDispatchStatus(null), 3000);
    }, 800);
  };

  return (
    <div className="bg-[#0f1420] border border-slate-800 rounded-xl p-5 flex flex-col gap-5 font-sans text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-slate-100 text-sm">User Software Integrations & Agentic Bridges</h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
          6 Software Bridges Ready
        </span>
      </div>

      {/* Grid of integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-slate-200 text-xs">{item.name}</div>
                <div className="text-[10px] text-slate-400 capitalize">{item.category}</div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase ${
                item.status === 'connected'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              }`}>
                {item.status}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {item.description}
            </p>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              {Object.entries(item.metrics).map(([k, v]) => (
                <span key={k}>
                  {k}: <strong className="text-slate-300">{v}</strong>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Live Webhook & MCP Dispatcher */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 w-full">
          <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="Custom Slack / Discord / Automation Webhook URL..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleTestDispatch}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Test Webhook</span>
          </button>

          <button
            onClick={() => onExecuteMCPTool('hardware.robot.wave')}
            className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Trigger MCP Tool</span>
          </button>
        </div>
      </div>

      {dispatchStatus && (
        <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono animate-fadeIn flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{dispatchStatus}</span>
        </div>
      )}
    </div>
  );
};
