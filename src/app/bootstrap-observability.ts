export type BootstrapErrorContext = {
  source: 'window.error' | 'window.unhandledrejection' | 'bootstrap.render' | 'bootstrap.service-worker';
  message: string;
  stack: string | undefined;
  details: Record<string, unknown> | undefined;
};

type ErrorPayload = BootstrapErrorContext & {
  route: string;
  userAgent: string;
  buildVersion: string;
  timestamp: string;
};

const OBSERVABILITY_ENDPOINT = import.meta.env.VITE_OBSERVABILITY_ENDPOINT;
const BUILD_VERSION =
  import.meta.env.VITE_APP_VERSION ??
  import.meta.env.VITE_BUILD_VERSION ??
  import.meta.env.VITE_COMMIT_SHA ??
  'unknown';

const FALLBACK_ELEMENT_ID = 'bootstrap-fatal-fallback';

function getRoute(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Erro desconhecido no bootstrap';
}

function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }

  return undefined;
}

function formatPayload(context: BootstrapErrorContext): ErrorPayload {
  return {
    ...context,
    route: getRoute(),
    userAgent: navigator.userAgent,
    buildVersion: BUILD_VERSION,
    timestamp: new Date().toISOString(),
  };
}

async function sendToObservability(payload: ErrorPayload): Promise<void> {
  if (!OBSERVABILITY_ENDPOINT) {
    console.error('[bootstrap-critical-error]', payload);
    return;
  }

  try {
    await fetch(OBSERVABILITY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    console.error('[bootstrap-critical-error]', payload);
  }
}

function getOrCreateFallback(): HTMLElement {
  const existing = document.getElementById(FALLBACK_ELEMENT_ID);
  if (existing) {
    return existing;
  }

  const fallback = document.createElement('div');
  fallback.id = FALLBACK_ELEMENT_ID;
  fallback.setAttribute('role', 'alert');
  fallback.style.minHeight = '100vh';
  fallback.style.display = 'flex';
  fallback.style.alignItems = 'center';
  fallback.style.justifyContent = 'center';
  fallback.style.padding = '24px';
  fallback.style.background = '#f8fafc';
  fallback.style.color = '#0f172a';
  fallback.style.fontFamily = 'Inter, system-ui, -apple-system, Segoe UI, sans-serif';
  fallback.innerHTML = `
    <div style="max-width: 560px; text-align: center;">
      <h1 style="font-size: 1.375rem; margin: 0 0 8px;">Não foi possível carregar a aplicação</h1>
      <p style="margin: 0 0 12px; line-height: 1.5;">
        Tivemos um problema inesperado na inicialização. Recarregue a página para tentar novamente.
      </p>
      <small style="opacity: .75;">Se o problema continuar, entre em contato com o suporte.</small>
    </div>
  `;

  return fallback;
}

export function showBootstrapFallback(): void {
  const fallback = getOrCreateFallback();
  const root = document.getElementById('root');

  if (root) {
    root.replaceChildren(fallback);
    return;
  }

  document.body.appendChild(fallback);
}

export function reportBootstrapCriticalError(context: BootstrapErrorContext): void {
  const payload = formatPayload(context);
  void sendToObservability(payload);
}

export function registerBootstrapErrorListeners(): void {
  window.addEventListener('error', (event) => {
    reportBootstrapCriticalError({
      source: 'window.error',
      message: event.message || getErrorMessage(event.error),
      stack: getErrorStack(event.error),
      details: {
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
      },
    });
    showBootstrapFallback();
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportBootstrapCriticalError({
      source: 'window.unhandledrejection',
      message: getErrorMessage(event.reason),
      stack: getErrorStack(event.reason),
      details: undefined,
    });
    showBootstrapFallback();
  });
}
