import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Calendar, ChevronRight, FileText, LogOut, Plus, User } from 'lucide-react';
import { usePatientAuthStore } from '@/lib/stores/patient-auth-store';
import { http } from '@/lib/api/http';
import { useQuery } from '@tanstack/react-query';

// ── Glucose Quick Entry ──────────────────────────────────────────
const GlucoseEntry = () => {
  const patient = usePatientAuthStore((s) => s.patient);
  const [value, setValue] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || !patient?.patientId) return;
    setLoading(true);
    try {
      await http.post('/glucose', {
        patientId: patient.patientId,
        value: Number(value),
        measuredAt: new Date().toISOString(),
        notes: 'Registrado pelo paciente',
      });
      setSent(true);
      setValue('');
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4">
      <p className="font-semibold text-emerald-800">Glicemia registrada!</p>
      <button className="mt-2 text-sm text-emerald-700 underline" onClick={() => setSent(false)}>Registrar novamente</button>
    </div>
  );

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-700 mb-3">Registrar glicemia agora</p>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="mg/dL"
          min={20}
          max={600}
          required
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-base font-bold text-slate-800 outline-none focus:border-indigo-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          <Plus size={14} /> Registrar
        </button>
      </form>
    </div>
  );
};

// ── Quick nav card ───────────────────────────────────────────────
const NavCard = ({ to, icon: Icon, label, color }: { to: string; icon: React.ElementType; label: string; color: string }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 rounded-2xl border-2 ${color} bg-white p-4 font-semibold text-slate-900 transition hover:opacity-90`}
  >
    <Icon size={20} className="flex-shrink-0" />
    <span className="flex-1 text-sm">{label}</span>
    <ChevronRight size={14} className="text-slate-400" />
  </Link>
);

// ── Main ─────────────────────────────────────────────────────────
export const HomePage = () => {
  const patient = usePatientAuthStore((s) => s.patient);
  const signOut = usePatientAuthStore((s) => s.signOut);

  const firstName = patient?.fullName?.split(' ')[0] ?? 'Paciente';

  return (
    <section className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Olá, {firstName} 👋</h1>
          <p className="text-sm text-slate-500">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
        >
          <LogOut size={14} /> Sair
        </button>
      </div>

      {/* Quick glucose registration */}
      <GlucoseEntry />

      {/* Nav cards */}
      <div className="space-y-2">
        <NavCard to="/paciente/questionario" icon={FileText} label="Questionário pré-consulta" color="border-indigo-200" />
        <NavCard to="/paciente/glicemia" icon={Activity} label="Histórico de glicemia" color="border-emerald-200" />
        <NavCard to="/paciente/exames" icon={FileText} label="Enviar exames" color="border-amber-200" />
        <NavCard to="/paciente/documentos" icon={Calendar} label="Meus documentos" color="border-slate-200" />
        <NavCard to="/paciente/perfil" icon={User} label="Meu perfil" color="border-violet-200" />
      </div>
    </section>
  );
};
