import type { ReactNode } from 'react';
import { PageState } from '@/components/domain/page-state';

interface ClinicalPageShellProps {
  title: string;
  subtitle: string;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  children?: ReactNode;
}

export const ClinicalPageShell = ({
  title,
  subtitle,
  isLoading = false,
  isError = false,
  isEmpty = false,
  children,
}: ClinicalPageShellProps) => (
  <main className="space-y-4 p-6">
    <header>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </header>

    {isLoading ? <PageState title="Carregando" description="Buscando dados da página..." /> : null}
    {isError ? <PageState title="Erro" description="Falha ao carregar os dados." /> : null}
    {isEmpty ? <PageState title="Sem dados" description="Não há registros para exibir." /> : null}

    {!isLoading && !isError && !isEmpty ? children : null}
  </main>
);
