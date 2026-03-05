import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Pill, Plus, Search, ShieldAlert, Trash2, XCircle } from 'lucide-react';
import { ClinicalPageShell } from '@/components/app/clinical-page-shell';
import { usePatientsQuery } from '@/features/patients/use-patients-query';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Patient } from '@/types/api';

type PrescriptionStatus = 'ATIVA' | 'RENOVADA' | 'CANCELADA';

interface PrescriptionItem {
  id: string;
  drugName: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  instructions: string;
  isControlled: boolean;
  quantity: number;
}

interface Prescription {
  id: string;
  patientId: string;
  createdAt: string;
  status: PrescriptionStatus;
  validUntil?: string;
  signature: string;
  items: PrescriptionItem[];
}

const drugTemplates = [
  { name: 'Metformina 850mg', dose: '850mg', route: 'VO', frequency: '12/12h', duration: '90 dias' },
  { name: 'Semaglutida 1mg', dose: '1mg', route: 'SC', frequency: '1x por semana', duration: '30 dias' },
  { name: 'Levotiroxina 50mcg', dose: '50mcg', route: 'VO', frequency: '1x ao dia', duration: '60 dias' },
  { name: 'Rosuvastatina 10mg', dose: '10mg', route: 'VO', frequency: '1x ao dia', duration: '90 dias' },
  { name: 'Insulina Glargina', dose: '20 UI', route: 'SC', frequency: '1x ao dia', duration: '30 dias' },
];

const createEmptyItem = (): PrescriptionItem => ({
  id: crypto.randomUUID(),
  drugName: '',
  dose: '',
  route: '',
  frequency: '',
  duration: '',
  instructions: '',
  isControlled: false,
  quantity: 1,
});

const statusStyles: Record<PrescriptionStatus, string> = {
  ATIVA: 'bg-emerald-50 text-emerald-700',
  RENOVADA: 'bg-indigo-50 text-indigo-700',
  CANCELADA: 'bg-rose-50 text-rose-700',
};

export const PrescriptionsPage = () => {
  const [searchParams] = useSearchParams();
  const { data: patients = [] } = usePatientsQuery();
  const { user } = useAuthStore();

  const [query, setQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const patientId = searchParams.get('patientId');
    const openNew = searchParams.get('openNew');

    if (patientId && patients.length > 0) {
      const patient = patients.find((p) => p.id === patientId);
      if (patient) {
        setSelectedPatient(patient);
        setQuery(patient.fullName);
        if (openNew === 'true') {
          setIsModalOpen(true);
        }
      }
    }
  }, [searchParams, patients]);

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [items, setItems] = useState<PrescriptionItem[]>([createEmptyItem()]);
  const [validUntil, setValidUntil] = useState('');
  const [signature, setSignature] = useState(`${user?.name ?? 'Dr(a). Responsável'} · CRM`);
  const [drugQuery, setDrugQuery] = useState('');

  const filteredPatients = useMemo(
    () =>
      patients.filter((patient) =>
        patient.fullName.toLowerCase().includes(query.toLowerCase().trim()),
      ),
    [patients, query],
  );

  const filteredDrugTemplates = useMemo(
    () =>
      drugTemplates.filter((drug) =>
        drug.name.toLowerCase().includes(drugQuery.toLowerCase().trim()),
      ),
    [drugQuery],
  );

  const activePrescriptions = selectedPatient
    ? prescriptions.filter(
        (prescription) =>
          prescription.patientId === selectedPatient.id && prescription.status !== 'CANCELADA',
      )
    : [];

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setQuery(patient.fullName);
    setShowPatientDropdown(false);
  };

  const addItemFromTemplate = (template: (typeof drugTemplates)[number]) => {
    setItems((current) => [
      ...current,
      {
        ...createEmptyItem(),
        drugName: template.name,
        dose: template.dose,
        route: template.route,
        frequency: template.frequency,
        duration: template.duration,
      },
    ]);
    setDrugQuery('');
  };

  const updateItem = (id: string, key: keyof PrescriptionItem, value: string | boolean | number) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const removeItem = (id: string) => {
    setItems((current) => (current.length > 1 ? current.filter((item) => item.id !== id) : current));
  };

  const handleSavePrescription = () => {
    if (!selectedPatient) return;

    const sanitizedItems = items.filter((item) => item.drugName.trim().length > 0);
    if (sanitizedItems.length === 0) return;

    const newPrescription: Prescription = {
      id: crypto.randomUUID(),
      patientId: selectedPatient.id,
      createdAt: new Date().toISOString(),
      status: 'ATIVA',
      signature,
      items: sanitizedItems,
      ...(validUntil ? { validUntil } : {}),
    };

    setPrescriptions((current) => [newPrescription, ...current]);
    setIsModalOpen(false);
    setItems([createEmptyItem()]);
    setValidUntil('');
    setDrugQuery('');
  };

  const renewPrescription = (id: string) => {
    setPrescriptions((current) =>
      current.map((prescription) =>
        prescription.id === id ? { ...prescription, status: 'RENOVADA' } : prescription,
      ),
    );
  };

  const cancelPrescription = (id: string) => {
    setPrescriptions((current) =>
      current.map((prescription) =>
        prescription.id === id ? { ...prescription, status: 'CANCELADA' } : prescription,
      ),
    );
  };

  return (
    <ClinicalPageShell
      title="Prescrições"
      subtitle="Gerencie prescrições ativas, renove tratamentos e registre novos medicamentos"
    >
      <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Paciente</label>
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setShowPatientDropdown(true);
                }}
                onFocus={() => setShowPatientDropdown(true)}
                placeholder="Buscar paciente por nome"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {showPatientDropdown && filteredPatients.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                {filteredPatients.slice(0, 8).map((patient) => (
                  <li key={patient.id}>
                    <button
                      type="button"
                      onClick={() => selectPatient(patient)}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      {patient.fullName}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            disabled={!selectedPatient}
            onClick={() => {
              setSignature(`${user?.name ?? 'Dr(a). Responsável'} · CRM`);
              setIsModalOpen(true);
            }}
            className="self-end rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              <Plus size={14} /> Nova Prescrição
            </span>
          </button>
        </div>

        {selectedPatient ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Paciente selecionado: <strong className="text-slate-800">{selectedPatient.fullName}</strong>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
            Selecione um paciente para visualizar e cadastrar prescrições.
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800">Prescrições ativas</h2>

        {activePrescriptions.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
            <Pill size={16} className="text-slate-400" />
            Nenhuma prescrição ativa para este paciente.
          </div>
        ) : (
          <ul className="space-y-3">
            {activePrescriptions.map((prescription) => (
              <li key={prescription.id} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Emitida em {new Date(prescription.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    {prescription.validUntil && (
                      <p className="text-xs text-slate-500">
                        Validade: {new Date(prescription.validUntil).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[prescription.status]}`}>
                    {prescription.status}
                  </span>
                </div>

                <ul className="mb-3 space-y-1.5 text-sm text-slate-700">
                  {prescription.items.map((item) => (
                    <li key={item.id} className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="font-medium">{item.drugName}</p>
                      <p className="text-xs text-slate-500">
                        {item.dose} · {item.route} · {item.frequency} · {item.duration} · Qtd: {item.quantity}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">Assinatura: {prescription.signature}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => renewPrescription(prescription.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      <CheckCircle2 size={13} /> Renovar
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelPrescription(prescription.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      <XCircle size={13} /> Cancelar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <h2 className="text-base font-semibold text-slate-800">Nova prescrição</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Buscar medicamento (template)</label>
                  <input
                    value={drugQuery}
                    onChange={(event) => setDrugQuery(event.target.value)}
                    placeholder="Digite para filtrar em drugTemplates"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                  {drugQuery && filteredDrugTemplates.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filteredDrugTemplates.slice(0, 6).map((template) => (
                        <button
                          key={template.name}
                          type="button"
                          onClick={() => addItemFromTemplate(template)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          + {template.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setItems((current) => [...current, createEmptyItem()])}
                  className="self-end rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Adicionar item livre
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-700">Medicamento</h3>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700"
                      >
                        <Trash2 size={13} /> Remover
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      <input value={item.drugName} onChange={(e) => updateItem(item.id, 'drugName', e.target.value)} placeholder="drugName" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                      <input value={item.dose} onChange={(e) => updateItem(item.id, 'dose', e.target.value)} placeholder="dose" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                      <input value={item.route} onChange={(e) => updateItem(item.id, 'route', e.target.value)} placeholder="route" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                      <input value={item.frequency} onChange={(e) => updateItem(item.id, 'frequency', e.target.value)} placeholder="frequency" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                      <input value={item.duration} onChange={(e) => updateItem(item.id, 'duration', e.target.value)} placeholder="duration" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                      <input value={item.instructions} onChange={(e) => updateItem(item.id, 'instructions', e.target.value)} placeholder="instructions" className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2" />
                      <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value || 1))} placeholder="quantity" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                      <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                        <ShieldAlert size={14} className="text-amber-600" />
                        <input type="checkbox" checked={item.isControlled} onChange={(e) => updateItem(item.id, 'isControlled', e.target.checked)} />
                        isControlled
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Assinatura sugerida</label>
                  <input
                    value={signature}
                    onChange={(event) => setSignature(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">validUntil (opcional)</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(event) => setValidUntil(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePrescription}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Salvar prescrição
              </button>
            </div>
          </div>
        </div>
      )}
    </ClinicalPageShell>
  );
};
