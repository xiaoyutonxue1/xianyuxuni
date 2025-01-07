import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Template {
  id: string;
  name: string;
  title: string;
  description: string;
  isDefault: boolean;
  createdAt: string;
}

interface TemplateState {
  templates: Template[];
  defaultTemplate: Template | null;
  addTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'isDefault'>) => void;
  updateTemplate: (id: string, template: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
  setDefaultTemplate: (id: string) => void;
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set) => ({
      templates: [
        {
          id: '1',
          name: '标准模板',
          title: '【正版资源】{title}',
          description: '✨ {description}\n\n【资源简介】本资源为正版\n【字幕】中英双字幕\n【质量简介】本集一\n\n【发货说明】\n1. 价格为标价\n2. 扫码付款，百度网盘+飞机群发货，可在线观看可下载\n3. 支付后自动发货，无需在线，扫码上就可以看',
          isDefault: true,
          createdAt: '2024-03-20',
        }
      ],
      defaultTemplate: null,
      addTemplate: (template) =>
        set((state) => ({
          templates: [
            ...state.templates,
            {
              ...template,
              id: Date.now().toString(),
              createdAt: new Date().toISOString().split('T')[0],
              isDefault: false,
            },
          ],
        })),
      updateTemplate: (id, template) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...template } : t
          ),
        })),
      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),
      setDefaultTemplate: (id) =>
        set((state) => ({
          templates: state.templates.map((t) => ({
            ...t,
            isDefault: t.id === id,
          })),
          defaultTemplate: state.templates.find((t) => t.id === id) || null,
        })),
    }),
    {
      name: 'template-storage',
      partialize: (state) => ({
        templates: state.templates,
        defaultTemplate: state.defaultTemplate,
      }),
    }
  )
); 