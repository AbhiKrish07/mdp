export type AgentRole = 'coder' | 'researcher' | 'executive' | 'robot';

export interface AgentInfo {
  id: AgentRole;
  name: string;
  title: string;
  avatar: string;
  color: string;
  status: 'idle' | 'thinking' | 'acting' | 'waiting';
  currentTask?: string;
  toolsUsedCount: number;
}

export interface ToolCallRecord {
  id: string;
  timestamp: string;
  agent: AgentRole;
  toolName: string;
  input: Record<string, any>;
  output: Record<string, any>;
  status: 'success' | 'running' | 'error';
  executionMs: number;
}

export interface ThoughtStep {
  id: string;
  timestamp: string;
  agent: AgentRole;
  thought: string;
  action?: string;
  toolCallId?: string;
}

export interface IntegrationService {
  id: string;
  name: string;
  category: 'devtools' | 'collaboration' | 'notes' | 'system' | 'hardware';
  status: 'connected' | 'simulated' | 'disconnected';
  icon: string;
  description: string;
  lastActive: string;
  metrics: Record<string, string | number>;
}

export type VirtualAppId = 'vscode' | 'terminal' | 'slack' | 'notion' | 'calendar' | 'system' | 'integrations';
