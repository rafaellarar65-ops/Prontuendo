import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity, Calendar, ChevronRight, Edit2, FileText, Loader2,
  Phone, Mail, MapPin, Plus, Stethoscope, User, X,
} from 'lucide-react';
import { patientApi } from '@/lib/api/patient-api';
import { consultationApi } from '@/lib/api/consultation-api';
import type { Patient, UpdatePatientDto } from '@/types/api';

const calcAge = (bd?: string) =>
  bd ? Math.floor((Date.now() - new Date(bd).getTime()) / 3.156e10) : null;

const SEX_LABEL: Record<string, string> = { F: 'Feminino', M: 'Masculino', OUTRO: 'Outro', NI: 'Não informado' };

// ── Edit Patient Modal ──────────────────────────────────────────
const EditPatientModal = ({
  patient,
  onClose,
}: {
  patient: Patient;
  onClose: () => void;
}) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<UpdatePatientDto>({
    fullName: patient.fullName,
    birthDate: patient.birthDate ? patient.birthDate.slice(0, 10) : '',
    sex: patient.sex ?? 'NI',
    cpf: patient.cpf ?? '',
    phone: patient.phone ?? '',
    email: patient.email ?? '',
    address: patient.address ?? '',
    notes: patient.notes ?? '',
  });

  const mut = useMutation({
    mutationFn: (dto: UpdatePatientDto) => patientApi.update(patient.id, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['patient', patient.id] });
      void qc.invalidateQueries({ queryKey: ['patients'] });
      onClose();
    },
  });

  const set = (k: keyof UpdatePatientDto) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-semibold text-slate-800">Editar paciente</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>
        <form
          className="space-y-4 px-6 py-5"
          onSubmit={(e) => { e.preventDefault(); mut.mutate(form); }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Nome completo *</label>
              <input required value={form.fullName ?? ''} onChange={set('fullName')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Data de nascimento</label>
              <input type="date" value={form.birthDate ?? ''} onChange={set('birthDate')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Sexo</label>
              <select value={form.sex ?? 'NI'} onChange={set('sex')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400">
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="OUTRO">Outro</option>
                <option value="NI">Não informado</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">CPF</label>
              <input value={form.cpf ?? ''} onChange={set('cpf')} placeholder="000.000.000-00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Telefone</label>
              <input value={form.phone ?? ''} onChange={set('phone')} placeholder="(11) 99999-9999"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
              <input type="email" value={form.email ?? ''} onChange={set('email')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Endereço</label>
              <input value={form.address ?? ''} onChange={set('address')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Observações</label>
              <textarea value={form.notes ?? ''} onChange={set('notes')} rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
            <button type="submit" disabled={mut.isPending}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60">
              {mut.isPending && <Loader2 size={13} className="animate-spin" />}
              {mut.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Consultations Tab ───────────────────────────────────────────
const ConsultationsTab = ({ patientId }: { patientId: string }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['consultations', patientId],
    queryFn: () => consultationApi.list(patientId),
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{data?.length ?? 0} consulta(s)</p>
        <button
          onClick={() => navigate(`/consultas/nova?patientId=${patientId}`)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus size={13} /> Nova consulta
        </button>
      </div>
      {(!data || data.length === 0) ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12 text-slate-400">
          <FileText size={32} className="mb-2 opacity-30" />
          <p className="text-sm">Nenhuma consulta registrada.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {data.map((c) => (
            <li key={c.id} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-bold ${c.status === 'FINALIZED' ? 'bg-emerald-500' : 'bg-amber-400'}`}>
                {c.status === 'FINALIZED' ? 'F' : 'R'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">
                  {c.status === 'FINALIZED' ? 'Consulta finalizada' : 'Rascunho'}
                </p>
                <p className="text-xs text-slate-400">{new Date(c.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              <ChevronRight size={14} className="text-slate-300" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────
type Tab = 'dados' | 'consultas' | 'exames' | 'glicemia' | 'bioimpedancia' | 'documentos';

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'dados', label: 'Dados', icon: <User size={14} /> },
  { id: 'consultas', label: 'Consultas', icon: <Stethoscope size={14} /> },
  { id: 'exames', label: 'Exames', icon: <FileText size={14} /> },
  { id: 'glicemia', label: 'Glicemia', icon: <Activity size={14} /> },
  { id: 'bioimpedancia', label: 'Bioimpedância', icon: <Calendar size={14} /> },
  { id: 'documentos', label: 'Documentos', icon: <FileText size={14} /> },
];

export const PatientProfilePage = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [tab, setTab] = useState<Tab>('dados');
  const [showEdit, setShowEdit] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientApi.detail(patientId!),
    enabled: !!patientId,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin text-slate-400" />
    </div>
  );
  if (isError || !data) return (
    <div className="p-6 text-center text-sm text-rose-600">Paciente não encontrado.</div>
  );

  const age = calcAge(data.birthDate);

  return (
    <div className="p-6 space-y-5" data-testid="patient-profile">
      {/* Header card */}
      <div className="flex items-center gap-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 text-xl font-bold text-white">
          {data.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-800 truncate">{data.fullName}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {age !== null && `${age} anos`}
            {age !== null && data.sex && ' · '}
            {data.sex && SEX_LABEL[data.sex]}
            {data.cpf && ` · CPF: ${data.cpf}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowEdit(true)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          data-testid="edit-patient-btn"
        >
          <Edit2 size={14} /> Editar
        </button>
      </div>

      {/* Quick info strip */}
      <div className="flex flex-wrap gap-3">
        {data.phone && (
          <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
            <Phone size={11} /> {data.phone}
          </span>
        )}
        {data.email && (
          <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
            <Mail size={11} /> {data.email}
          </span>
        )}
        {data.address && (
          <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
            <MapPin size={11} /> {data.address}
          </span>
        )}
        {data.lifecycle && (
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${data.lifecycle === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {data.lifecycle === 'ACTIVE' ? 'Ativo' : data.lifecycle}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            data-testid={`tab-${t.id}`}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition
              ${tab === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.icon} <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm min-h-48">
        {tab === 'dados' && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Dados cadastrais</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Nome completo', data.fullName],
                ['Data de nascimento', data.birthDate ? new Date(data.birthDate).toLocaleDateString('pt-BR') : '—'],
                ['Idade', age !== null ? `${age} anos` : '—'],
                ['Sexo', data.sex ? SEX_LABEL[data.sex] : '—'],
                ['CPF', data.cpf ?? '—'],
                ['Telefone', data.phone ?? '—'],
                ['E-mail', data.email ?? '—'],
                ['Endereço', data.address ?? '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
                  <p className="text-slate-700">{value || '—'}</p>
                </div>
              ))}
            </div>
            {data.notes && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-400 font-medium mb-1">Observações</p>
                <p className="text-sm text-slate-700 leading-relaxed">{data.notes}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'consultas' && <ConsultationsTab patientId={patientId!} />}

        {tab === 'exames' && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <FileText size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Exames laboratoriais aparecerão aqui.</p>
            <p className="text-xs mt-1">Use o módulo de Exames para adicionar resultados.</p>
          </div>
        )}

        {tab === 'glicemia' && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Activity size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Registros de glicemia aparecerão aqui.</p>
          </div>
        )}

        {tab === 'bioimpedancia' && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Calendar size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Exames de bioimpedância aparecerão aqui.</p>
          </div>
        )}

        {tab === 'documentos' && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <FileText size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Documentos e arquivos aparecerão aqui.</p>
          </div>
        )}
      </div>

      {showEdit && <EditPatientModal patient={data} onClose={() => setShowEdit(false)} />}
    </div>
  );
};
