import React, { useState } from 'react';
import { BookOpen, CheckSquare, Square, Plus, Sparkles } from 'lucide-react';

interface NotionTask {
  id: string;
  title: string;
  completed: boolean;
  tag: 'firmware' | 'ai' | 'hardware' | 'wellness';
  assignedTo: string;
}

interface NotionWorkspaceProps {
  onTaskToggle: (taskId: string, title: string, completed: boolean) => void;
  onAddTask: (title: string) => void;
}

export const NotionWorkspace: React.FC<NotionWorkspaceProps> = ({ onTaskToggle, onAddTask }) => {
  const [tasks, setTasks] = useState<NotionTask[]>([
    { id: '1', title: 'Verify Pico UART CRC parity packets', completed: true, tag: 'firmware', assignedTo: 'Alex' },
    { id: '2', title: 'Calibrate Desk Companion edge detection sensors', completed: true, tag: 'hardware', assignedTo: 'AI Robot' },
    { id: '3', title: 'Integrate Groq Llama-3.3-70B function calling', completed: false, tag: 'ai', assignedTo: 'You' },
    { id: '4', title: 'Set up Model Context Protocol (MCP) tool endpoints', completed: false, tag: 'ai', assignedTo: 'AI Companion' },
    { id: '5', title: 'Ergonomic posture break: stretch shoulders', completed: false, tag: 'wellness', assignedTo: 'Executive Agent' }
  ]);
  const [newTitle, setNewTitle] = useState('');

  const toggleTask = (t: NotionTask) => {
    const updated = !t.completed;
    setTasks((prev) => prev.map((item) => item.id === t.id ? { ...item, completed: updated } : item));
    onTaskToggle(t.id, t.title, updated);
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    const newTask: NotionTask = {
      id: Date.now().toString(),
      title: newTitle,
      completed: false,
      tag: 'ai',
      assignedTo: 'You'
    };
    setTasks((prev) => [...prev, newTask]);
    onAddTask(newTitle);
    setNewTitle('');
  };

  const tagColors: Record<string, string> = {
    firmware: 'bg-amber-950 text-amber-300 border-amber-800',
    ai: 'bg-purple-950 text-purple-300 border-purple-800',
    hardware: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    wellness: 'bg-emerald-950 text-emerald-300 border-emerald-800'
  };

  return (
    <div className="flex flex-col h-full bg-[#191919] text-slate-200 rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-sans text-xs">
      {/* Notion Top Nav */}
      <div className="bg-[#202020] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-300" />
          <span className="font-semibold text-white">Notion Workspace — MDP Hardware & AI Sprint</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
          <Sparkles className="w-3 h-3" />
          <span>Executive Agent Connected</span>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* Document Header */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-100">📋 Engineering Roadmap & Sprint Tasks</h2>
          <p className="text-slate-400 text-[11px]">
            Synced with local AI Desk Companion agentic task runner. Tasks checked here update agent agenda in real time.
          </p>
        </div>

        {/* Task List */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sprint Backlog</div>
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task)}
              className="flex items-center gap-2.5 p-2 rounded-lg bg-[#222222] hover:bg-[#282828] border border-slate-800/80 cursor-pointer transition-colors group"
            >
              <button className="text-slate-400 group-hover:text-cyan-400">
                {task.completed ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
              </button>
              <span className={`flex-1 ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                {task.title}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${tagColors[task.tag]}`}>
                {task.tag}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {task.assignedTo}
              </span>
            </div>
          ))}
        </div>

        {/* Add Task Input */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add new task for AI Companion or Team..."
            className="flex-1 bg-[#222222] border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>
    </div>
  );
};
