import { TemplateEditor } from '@/features/template-editor/components/template-editor';

export const TemplateBuilderPage = () => {
  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Template Builder • EndocrinoPront Pro</h1>
      <TemplateEditor />
    </main>
  );
};
