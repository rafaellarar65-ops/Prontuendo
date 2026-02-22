import { PageState } from '@/components/domain/page-state';
import {
  useTemplateBuilderElementsQuery,
  useTemplateBuilderVariablesQuery,
} from '@/features/template-builder/use-template-builder-query';

export const TemplateBuilderPage = () => {
  const { data: elements, isLoading: loadingElements, isError: errorElements } = useTemplateBuilderElementsQuery();
  const { data: variables, isLoading: loadingVariables, isError: errorVariables } = useTemplateBuilderVariablesQuery();

  const isLoading = loadingElements || loadingVariables;
  const isError = errorElements || errorVariables;

  return (
    <main className="grid gap-4 p-6 lg:grid-cols-[260px_1fr_280px]">
      <aside className="rounded-lg border bg-white p-4">
        <h2 className="font-medium">Elementos</h2>
        {isLoading ? <PageState title="Carregando" description="Carregando toolbox..." /> : null}
        {isError ? <PageState title="Erro" description="Falha ao carregar elementos." /> : null}
        {!isLoading && !isError && elements ? (
          <ul className="mt-2 space-y-2 text-sm">
            {elements.map((element) => (
              <li className="rounded border px-2 py-1" key={element.id}>
                {element.label}
              </li>
            ))}
          </ul>
        ) : null}
      </aside>

      <section className="rounded-lg border bg-white p-4">
        <h1 className="text-2xl font-semibold">Template Builder</h1>
        <p className="text-sm text-muted-foreground">Canvas Fabric.js será conectado no próximo incremento.</p>
        <div className="mt-4 flex min-h-80 items-center justify-center rounded-lg border border-dashed">
          Área de canvas drag-and-drop (placeholder)
        </div>
      </section>

      <aside className="rounded-lg border bg-white p-4">
        <h2 className="font-medium">Variáveis</h2>
        {isLoading ? <PageState title="Carregando" description="Carregando variáveis..." /> : null}
        {isError ? <PageState title="Erro" description="Falha ao carregar variáveis." /> : null}
        {!isLoading && !isError && variables ? (
          <ul className="mt-2 space-y-2 text-sm">
            {variables.map((variable) => (
              <li className="rounded border px-2 py-1" key={variable.id}>
                <p className="font-medium">{variable.token}</p>
                <p className="text-xs text-muted-foreground">{variable.description}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </aside>
    </main>
  );
};
