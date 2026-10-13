import React, { useState, useEffect } from 'react';
import { 
  Home, MessageSquare, Briefcase, Bot, Settings,
  Sun, Moon, Search, Clock, Shield, Wifi, Battery,
  Radio, Wrench, ExternalLink, HelpCircle
} from 'lucide-react';

import { HomeView } from './HomeView';
import { ChatView } from './ChatView';
import { VisionStudioView } from './VisionStudioView';
import { AgentConsoleView } from './AgentConsoleView';
import { WorkspaceViews } from './WorkspaceViews';
import { RobotViews } from './RobotViews';
import { SettingsViews } from './SettingsViews';
import { OnboardingModal } from './OnboardingModal';

interface CompanionUserAppProps {
  backendOnline: boolean;
  privacyActive: boolean;
  onTogglePrivacy: () => void;
  onOpenTestbench?: () => void;
}

type MainTab = 'home' | 'companion' | 'workspace' | 'robot' | 'settings';

export const CompanionUserApp: React.FC<CompanionUserAppProps> = ({
  backendOnline,
  privacyActive,
  onTogglePrivacy,
  onOpenTestbench
}) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [activeSubTab, setActiveSubTab] = useState<string>('chat');
  
  // Theme State (Warm Stone by default, Obsidian Dark on toggle)
  const [isDark, setIsDark] = useState(false);

  // Setup / Onboarding Modal
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Live Telemetry
  const [dockState, setDockState] = useState<'STANDALONE' | 'DOCKED'>('DOCKED');
  const [headBattery, setHeadBattery] = useState(82);
  const [bodyBattery, setBodyBattery] = useState(64);

  // Fetch telemetry from backend
  useEffect(() => {
    let mounted = true;
    const fetchTelemetry = async () => {
      if (!backendOnline) return;
      try {
        const res = await fetch('http://localhost:8088/api/v1/modular/telemetry');
        if (res.ok) {
          const data = await res.json();
          if (!mounted) return;
          if (data.dock_state) setDockState(data.dock_state === 'STANDALONE' ? 'STANDALONE' : 'DOCKED');
          if (data.head?.battery_pct !== undefined) setHeadBattery(data.head.battery_pct);
          if (data.body?.body_battery_pct !== undefined) setBodyBattery(data.body.body_battery_pct);
        }
      } catch {
        // silent fallback
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [backendOnline]);

  // Navigate helper
  const handleNavigate = (tab: string, sub?: string) => {
    setActiveTab(tab as MainTab);
    if (sub) {
      setActiveSubTab(sub);
    } else {
      if (tab === 'companion') setActiveSubTab('chat');
      else if (tab === 'workspace') setActiveSubTab('projects');
      else if (tab === 'robot') setActiveSubTab('controls');
      else if (tab === 'settings') setActiveSubTab('integrations');
    }
  };

  // Toggle dock mode
  const handleToggleDock = async () => {
    const next = dockState === 'DOCKED' ? 'STANDALONE' : 'DOCKED';
    setDockState(next);
    if (backendOnline) {
      try {
        await fetch('http://localhost:8088/api/v1/modular/dock-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: next })
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#17191b] text-slate-100' : 'bg-[#f6f5ee] text-[#1c211e]'
    }`}>
      
      {/* 1. TOP GLOBAL APP HEADER (PAGES 5-28) */}
      <header className={`px-6 py-3.5 border-b flex items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur-md transition-colors ${
        isDark ? 'bg-[#17191b]/90 border-slate-800' : 'bg-[#f6f5ee]/90 border-[#e5e3d8]'
      }`}>
        
        {/* Brand & Device Dropdown */}
        <div className="flex items-center gap-6">
          <span className="text-xl font-serif tracking-tight font-medium cursor-pointer" onClick={() => handleNavigate('home')}>
            still
          </span>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Still One</span>
            <span className="text-slate-400">⌄</span>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              · {dockState === 'DOCKED' ? 'Docked robot · connected' : 'Head online · body offline'}
            </span>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          {/* Global Search Bar (⌘ K) */}
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs w-56 ${
            isDark ? 'bg-[#212428] border-slate-700 text-slate-300' : 'bg-white border-[#d8d6cb] text-slate-700'
          }`}>
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search anything" 
              className="bg-transparent border-none outline-none w-full text-xs placeholder-slate-400"
            />
            <span className="text-[10px] font-mono text-slate-400 px-1 rounded bg-slate-200/50 dark:bg-slate-700">⌘K</span>
          </div>

          {/* Quick Focus Button */}
          <button
            onClick={() => handleNavigate('workspace', 'focus')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white shadow-sm transition-all transform active:scale-95 ${
              isDark ? 'bg-[#405644] hover:bg-[#4d6752]' : 'bg-[#3b4d3c] hover:bg-[#2e3c2f]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Start a focus session</span>
          </button>

          {/* Hardware Workstation Toggle */}
          {onOpenTestbench && (
            <button
              onClick={onOpenTestbench}
              title="Switch to Raw Hardware Engineering Workbench"
              className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
                isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-[#d8d6cb] hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-cyan-500" />
              <span className="hidden lg:inline text-[11px] font-mono">Dev Workbench</span>
            </button>
          )}

          {/* Theme Switcher (Warm Stone ↔ Obsidian Dark) */}
          <button
            onClick={() => setIsDark(!isDark)}
            title="Toggle Light / Dark mode"
            className={`p-2 rounded-xl border transition-colors ${
              isDark ? 'border-slate-700 hover:bg-slate-800 text-amber-300' : 'border-[#d8d6cb] hover:bg-slate-100 text-slate-700'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Setup Help Button */}
          <button
            onClick={() => setShowOnboarding(true)}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-mono hidden md:flex items-center gap-1"
          >
            <span>Setup help</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* 2. BODY LAYOUT: SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <aside className={`w-56 p-5 border-r flex flex-col justify-between shrink-0 hidden md:flex transition-colors ${
          isDark ? 'bg-[#17191b] border-slate-800' : 'bg-[#f6f5ee] border-[#e5e3d8]'
        }`}>
          <div className="space-y-6">
            
            {/* Top Primary Tabs */}
            <nav className="space-y-1">
              
              {/* Home */}
              <button
                onClick={() => handleNavigate('home')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'home'
                    ? (isDark ? 'bg-[#25282c] text-white font-bold' : 'bg-white text-slate-950 font-bold shadow-xs')
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>

              {/* Companion */}
              <div>
                <button
                  onClick={() => handleNavigate('companion')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    activeTab === 'companion'
                      ? (isDark ? 'bg-[#25282c] text-white font-bold' : 'bg-white text-slate-950 font-bold shadow-xs')
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Companion</span>
                </button>

                {activeTab === 'companion' && (
                  <div className="pl-9 pr-2 py-1.5 space-y-1 text-xs">
                    {['chat', 'vision', 'agent'].map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setActiveSubTab(sub)}
                        className={`w-full text-left py-1 rounded-lg transition-colors capitalize ${
                          activeSubTab === sub 
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {sub === 'vision' ? 'Vision Studio' : sub === 'agent' ? 'Agent Console' : 'Chat'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Workspace */}
              <div>
                <button
                  onClick={() => handleNavigate('workspace')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    activeTab === 'workspace'
                      ? (isDark ? 'bg-[#25282c] text-white font-bold' : 'bg-white text-slate-950 font-bold shadow-xs')
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Workspace</span>
                </button>

                {activeTab === 'workspace' && (
                  <div className="pl-9 pr-2 py-1.5 space-y-1 text-xs">
                    {['projects', 'notes', 'tasks', 'planner', 'knowledge', 'focus'].map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setActiveSubTab(sub)}
                        className={`w-full text-left py-1 rounded-lg transition-colors capitalize ${
                          activeSubTab === sub 
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {sub === 'notes' ? 'Notes & documents' : sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Robot */}
              <div>
                <button
                  onClick={() => handleNavigate('robot')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    activeTab === 'robot'
                      ? (isDark ? 'bg-[#25282c] text-white font-bold' : 'bg-white text-slate-950 font-bold shadow-xs')
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  <span>Robot</span>
                </button>

                {activeTab === 'robot' && (
                  <div className="pl-9 pr-2 py-1.5 space-y-1 text-xs">
                    {['controls', 'routines'].map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setActiveSubTab(sub)}
                        className={`w-full text-left py-1 rounded-lg transition-colors capitalize ${
                          activeSubTab === sub 
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Settings */}
              <div>
                <button
                  onClick={() => handleNavigate('settings')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    activeTab === 'settings'
                      ? (isDark ? 'bg-[#25282c] text-white font-bold' : 'bg-white text-slate-950 font-bold shadow-xs')
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>

                {activeTab === 'settings' && (
                  <div className="pl-9 pr-2 py-1.5 space-y-1 text-xs">
                    {['integrations', 'models', 'memory', 'diagnostics', 'calibration', 'firmware'].map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setActiveSubTab(sub)}
                        className={`w-full text-left py-1 rounded-lg transition-colors capitalize ${
                          activeSubTab === sub 
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {sub === 'models' ? 'AI models' : sub === 'memory' ? 'Memory & privacy' : sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </nav>
          </div>

          {/* User Profile Footer (Page 5) */}
          <div className="pt-4 border-t border-slate-700/10 dark:border-slate-800 text-xs">
            <div className="font-semibold text-slate-800 dark:text-slate-200">Alex Chen</div>
            <div className="text-[11px] text-slate-400 font-mono">Personal workspace</div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {activeTab === 'home' && (
            <HomeView
              isDark={isDark}
              headBattery={headBattery}
              bodyBattery={bodyBattery}
              dockState={dockState}
              onNavigate={handleNavigate}
              onStartFocus={() => handleNavigate('workspace', 'focus')}
            />
          )}

          {activeTab === 'companion' && activeSubTab === 'chat' && (
            <ChatView
              isDark={isDark}
              onNavigateToAgentConsole={() => handleNavigate('companion', 'agent')}
              backendOnline={backendOnline}
            />
          )}

          {activeTab === 'companion' && activeSubTab === 'vision' && (
            <VisionStudioView
              isDark={isDark}
              privacyActive={privacyActive}
              onNavigateToChat={() => handleNavigate('companion', 'chat')}
            />
          )}

          {activeTab === 'companion' && activeSubTab === 'agent' && (
            <AgentConsoleView
              isDark={isDark}
              onNavigateToCalendar={() => handleNavigate('workspace', 'planner')}
            />
          )}

          {activeTab === 'workspace' && (
            <WorkspaceViews
              isDark={isDark}
              activeSubTab={activeSubTab as any}
              onNavigateToFocus={() => handleNavigate('workspace', 'focus')}
            />
          )}

          {activeTab === 'robot' && (
            <RobotViews
              isDark={isDark}
              dockState={dockState}
              headBattery={headBattery}
              bodyBattery={bodyBattery}
              onToggleDock={handleToggleDock}
              backendOnline={backendOnline}
              activeSubTab={activeSubTab as any}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsViews
              isDark={isDark}
              onToggleTheme={() => setIsDark(!isDark)}
              activeSubTab={activeSubTab as any}
            />
          )}
        </main>

      </div>

      {/* 3. BOTTOM FOOTER TELEMETRY STATUS BAR (PAGES 5-28) */}
      <footer className={`px-6 py-2 border-t flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono transition-colors ${
        isDark ? 'bg-[#141618] border-slate-800 text-slate-400' : 'bg-[#edece4] border-[#e0ded3] text-slate-500'
      }`}>
        <div className="flex items-center gap-4">
          <span>Head {headBattery}%</span>
          <span>·</span>
          <span>Body {bodyBattery}%</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Wifi className="w-3 h-3 text-emerald-500" />
            Wi-Fi connected
          </span>
          <span>·</span>
          <span>FastAPI :8088 ({backendOnline ? '🟢 Connected' : '🟡 Emulated'})</span>
        </div>

        <div className="flex items-center gap-3">
          <span>Local time 09:41 · Tue, 13 Oct 2026</span>
        </div>
      </footer>

      {/* 4. ONBOARDING / SETUP MODAL WIZARD (PAGES 1-4) */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        headBattery={headBattery}
        bodyBattery={bodyBattery}
        isDark={isDark}
      />

    </div>
  );
};
