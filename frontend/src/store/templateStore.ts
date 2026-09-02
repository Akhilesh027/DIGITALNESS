import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProjectTemplate } from '@/data/dummyData';
import { projectTemplates as initialTemplates } from '@/data/templateData';

interface TemplateState {
  templates: ProjectTemplate[];
  addTemplate: (t: ProjectTemplate) => void;
  updateTemplate: (id: string, data: Partial<ProjectTemplate>) => void;
  deleteTemplate: (id: string) => void;
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set) => ({
      templates: initialTemplates,
      addTemplate: (t) => set((s) => ({ templates: [...s.templates, t] })),
      updateTemplate: (id, data) =>
        set((s) => ({ templates: s.templates.map((x) => (x.id === id ? { ...x, ...data } : x)) })),
      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter((x) => x.id !== id) })),
    }),
    { name: 'digitalness-templates-v1' }
  )
);
