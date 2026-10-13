import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, FileText, CheckSquare, Calendar, BookOpen, 
  Clock, Play, Pause, RotateCcw, Plus, ArrowRight, ExternalLink,
  Search, Check, Sparkles, Volume2, Shield
} from 'lucide-react';

interface WorkspaceViewsProps {
  isDark: boolean;
  activeSubTab: 'projects' | 'notes' | 'tasks' | 'planner' | 'knowledge' | 'focus';
  onNavigateToFocus?: () => void;
}

export const WorkspaceViews: React.FC<WorkspaceViewsProps> = ({
  isDark,
  activeSubTab,
  onNavigateToFocus
}) => {
  // Focus Timer State
  const [focusSeconds, setFocusSeconds] = useState(32 * 60 + 18); // 32:18 from Page 15
  const [isFocusActive, setIsFocusActive] = useState(true);
  const [focusDuration, setFocusDuration] = useState('45');
  const [breakDuration, setBreakDuration] = useState('5');
  const [quietCompanion, setQuietCompanion] = useState(true);
  const [muteAlerts, setMuteAlerts] = useState(true);

  // Tasks State
  const [tasks, setTasks] = useState([
    { id: '1', name: 'Review desk layout', project: 'Desk refresh', due: 'Today', priority: 'High', status: 'In progress', desc: 'Compare the captured sketch with measurements. Prepare two questions for the 11:00 design review.' },
    { id: '2', name: 'Compare monitor arms', project: 'Desk refresh', due: 'Today', priority: 'Normal', status: 'To do', desc: 'Check VESA 100x100 clamp range and rear clearance.' },
    { id: '3', name: 'Measure cable clearance', project: 'Desk refresh', due: '15 Oct', priority: 'Normal', status: 'To do', desc: 'Ensure 80mm gap behind desk edge.' },
    { id: '4', name: 'Summarize interview notes', project: 'Studio research', due: 'Tomorrow', priority: 'Normal', status: 'To do', desc: 'Extract key themes from user feedback.' },
    { id: '5', name: 'Group research themes', project: 'Studio research', due: '16 Oct', priority: 'High', status: 'To do', desc: 'Synthesize insights into 3 design tenets.' },
    { id: '6', name: 'Read chapter three', project: 'October reading', due: '18 Oct', priority: 'Low', status: 'To do', desc: 'Calm technology and peripheral awareness.' }
  ]);
  const [selectedTask, setSelectedTask] = useState(tasks[0]);

  // Notes state
  const [noteContent, setNoteContent] = useState(
    "The goal isn't a perfect desk. It's a space that makes starting feel easier, and gives me fewer reasons to switch context.\n\nWhat I want to change\n[ ] Clear the area under the monitor.\n[ ] Keep a dedicated space for handwriting.\n[ ] Make charging less visible, but easy to reach.\n\nFor the review\nAsk Maya about the monitor arm clearance. Compare the sketch with the actual desk measurements before ordering anything."
  );
  const [companionContextActive, setCompanionContextActive] = useState(true);

  // Knowledge search state
  const [knowledgeQuery, setKnowledgeQuery] = useState("What measurements matter for the monitor arm?");

  // Timer Tick
  useEffect(() => {
    let t: any;
    if (isFocusActive && focusSeconds > 0) {
      t = setInterval(() => setFocusSeconds(s => s - 1), 1000);
    }
    return () => clearInterval(t);
  }, [isFocusActive, focusSeconds]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
      
      {/* SUBTAB 1: PROJECTS (PAGE 10) */}
      {activeSubTab === 'projects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif tracking-tight font-medium">Your work, with room to think.</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                A home for projects, notes, and small steps forward.
              </p>
            </div>
            <button className={`px-4 py-2 rounded-xl text-xs font-medium text-white shadow-md ${
              isDark ? 'bg-[#405644]' : 'bg-[#3b4d3c]'
            }`}>
              New project
            </button>
          </div>

          {/* Pinned Project Card (Page 10) */}
          <div className={`p-6 rounded-3xl border transition-colors shadow-sm ${
            isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>PINNED PROJECT</span>
                </div>
                <h2 className="text-2xl font-serif font-medium">Desk refresh</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
                  Create a quieter, more ergonomic space for focused work. Finalize the layout and hardware shortlist this week.
                </p>
                <div className="text-[11px] font-mono text-slate-400 pt-2">
                  3 of 8 tasks complete · Target: Fri, 16 Oct · Alex Chen
                </div>
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col justify-between w-64 ${
                isDark ? 'bg-[#181a1d] border-slate-700' : 'bg-[#faf9f5] border-[#e8e6dc]'
              }`}>
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400">NEXT SMALL STEP</span>
                  <div className="text-xs font-semibold mt-1">Review desk layout</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">Today · High priority · 30 min</div>
                </div>
                <button 
                  onClick={onNavigateToFocus}
                  className={`mt-4 px-3 py-1.5 rounded-xl text-xs font-medium text-white text-center transition-all ${
                    isDark ? 'bg-[#405644] hover:bg-[#4d6752]' : 'bg-[#3b4d3c] hover:bg-[#2e3c2f]'
                  }`}
                >
                  Open project & focus
                </button>
              </div>
            </div>
          </div>

          {/* Projects Table */}
          <div className={`p-6 rounded-3xl border transition-colors shadow-sm space-y-4 ${
            isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
          }`}>
            <div className="text-xs font-semibold">Active projects · 3</div>
            <div className="divide-y divide-slate-700/10 dark:divide-slate-800 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">Desk refresh</div>
                  <div className="text-[11px] text-slate-400">Layout, ergonomics & hardware</div>
                </div>
                <div className="font-mono text-slate-400">3 / 8 tasks</div>
                <div className="font-mono text-slate-400">16 Oct 2026</div>
                <div className="font-mono text-slate-400">Today, 09:28</div>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">Studio research</div>
                  <div className="text-[11px] text-slate-400">Interview synthesis & design principles</div>
                </div>
                <div className="font-mono text-slate-400">6 / 12 tasks</div>
                <div className="font-mono text-slate-400">23 Oct 2026</div>
                <div className="font-mono text-slate-400">Yesterday, 16:48</div>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">October reading</div>
                  <div className="text-[11px] text-slate-400">A slower, more intentional reading list</div>
                </div>
                <div className="font-mono text-slate-400">2 / 5 tasks</div>
                <div className="font-mono text-slate-400">31 Oct 2026</div>
                <div className="font-mono text-slate-400">12 Oct, 20:10</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: NOTES & DOCUMENTS (PAGE 11) */}
      {activeSubTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className={`lg:col-span-8 p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm space-y-4 ${
            isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
          }`}>
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/10 dark:border-slate-800">
                <span className="text-xs font-mono text-slate-400">H1 / B I / List Link</span>
                <span className="text-xs font-mono text-slate-400">All changes saved</span>
              </div>
              <h2 className="text-2xl font-serif font-medium mt-4">Morning notes</h2>
              <div className="text-xs text-slate-400 font-mono mt-1">Tuesday, 13 October 2026</div>

              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={12}
                className="w-full mt-4 bg-transparent border-none outline-none text-xs leading-relaxed font-sans text-slate-800 dark:text-slate-200 resize-none"
              />
            </div>

            <div className="text-[11px] text-slate-400 font-mono border-t pt-3 border-slate-700/10 dark:border-slate-800">
              12 documents · 8.4 MB stored locally
            </div>
          </div>

          <div className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm ${
            isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
          }`}>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Details</h3>
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-slate-400 font-mono">PROJECT:</span>
                  <div className="font-medium">Desk refresh</div>
                </div>
                <div>
                  <span className="text-slate-400 font-mono">AUTHOR:</span>
                  <div className="font-medium">Alex Chen</div>
                </div>
                <div>
                  <span className="text-slate-400 font-mono">LAST EDITED:</span>
                  <div className="font-medium">Today, 09:12</div>
                </div>
              </div>

              {/* Companion Context Toggle (Page 11) */}
              <div className="pt-4 border-t border-slate-700/10 dark:border-slate-800">
                <div className="text-xs font-semibold mb-1">Companion context</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  This note can be used when discussing Desk refresh.
                </p>
                <button
                  onClick={() => setCompanionContextActive(!companionContextActive)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    companionContextActive ? 'bg-[#3b4d3c]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    companionContextActive ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>

            <button className={`w-full py-2.5 rounded-xl text-xs font-medium text-white shadow-sm mt-6 ${
              isDark ? 'bg-[#405644]' : 'bg-[#3b4d3c]'
            }`}>
              Summarize with Still
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 3: TASKS (PAGE 12) */}
      {activeSubTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className={`lg:col-span-8 p-6 rounded-3xl border transition-colors shadow-sm space-y-4 ${
            isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-serif font-medium">Small steps. Real progress.</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Six open tasks in your current view, across three active projects.
                </p>
              </div>
              <button className={`px-3 py-1.5 rounded-xl text-xs font-medium text-white shadow-sm ${
                isDark ? 'bg-[#405644]' : 'bg-[#3b4d3c]'
              }`}>
                Add task
              </button>
            </div>

            <div className="divide-y divide-slate-700/10 dark:divide-slate-800 pt-2">
              {tasks.map(t => (
                <div 
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className={`py-3 flex items-center justify-between gap-3 cursor-pointer rounded-xl px-2 transition-colors ${
                    selectedTask.id === t.id ? (isDark ? 'bg-slate-800/60' : 'bg-[#f5f4ec]') : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="rounded text-emerald-600" />
                    <div>
                      <div className="text-xs font-medium">{t.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{t.project} · {t.status}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-400">{t.due}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      t.priority === 'High' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {t.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Details Drawer (Page 12) */}
          <div className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm ${
            isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
          }`}>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Task details</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Task name</label>
                  <input
                    type="text"
                    value={selectedTask.name}
                    readOnly
                    className={`w-full mt-1 px-3 py-2 rounded-xl border text-xs ${
                      isDark ? 'bg-[#181a1d] border-slate-700' : 'bg-[#faf9f5] border-[#d8d6cb]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Project</label>
                  <div className="font-medium mt-1">{selectedTask.project}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Due date</label>
                    <div className="font-medium mt-1">{selectedTask.due}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Priority</label>
                    <div className="font-medium mt-1">{selectedTask.priority}</div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Description</label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {selectedTask.desc}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-700/10 dark:border-slate-800 mt-6">
              <button className={`flex-1 py-2 rounded-xl text-xs border ${
                isDark ? 'border-slate-700' : 'border-[#d8d6cb]'
              }`}>
                Save changes
              </button>
              <button 
                onClick={onNavigateToFocus}
                className={`flex-1 py-2 rounded-xl text-xs font-medium text-white shadow-sm ${
                  isDark ? 'bg-[#405644]' : 'bg-[#3b4d3c]'
                }`}
              >
                Start focus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: PLANNER (PAGE 13) */}
      {activeSubTab === 'planner' && (
        <div className={`p-6 rounded-3xl border transition-colors shadow-sm space-y-5 ${
          isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif font-medium">Leave room for the important things.</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                12–16 October 2026 · Your calendar and focus blocks, together.
              </p>
            </div>
            <button className={`px-4 py-2 rounded-xl text-xs font-medium text-white shadow-sm ${
              isDark ? 'bg-[#405644]' : 'bg-[#3b4d3c]'
            }`}>
              New event
            </button>
          </div>

          {/* 5-Day Weekly Matrix (Page 13) */}
          <div className="grid grid-cols-5 gap-3 border-t border-slate-700/10 dark:border-slate-800 pt-4 text-xs font-mono">
            {['Mon 12', 'Tue 13', 'Wed 14', 'Thu 15', 'Fri 16'].map(day => (
              <div key={day} className="text-center font-bold pb-2 border-b border-slate-700/10 dark:border-slate-800">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-3 min-h-[340px]">
            {/* Monday */}
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px]">
                <div className="font-semibold">Weekly planning</div>
                <div className="text-[10px] text-slate-400">10:00–11:00</div>
              </div>
            </div>

            {/* Tuesday */}
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px]">
                <div className="font-semibold text-amber-700 dark:text-amber-300">Deep work</div>
                <div className="text-[10px] text-amber-600/80">10:00–10:45 · Pending</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px]">
                <div className="font-semibold">Design review</div>
                <div className="text-[10px] text-slate-400">11:00 · Maya & Noah</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px]">
                <div className="font-semibold">Research synthesis</div>
                <div className="text-[10px] text-slate-400">14:00–15:00</div>
              </div>
            </div>

            {/* Wednesday */}
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px]">
                <div className="font-semibold">Interview synthesis</div>
                <div className="text-[10px] text-slate-400">11:00–12:00</div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 text-[11px]">
                <div className="font-semibold">Walk & reset</div>
                <div className="text-[10px] text-slate-400">14:00–14:30</div>
              </div>
            </div>

            {/* Thursday */}
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px]">
                <div className="font-semibold">Deep work</div>
                <div className="text-[10px] text-slate-400">10:00–11:30</div>
              </div>
            </div>

            {/* Friday */}
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px]">
                <div className="font-semibold">Desk refresh check-in</div>
                <div className="text-[10px] text-slate-400">11:00–11:45</div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center gap-2">
            <span className="font-semibold text-amber-700 dark:text-amber-300">One proposed focus block:</span>
            <span className="text-slate-600 dark:text-slate-400">
              The 10:00 block is a draft from Still. Review it in Agent Console before it is added to Google Calendar.
            </span>
          </div>
        </div>
      )}

      {/* SUBTAB 5: KNOWLEDGE (PAGE 14) */}
      {activeSubTab === 'knowledge' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className={`lg:col-span-8 p-6 rounded-3xl border transition-colors shadow-sm space-y-5 ${
            isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
          }`}>
            <div>
              <h1 className="text-2xl font-serif font-medium">A little less searching.</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Find answers in your own notes, documents, and captures.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className={`flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs ${
                isDark ? 'bg-[#181a1d] border-slate-700' : 'bg-[#faf9f5] border-[#d8d6cb]'
              }`}>
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={knowledgeQuery}
                  onChange={(e) => setKnowledgeQuery(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-xs"
                />
              </div>
              <button className={`px-4 py-2.5 rounded-xl text-xs font-medium text-white shadow-sm ${
                isDark ? 'bg-[#405644]' : 'bg-[#3b4d3c]'
              }`}>
                Ask your knowledge
              </button>
            </div>

            <div className="space-y-4 pt-2">
              <div className="text-xs font-semibold">From your workspace</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Your notes list three dimensions to check: the desk's 24 mm edge thickness, 80 mm of clearance behind the monitor, and the display's 100 × 100 mm VESA mount. Confirm the arm's clamp range before ordering.
              </p>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono uppercase text-slate-400">Sources used · 2</span>
                <div className="p-3 rounded-xl border border-slate-700/10 dark:border-slate-800 text-xs space-y-1">
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">Dimensions & measurements</div>
                  <div className="italic text-slate-500">"Rear edge thickness: 24 mm. Available cable gap: 80 mm."</div>
                  <div className="text-[10px] text-slate-400 font-mono">Desk refresh · Note · 11 Oct</div>
                </div>

                <div className="p-3 rounded-xl border border-slate-700/10 dark:border-slate-800 text-xs space-y-1">
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">Monitor arm comparison</div>
                  <div className="italic text-slate-500">"Display mount: VESA 100 × 100 mm. Check clamp range."</div>
                  <div className="text-[10px] text-slate-400 font-mono">Desk refresh · Document · 12 Oct</div>
                </div>
              </div>
            </div>
          </div>

          <div className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm space-y-4 ${
            isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
          }`}>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Your sources · 12 indexed</h3>
              <div className="space-y-2 text-xs font-mono text-slate-500">
                <div>Notes · 6</div>
                <div>Documents · 4</div>
                <div>Vision captures · 2</div>
                <div className="text-emerald-500 font-bold pt-1">Up to date · Indexed locally</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/10 dark:border-slate-800">
              <h4 className="text-xs font-semibold mb-2">Collections</h4>
              <p className="text-[11px] text-slate-400">
                Group sources around a question or topic to narrow what Still can use.
              </p>
              <button className={`w-full mt-3 py-2 rounded-xl text-xs border ${
                isDark ? 'border-slate-700' : 'border-[#d8d6cb]'
              }`}>
                Create collection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 6: FOCUS (PAGE 15) */}
      {activeSubTab === 'focus' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className={`lg:col-span-8 p-8 rounded-3xl border flex flex-col items-center justify-between text-center transition-colors shadow-sm space-y-6 ${
            isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
          }`}>
            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                FOCUS IN PROGRESS
              </span>
              <h2 className="text-2xl font-serif font-medium mt-1">Review desk layout</h2>
              <div className="text-xs text-slate-400 font-mono mt-0.5">Desk refresh · 45-minute session</div>
            </div>

            {/* Circular Countdown Progress Ring */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke={isDark ? '#2e333a' : '#eae7dd'}
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke={isDark ? '#4ade80' : '#3b4d3c'}
                  strokeWidth="8"
                  strokeDasharray="690"
                  strokeDashoffset={690 - (690 * focusSeconds) / (45 * 60)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000"
                />
              </svg>

              <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-mono font-medium tracking-tight">
                  {formatTimer(focusSeconds)}
                </span>
                <span className="text-xs text-slate-400 font-mono mt-1">remaining</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFocusActive(!isFocusActive)}
                className={`px-6 py-2.5 rounded-xl text-xs font-medium text-white shadow-md flex items-center gap-2 ${
                  isDark ? 'bg-[#405644] hover:bg-[#4d6752]' : 'bg-[#3b4d3c] hover:bg-[#2e3c2f]'
                }`}
              >
                {isFocusActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isFocusActive ? 'Pause session' : 'Resume session'}</span>
              </button>

              <button
                onClick={() => {
                  setIsFocusActive(false);
                  setFocusSeconds(45 * 60);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs border ${
                  isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-[#d8d6cb] hover:bg-slate-100'
                }`}
              >
                End session
              </button>
            </div>

            <p className="text-xs text-slate-400 font-mono">
              Still is in quiet mode. Notifications are held until your break.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-6 w-full pt-6 border-t border-slate-700/10 dark:border-slate-800 font-mono text-center">
              <div>
                <div className="text-xl font-bold">2</div>
                <div className="text-[11px] text-slate-400">Sessions today</div>
              </div>
              <div>
                <div className="text-xl font-bold">57 min</div>
                <div className="text-[11px] text-slate-400">Focused today</div>
              </div>
              <div>
                <div className="text-xl font-bold">5 min</div>
                <div className="text-[11px] text-slate-400">Next break</div>
              </div>
            </div>
          </div>

          {/* Right settings drawer */}
          <div className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between transition-colors shadow-sm space-y-4 ${
            isDark ? 'bg-[#212428] border-slate-800' : 'bg-white border-[#e5e3d8]'
          }`}>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Make it your own</h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Focus duration</label>
                  <select 
                    value={focusDuration}
                    onChange={(e) => setFocusDuration(e.target.value)}
                    className={`w-full mt-1 p-2.5 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-[#181a1d] border-slate-700' : 'bg-[#faf9f5] border-[#d8d6cb]'
                    }`}
                  >
                    <option value="25">25 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Break duration</label>
                  <select 
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(e.target.value)}
                    className={`w-full mt-1 p-2.5 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-[#181a1d] border-slate-700' : 'bg-[#faf9f5] border-[#d8d6cb]'
                    }`}
                  >
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                  </select>
                </div>

                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Quiet companion</span>
                    <button
                      onClick={() => setQuietCompanion(!quietCompanion)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        quietCompanion ? 'bg-[#3b4d3c]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        quietCompanion ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Mute non-urgent alerts</span>
                    <button
                      onClick={() => setMuteAlerts(!muteAlerts)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        muteAlerts ? 'bg-[#3b4d3c]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        muteAlerts ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/10 dark:border-slate-800 text-[11px] text-slate-400">
              Safety alerts are never muted.
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
