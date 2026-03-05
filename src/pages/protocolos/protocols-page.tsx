import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Save, Syringe, Trash2 } from 'lucide-react';
import { ClinicalPageShell } from '@/components/app/clinical-page-shell';
import { useCreateProtocolMutation, useUpdateProtocolMutation } from '@/features/protocols/use-protocol-mutations';
import { useProtocolsQuery } from '@/features/protocols/use-protocols-query';
import type { ProtocolMedication, ProtocolPayload, ProtocolStep } from '@/types/clinical-modules';

type FormState = {
  name: string;
  description: string;
  targetCondition: string;
  status: string;
  version: string;
  inclusionCriteria: string;
  references: string;
  steps: ProtocolStep[];
  medications: ProtocolMedication[];
};

const endocrineConditions = [
  'Diabetes Mellitus Tipo 2',
  'Diabetes Mellitus Tipo 1',
  'Obesidade',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome dos Ovários Policísticos',
  'Osteoporose',
  'Insuficiência Adrenal',
  'Acromegalia',
];

const statusOptions = ['Ativo', 'Em revisão', 'Arquivado'];

const createEmptyStep = (order: number): ProtocolStep => ({
  title: '',
  description: '',
  order,
});

const createEmptyMedication = (): ProtocolMedication => ({
  name: '',
  dosage: '',
  frequency: '',
  route: '',
});

const createEmptyForm = (): FormState => ({
  name: '',
  description: '',
  targetCondition: '',
  status: 'Ativo',
  version: '1.0',
  inclusionCriteria: '',
  references: '',
  steps: [createEmptyStep(1)],
  medications: [createEmptyMedication()],
});

const parseMultiline = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const mapPayloadToForm = (payload: ProtocolPayload): FormState => ({
  name: payload.name,
  description: payload.description ?? '',
  targetCondition: payload.targetCondition ?? '',
  status: payload.status ?? 'Ativo',
  version: payload.version ?? '1.0',
  inclusionCriteria: (payload.inclusionCriteria ?? []).join('\n'),
  references: (payload.references ?? []).join('\n'),
  steps: payload.steps?.length ? [...payload.steps].sort((a, b) => a.order - b.order) : [createEmptyStep(1)],
  medications: payload.medications?.length ? payload.medications : [createEmptyMedication()],
});

const mapFormToPayload = (form: FormState): ProtocolPayload => ({
  name: form.name.trim(),
  description: form.description.trim(),
  targetCondition: form.targetCondition,
  status: form.status,
  version: form.version.trim(),
  inclusionCriteria: parseMultiline(form.inclusionCriteria),
  references: parseMultiline(form.references),
  steps: form.steps
    .map((step, index) => ({
      title: step.title.trim(),
      description: step.description.trim(),
      order: index + 1,
    }))
    .filter((step) => step.title || step.description),
  medications: form.medications
    .map((medication) => {
      const name = medication.name.trim();
      const dosage = medication.dosage?.trim();
      const frequency = medication.frequency?.trim();
      const route = medication.route?.trim();

      return {
        name,
        ...(dosage ? { dosage } : {}),
        ...(frequency ? { frequency } : {}),
        ...(route ? { route } : {}),
      };
    })
    .filter((medication) => medication.name),
});

const statusStyles: Record<string, string> = {
  Ativo: 'bg-emerald-50 text-emerald-700',
  'Em revisão': 'bg-amber-50 text-amber-700',
  Arquivado: 'bg-slate-100 text-slate-700',
};

export const ProtocolsPage = () => {
  const { data = [], isLoading, isError } = useProtocolsQuery();
  const { mutate: createProtocol, isPending: isCreating } = useCreateProtocolMutation();
  const { mutate: updateProtocol, isPending: isUpdating } = useUpdateProtocolMutation();

  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(createEmptyForm());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filtered = useMemo(() => {
    return data.filter((protocol) => {
      const nameMatch = protocol.payload.name.toLowerCase().includes(search.toLowerCase().trim());
      const conditionMatch =
        conditionFilter === 'all' || protocol.payload.targetCondition?.toLowerCase() === conditionFilter.toLowerCase();
      return nameMatch && conditionMatch;
    });
  }, [conditionFilter, data, search]);

  const resetModal = () => {
    setForm(createEmptyForm());
    setEditingId(null);
    setIsModalOpen(false);
  };

  const openCreateModal = () => {
    setFeedback(null);
    setEditingId(null);
    setForm(createEmptyForm());
    setIsModalOpen(true);
  };

  const openEditModal = (id: string, payload: ProtocolPayload) => {
    setFeedback(null);
    setEditingId(id);
    setForm(mapPayloadToForm(payload));
    setIsModalOpen(true);
  };

  const updateFormField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    setForm((current) => {
      const next = [...current.steps];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return current;
      const currentStep = next[index];
      const targetStep = next[target];
      if (!currentStep || !targetStep) return current;
      next[index] = targetStep;
      next[target] = currentStep;
      return {
        ...current,
        steps: next.map((step, idx) => ({ ...step, order: idx + 1 })),
      };
    });
  };

  const handleSave = () => {
    const payload = mapFormToPayload(form);

    if (!payload.name || !payload.targetCondition) {
      setFeedback({ type: 'error', message: 'Nome e condição-alvo são obrigatórios.' });
      return;
    }

    if (editingId) {
      updateProtocol(
        { id: editingId, payload },
        {
          onSuccess: () => {
            setFeedback({ type: 'success', message: 'Protocolo atualizado com sucesso.' });
            resetModal();
          },
          onError: () => setFeedback({ type: 'error', message: 'Falha ao atualizar protocolo.' }),
        },
      );
      return;
    }

    createProtocol(payload, {
      onSuccess: () => {
        setFeedback({ type: 'success', message: 'Protocolo criado com sucesso.' });
        resetModal();
      },
      onError: () => setFeedback({ type: 'error', message: 'Falha ao criar protocolo.' }),
    });
  };

  const isMutating = isCreating || isUpdating;

  return (
    <ClinicalPageShell
      subtitle="Protocolos clínicos da prática"
      title="Protocolos"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && !isError && filtered.length === 0}
    >
      <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_280px_auto]">
          <input
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            placeholder="Buscar por nome do protocolo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={conditionFilter}
            onChange={(event) => setConditionFilter(event.target.value)}
          >
            <option value="all">Todas as condições-alvo</option>
            {endocrineConditions.map((condition) => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus size={15} /> Novo protocolo
          </button>
        </div>

        {feedback ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <section className="grid gap-3 md:grid-cols-2">
          {filtered.map((protocol) => {
            const { payload } = protocol;
            const badgeStyle = statusStyles[payload.status ?? 'Ativo'] ?? 'bg-slate-100 text-slate-700';

            return (
              <article key={protocol.id} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{payload.name}</h3>
                    <p className="text-xs text-slate-500">{payload.targetCondition ?? 'Condição não definida'}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeStyle}`}>{payload.status ?? 'Ativo'}</span>
                </div>

                <p className="mb-3 line-clamp-2 text-sm text-slate-600">{payload.description || 'Sem descrição cadastrada.'}</p>

                <div className="mb-4 grid grid-cols-3 gap-2 text-xs text-slate-600">
                  <div className="rounded-lg bg-slate-50 px-2 py-2 text-center">
                    <p className="font-semibold text-slate-800">v{payload.version ?? '1.0'}</p>
                    <p>Versão</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2 py-2 text-center">
                    <p className="font-semibold text-slate-800">{payload.steps?.length ?? 0}</p>
                    <p>Etapas</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2 py-2 text-center">
                    <p className="font-semibold text-slate-800">{payload.medications?.length ?? 0}</p>
                    <p>Medicações</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openEditModal(protocol.id, payload)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Pencil size={13} /> Editar protocolo
                </button>
              </article>
            );
          })}
        </section>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <h2 className="text-base font-semibold text-slate-800">{editingId ? 'Editar protocolo' : 'Novo protocolo'}</h2>
              <button type="button" onClick={resetModal} className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">
                Fechar
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome</label>
                  <input value={form.name} onChange={(event) => updateFormField('name', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Condição-alvo</label>
                  <select value={form.targetCondition} onChange={(event) => updateFormField('targetCondition', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm">
                    <option value="">Selecione</option>
                    {endocrineConditions.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                  <select value={form.status} onChange={(event) => updateFormField('status', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm">
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Versão</label>
                  <input value={form.version} onChange={(event) => updateFormField('version', event.target.value)} placeholder="1.0" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Descrição</label>
                <textarea value={form.description} onChange={(event) => updateFormField('description', event.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Critérios de inclusão (um por linha)</label>
                  <textarea value={form.inclusionCriteria} onChange={(event) => updateFormField('inclusionCriteria', event.target.value)} rows={4} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Referências (uma por linha)</label>
                  <textarea value={form.references} onChange={(event) => updateFormField('references', event.target.value)} rows={4} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">Etapas do protocolo</h3>
                  <button type="button" onClick={() => updateFormField('steps', [...form.steps, createEmptyStep(form.steps.length + 1)])} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <Plus size={13} /> Adicionar etapa
                  </button>
                </div>

                {form.steps.map((step, index) => (
                  <div key={`${index}-${step.order}`} className="space-y-2 rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-500">Etapa {index + 1}</p>
                      <div className="flex items-center gap-1">
                        <button type="button" disabled={index === 0} onClick={() => moveStep(index, 'up')} className="rounded border px-1.5 py-1 text-slate-600 disabled:opacity-40"><ArrowUp size={13} /></button>
                        <button type="button" disabled={index === form.steps.length - 1} onClick={() => moveStep(index, 'down')} className="rounded border px-1.5 py-1 text-slate-600 disabled:opacity-40"><ArrowDown size={13} /></button>
                        <button
                          type="button"
                          disabled={form.steps.length === 1}
                          onClick={() =>
                            updateFormField(
                              'steps',
                              form.steps
                                .filter((_, currentIndex) => currentIndex !== index)
                                .map((item, itemIndex) => ({ ...item, order: itemIndex + 1 })),
                            )
                          }
                          className="rounded border px-1.5 py-1 text-rose-600 disabled:opacity-40"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <input
                      value={step.title}
                      onChange={(event) =>
                        updateFormField(
                          'steps',
                          form.steps.map((item, currentIndex) =>
                            currentIndex === index ? { ...item, title: event.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Título da etapa"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <textarea
                      value={step.description}
                      onChange={(event) =>
                        updateFormField(
                          'steps',
                          form.steps.map((item, currentIndex) =>
                            currentIndex === index ? { ...item, description: event.target.value } : item,
                          ),
                        )
                      }
                      rows={2}
                      placeholder="Descrição da conduta"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Syringe size={14} /> Medicações relacionadas
                  </h3>
                  <button type="button" onClick={() => updateFormField('medications', [...form.medications, createEmptyMedication()])} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <Plus size={13} /> Adicionar medicação
                  </button>
                </div>

                {form.medications.map((medication, index) => (
                  <div key={`med-${index}`} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
                    <input
                      value={medication.name}
                      onChange={(event) =>
                        updateFormField(
                          'medications',
                          form.medications.map((item, currentIndex) =>
                            currentIndex === index ? { ...item, name: event.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Nome"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      value={medication.dosage ?? ''}
                      onChange={(event) =>
                        updateFormField(
                          'medications',
                          form.medications.map((item, currentIndex) =>
                            currentIndex === index ? { ...item, dosage: event.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Dosagem"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      value={medication.frequency ?? ''}
                      onChange={(event) =>
                        updateFormField(
                          'medications',
                          form.medications.map((item, currentIndex) =>
                            currentIndex === index ? { ...item, frequency: event.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Frequência"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      value={medication.route ?? ''}
                      onChange={(event) =>
                        updateFormField(
                          'medications',
                          form.medications.map((item, currentIndex) =>
                            currentIndex === index ? { ...item, route: event.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Via"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={form.medications.length === 1}
                      onClick={() => updateFormField('medications', form.medications.filter((_, currentIndex) => currentIndex !== index))}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 text-rose-600 disabled:opacity-40"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button type="button" onClick={resetModal} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save size={14} /> {isMutating ? 'Salvando...' : 'Salvar protocolo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </ClinicalPageShell>
  );
};
