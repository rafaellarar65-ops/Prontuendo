import { useMemo, useState } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { aiApi } from '@/lib/api/ai-api';
import type { Patient } from '@/types/api';

type OperationKey = 'analyzeExams' | 'suggestProtocol' | 'prescriptionCheck' | 'patientEvolution';

type OperationConfig = {
  key: OperationKey;
  label: string;
  actionLabel: string;
  loadingLabel: string;
  emptyLabel: string;
};

const OPERATIONS: OperationConfig[] = [
  {
    key: 'analyzeExams',
    label: 'Analisar exames',
    actionLabel: 'Analisar exames',
    loadingLabel: 'Analisando exames...',
    emptyLabel: 'Nenhum resultado de análise de exames ainda.',
  },
  {
    key: 'suggestProtocol',
    label: 'Sugerir protocolo',
    actionLabel: 'Sugerir protocolo',
    loadingLabel: 'Sugerindo protocolo...',
    emptyLabel: 'Nenhum protocolo sugerido ainda.',
  },
  {
    key: 'prescriptionCheck',
    label: 'Verificar prescrição',
    actionLabel: 'Verificar prescrição',
    loadingLabel: 'Verificando prescrição...',
    emptyLabel: 'Nenhuma verificação de prescrição ainda.',
  },
  {
    key: 'patientEvolution',
    label: 'Evolução do paciente',
    actionLabel: 'Gerar evolução',
    loadingLabel: 'Gerando evolução...',
    emptyLabel: 'Nenhuma evolução gerada ainda.',
  },
];

const EMPTY_STATE = {
  analyzeExams: null,
  suggestProtocol: null,
  prescriptionCheck: null,
  patientEvolution: null,
};

export const AiAssistantPanel = ({ patient }: { patient: Patient | null }) => {
  const [activeTab, setActiveTab] = useState<OperationKey>('analyzeExams');
  const [results, setResults] = useState<Record<OperationKey, unknown | null>>(EMPTY_STATE);
  const [errors, setErrors] = useState<Record<OperationKey, string>>({
    analyzeExams: '',
    suggestProtocol: '',
    prescriptionCheck: '',
    patientEvolution: '',
  });
  const [loading, setLoading] = useState<Record<OperationKey, boolean>>({
    analyzeExams: false,
    suggestProtocol: false,
    prescriptionCheck: false,
    patientEvolution: false,
  });

  const patientId = patient?.id;

  const handlers = useMemo(
    () => ({
      analyzeExams: aiApi.analyzeExams,
      suggestProtocol: aiApi.suggestProtocol,
      prescriptionCheck: aiApi.prescriptionCheck,
      patientEvolution: aiApi.patientEvolution,
    }),
    [],
  );

  const runOperation = async (key: OperationKey) => {
    if (!patientId) return;

    setLoading((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: '' }));

    try {
      const result = await handlers[key](patientId);
      setResults((prev) => ({ ...prev, [key]: result }));
      setActiveTab(key);
    } catch {
      setErrors((prev) => ({ ...prev, [key]: 'Erro ao executar a operação de IA. Tente novamente.' }));
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const activeOperation = OPERATIONS.find((operation) => operation.key === activeTab) ?? OPERATIONS[0]!;
  const activeResult = results[activeOperation.key];

  return (
    <aside className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Bot size={18} className="text-indigo-600" />
        <h2 className="font-semibold text-slate-800">Assistente IA</h2>
      </div>

      <p className="text-xs text-slate-500">
        Execute ações rápidas por operação. Cada resultado é armazenado separadamente.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {OPERATIONS.map((operation) => (
          <button
            key={operation.key}
            type="button"
            onClick={() => void runOperation(operation.key)}
            disabled={loading[operation.key] || !patientId}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading[operation.key] ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}
            {loading[operation.key] ? operation.loadingLabel : operation.actionLabel}
          </button>
        ))}
      </div>

      {!patientId && <p className="text-xs text-amber-600">Selecione um paciente para usar o assistente.</p>}

      <div className="space-y-3">
        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
          {OPERATIONS.map((operation) => (
            <button
              key={operation.key}
              type="button"
              onClick={() => setActiveTab(operation.key)}
              className={`rounded-md px-2 py-1 text-xs transition ${
                operation.key === activeTab
                  ? 'bg-white font-semibold text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:bg-white/70'
              }`}
            >
              {operation.label}
            </button>
          ))}
        </div>

        {errors[activeOperation.key] && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{errors[activeOperation.key]}</p>
        )}

        {!activeResult && !errors[activeOperation.key] && (
          <p className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-xs text-slate-500">
            {activeOperation.emptyLabel}
          </p>
        )}

        {activeResult !== null && (
          <pre className="max-h-72 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
            {JSON.stringify(activeResult, null, 2)}
          </pre>
        )}
      </div>
    </aside>
  );
};
