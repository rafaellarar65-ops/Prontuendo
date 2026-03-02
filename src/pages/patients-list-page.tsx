import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Loader2,
  Plus,
  Search,
  User,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { usePatientsQuery } from '@/features/patients/use-patients-query';
import { useCreatePatientMutation } from '@/features/patients/use-create-patient-mutation';
import type { CreatePatientDto, Patient } from '@/types/api';

// ── Sex badge ────────────────────────────────────────────────────
const sexLabel: Record<string, string> = { F: 'Feminino', M: 'Masculino', OUTRO: 'Outro', NI: '' };
const sexColor: Record<string, string> = {
  F: 'bg-rose-50 text-rose-600',
  M: 'bg-sky-50 text-sky-600',
  OUTRO: 'bg-slate-100 text-slate-500',
  NI: 'bg-slate-50 text-slate-400',
};

const calcAge = (birthDate: string) =>
  Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));

// ── Patient card ─────────────────────────────────────────────────
const PatientItem = ({ patient }: { patient: Patient }) => {
  const initials = patient.fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  const age = patient.birthDate ? calcAge(patient.birthDate) : null;

  return (
    <Link
      to={`/pacientes/${patient.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 font-bold text-white">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-800">{patient.fullName}</p>
        <p className="text-xs text-slate-400">
          {age !== null ? `${age} anos` : ''}
          {age !== null && patient.phone ? ' · ' : ''}
          {patient.phone ?? ''}
        </p>
      </div>
      <span
        className={clsx(
          'rounded-full px-2.5 py-0.5 text-xs font-medium',
          sexColor[patient.sex ?? 'NI'],
        )}
      >
        {sexLabel[patient.sex ?? 'NI']}
      </span>
      <ArrowRight
        size={15}
        className="flex-shrink-0 text-slate-300 transition group-hover:text-indigo-500"
      />
    </Link>
  );
};

// ── New Patient Modal ─────────────────────────────────────────────
const EMPTY: CreatePatientDto = {
  fullName: '',
  birthDate: '',
  sex: 'F',
  phone: '',
  email: '',
  cpf: '',
};

const NewPatientModal = ({ onClose }: { onClose: () => void }) => {
  const { mutate, isPending, error } = useCreatePatientMutation();
  const [form, setForm] = useState<CreatePatientDto>(EMPTY);

  const set = (key: keyof CreatePatientDto) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dto: CreatePatientDto = {
      fullName: form.fullName,
      ...(form.birthDate ? { birthDate: form.birthDate } : {}),
      sex: form.sex,
      ...(form.phone ? { phone: form.phone } : {}),
      ...(form.email ? { email: form.email } : {}),
      ...(form.cpf ? { cpf: form.cpf } : {}),
    };
    mutate(dto, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-slate-800">Novo paciente</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Full name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Nome completo <span className="text-rose-500">*</span>
            </label>
            <input
              required
              value={form.fullName}
              onChange={set('fullName')}
              placeholder="Ana Silva"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Birth date + sex */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Data de nascimento <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="date"
                value={form.birthDate}
                onChange={set('birthDate')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Sexo <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.sex}
                onChange={set('sex')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="OUTRO">Outro</option>
                <option value="NI">Não informado</option>
              </select>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">CPF</label>
            <input
              value={form.cpf ?? ''}
              onChange={set('cpf')}
              placeholder="000.000.000-00"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Telefone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="(11) 99999-9999"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="paciente@email.com"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              Erro ao cadastrar paciente. Tente novamente.
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isPending ? 'Salvando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────
export const PatientsListPage = () => {
  const { data, isLoading, isError } = usePatientsQuery();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = data?.filter((p) =>
    p.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pacientes</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {data ? `${data.length} paciente${data.length !== 1 ? 's' : ''} cadastrado${data.length !== 1 ? 's' : ''}` : 'Carregando...'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
        >
          <Plus size={16} />
          Novo paciente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center text-sm text-rose-600">
          Erro ao carregar pacientes.
        </div>
      )}

      {!isLoading && !isError && filtered?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-slate-400">
          <User size={36} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">
            {search ? 'Nenhum resultado para a busca.' : 'Nenhum paciente cadastrado.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <Plus size={14} /> Cadastrar primeiro paciente
            </button>
          )}
        </div>
      )}

      {/* List */}
      {!isLoading && !isError && filtered && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((p) => (
            <PatientItem key={p.id} patient={p} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && <NewPatientModal onClose={() => setShowModal(false)} />}
    </div>
  );
};
