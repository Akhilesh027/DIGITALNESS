import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProjectTemplate } from '@/data/dummyData';

export type TaskStatus = 'Not Started' | 'In Progress' | 'Review' | 'Completed' | 'Blocked';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface TaskUpdate {
  id: string;
  message: string;
  files: string[];
  timeSpent: number; // hours
  by: string;
  byName?: string;
  createdAt: string;
}

export interface AgencyTask {
  id: string;
  projectId: string;
  customerId?: string;
  title: string;
  description?: string;
  category?: string;
  assignedTo?: string;
  status: TaskStatus;
  priority: TaskPriority;
  slaDays: number;
  startDate: string;
  deadline: string;
  completedAt?: string;
  updates: TaskUpdate[];
  createdAt: string;
}

// Default task playbooks per project type
const PLAYBOOKS: Record<string, { title: string; category: string; days: number }[]> = {
  'Digital Marketing': [
    { title: 'Audience Research', category: 'Research', days: 2 },
    { title: 'Ad Copy Drafts', category: 'Content Writing', days: 2 },
    { title: 'Creative Design', category: 'Design', days: 3 },
    { title: 'Campaign Setup (Meta/Google)', category: 'Ad Campaign', days: 2 },
    { title: 'Optimization & Reporting', category: 'Ad Campaign', days: 5 },
  ],
  'Website Design': [
    { title: 'Sitemap & Wireframes', category: 'Design', days: 3 },
    { title: 'UI Design', category: 'Design', days: 5 },
    { title: 'Frontend Build', category: 'Website', days: 7 },
    { title: 'CMS & Content', category: 'Website', days: 4 },
    { title: 'QA & Launch', category: 'Website', days: 2 },
  ],
  'App Development': [
    { title: 'UX Flows', category: 'Design', days: 4 },
    { title: 'UI Screens', category: 'Design', days: 6 },
    { title: 'Frontend Build', category: 'App Feature', days: 14 },
    { title: 'Backend API', category: 'App Feature', days: 10 },
    { title: 'QA & Release', category: 'App Feature', days: 5 },
  ],
  'Promotion Video': [
    { title: 'Script & Storyboard', category: 'Content Writing', days: 3 },
    { title: 'Shoot', category: 'Video', days: 2 },
    { title: 'First Cut', category: 'Video', days: 4 },
    { title: 'Final Edit & Color', category: 'Video', days: 3 },
  ],
  SEO: [
    { title: 'Site Audit', category: 'SEO', days: 3 },
    { title: 'On-page Fixes', category: 'SEO', days: 7 },
    { title: 'Backlinks', category: 'SEO', days: 20 },
    { title: 'Reporting', category: 'SEO', days: 2 },
  ],
};

export function tasksFromTemplate(
  template: ProjectTemplate,
  projectId: string,
  customerId?: string,
  assignedTo?: string
): AgencyTask[] {
  const start = new Date();
  let cursor = 0;
  return template.defaultDeliverables.map((d, i) => {
    cursor += d.days;
    const dl = new Date(start);
    dl.setDate(dl.getDate() + cursor);
    return {
      id: `TASK${Date.now()}${i}`,
      projectId,
      customerId,
      title: d.title,
      category: d.category,
      assignedTo,
      status: 'Not Started' as TaskStatus,
      priority: 'Medium' as TaskPriority,
      slaDays: d.days,
      startDate: start.toISOString().split('T')[0],
      deadline: dl.toISOString().split('T')[0],
      updates: [],
      createdAt: new Date().toISOString(),
    };
  });
}

export function tasksFromProjectType(
  type: string,
  projectId: string,
  customerId?: string,
  assignedTo?: string
): AgencyTask[] {
  const pb = PLAYBOOKS[type];
  if (!pb) return [];
  const start = new Date();
  let cursor = 0;
  return pb.map((d, i) => {
    cursor += d.days;
    const dl = new Date(start);
    dl.setDate(dl.getDate() + cursor);
    return {
      id: `TASK${Date.now()}${i}`,
      projectId,
      customerId,
      title: d.title,
      category: d.category,
      assignedTo,
      status: 'Not Started' as TaskStatus,
      priority: 'Medium' as TaskPriority,
      slaDays: d.days,
      startDate: start.toISOString().split('T')[0],
      deadline: dl.toISOString().split('T')[0],
      updates: [],
      createdAt: new Date().toISOString(),
    };
  });
}

export function isOverdue(t: AgencyTask): boolean {
  if (t.status === 'Completed') return false;
  return new Date(t.deadline) < new Date(new Date().toDateString());
}

export function daysToDeadline(t: AgencyTask): number {
  const ms = new Date(t.deadline).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

const seedTasks: AgencyTask[] = [
  {
    id: 'TASK001', projectId: 'PROJ001', customerId: 'CUST001',
    title: 'Homepage Hero Design', category: 'Design',
    assignedTo: 'EMP007', status: 'In Progress', priority: 'High',
    slaDays: 5, startDate: '2024-12-02', deadline: '2024-12-09',
    updates: [
      {
        id: 'U001', message: 'Shared first iteration with the team', files: ['hero-v1.png'],
        timeSpent: 4, by: 'EMP007', byName: 'Arjun Patel', createdAt: '2024-12-05T16:00:00',
      },
    ],
    createdAt: '2024-12-02T10:00:00',
  },
  {
    id: 'TASK002', projectId: 'PROJ001', customerId: 'CUST001',
    title: 'CMS Integration', category: 'Website',
    assignedTo: 'EMP005', status: 'Not Started', priority: 'Medium',
    slaDays: 5, startDate: '2024-12-08', deadline: '2024-12-14',
    updates: [], createdAt: '2024-12-02T10:00:00',
  },
  {
    id: 'TASK003', projectId: 'PROJ003', customerId: 'CUST003',
    title: 'December Content Calendar', category: 'Content Writing',
    assignedTo: 'EMP006', status: 'Completed', priority: 'Medium',
    slaDays: 2, startDate: '2024-11-28', deadline: '2024-11-30',
    completedAt: '2024-11-30',
    updates: [
      { id: 'U002', message: 'Calendar approved by client', files: [], timeSpent: 3,
        by: 'EMP006', byName: 'Lakshmi Naidu', createdAt: '2024-11-30T17:00:00' },
    ],
    createdAt: '2024-11-28T09:00:00',
  },
  {
    id: 'TASK004', projectId: 'PROJ004', customerId: 'CUST004',
    title: 'Backend API - Attendance', category: 'App Feature',
    assignedTo: 'EMP005', status: 'In Progress', priority: 'Urgent',
    slaDays: 7, startDate: '2024-11-20', deadline: '2024-11-29',
    updates: [], createdAt: '2024-11-20T10:00:00',
  },
];

interface TaskState {
  tasks: AgencyTask[];
  addTask: (t: AgencyTask) => void;
  addTasks: (ts: AgencyTask[]) => void;
  updateTask: (id: string, data: Partial<AgencyTask>) => void;
  deleteTask: (id: string) => void;
  addUpdate: (taskId: string, u: TaskUpdate) => void;
  forProject: (projectId: string) => AgencyTask[];
  progress: (projectId: string) => { total: number; done: number; pct: number };
  employeeStats: (employeeId: string) => {
    completionRate: number; delayRate: number; total: number;
  };
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: seedTasks,
      addTask: (t) => set((s) => ({ tasks: [...s.tasks, t] })),
      addTasks: (ts) => set((s) => ({ tasks: [...s.tasks, ...ts] })),
      updateTask: (id, data) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t, ...data,
                  completedAt:
                    data.status === 'Completed'
                      ? (t.completedAt || new Date().toISOString().split('T')[0])
                      : data.status
                        ? undefined
                        : t.completedAt,
                }
              : t
          ),
        })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      addUpdate: (taskId, u) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, updates: [...t.updates, u] } : t
          ),
        })),
      forProject: (projectId) => get().tasks.filter((t) => t.projectId === projectId),
      progress: (projectId) => {
        const ts = get().tasks.filter((t) => t.projectId === projectId);
        const done = ts.filter((t) => t.status === 'Completed').length;
        const total = ts.length;
        return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
      },
      employeeStats: (employeeId) => {
        const ts = get().tasks.filter((t) => t.assignedTo === employeeId);
        const total = ts.length;
        const done = ts.filter((t) => t.status === 'Completed').length;
        const delayed = ts.filter(
          (t) =>
            t.status !== 'Completed' && new Date(t.deadline) < new Date(new Date().toDateString())
        ).length;
        return {
          total,
          completionRate: total ? Math.round((done / total) * 100) : 0,
          delayRate: total ? Math.round((delayed / total) * 100) : 0,
        };
      },
    }),
    { name: 'digitalness-tasks-v1' }
  )
);
