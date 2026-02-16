'use client';

import { useMemo, useState } from 'react';
import { AppointmentActionBar } from '@/components/AppointmentActionBar';
import { SmartSearchSelect } from '@/components/SmartSearchSelect';

type Form = {
  service: string;
  date: string;
  time: string;
  duration: string;
  professional: string;
};

const options = [
  { id: '1', label: 'Pré-consulta de Clínica Médica', meta: 'consulta · Adulto' },
  { id: '2', label: 'Pós-consulta de Psiquiatria', meta: 'consulta · Retorno' },
  { id: '3', label: 'Consulta de Psicologia', meta: 'consulta · 1ª sessão' },
];

export default function Page() {
  const [form, setForm] = useState<Form>({ service: '', date: '', time: '', duration: '', professional: '' });
  const [moreOption, setMoreOption] = useState<{ id: string; label: string; meta: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  const datetime = useMemo(() => (form.date && form.time ? `${form.date}T${form.time}` : ''), [form.date, form.time]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.service) e.service = 'Selecione um serviço para continuar.';
    if (!form.professional) e.professional = 'Selecione um profissional responsável.';
    if (!datetime) e.datetime = 'Informe data e hora válidas para o atendimento.';
    if (!form.duration || Number(form.duration) <= 0) e.duration = 'Tempo previsto deve ser maior que zero.';

    // conflito simulado: profissional "dr-x" às 10:00
    if (form.professional === 'dr-x' && form.time === '10:00') {
      e.conflict = 'Há conflito de agenda para este horário. Escolha outro horário ou profissional.';
    }
    if (!moreOption) e.moreOption = 'Selecione uma opção válida em Mais opções.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function flash(message: string) {
    setToast(message);
    setTimeout(() => setToast(''), 1800);
  }

  function onSave() {
    if (!validate()) return;
    flash('Dados salvos com sucesso.');
  }

  function onSaveClose() {
    if (!validate()) return;
    flash('Dados salvos com sucesso.');
  }

  async function onStart() {
    if (!validate()) return;
    const ok = window.confirm('Deseja realmente iniciar este atendimento?');
    if (!ok) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    flash('Atendimento iniciado com sucesso.');
  }

  return (
    <main className="page">
      <h1>Agendar Atendimento (Sprint 1)</h1>
      <div className="card">
        <div className="row">
          <div className="field"><label>Serviço</label><input value={form.service} onChange={(e)=>setForm({...form,service:e.target.value})}/>{errors.service && <span className="error">{errors.service}</span>}</div>
          <div className="field"><label>Data</label><input type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})}/></div>
          <div className="field"><label>Hora</label><input type="time" value={form.time} onChange={(e)=>setForm({...form,time:e.target.value})}/>{errors.datetime && <span className="error">{errors.datetime}</span>}</div>
          <div className="field"><label>Tempo previsto (min)</label><input type="number" value={form.duration} onChange={(e)=>setForm({...form,duration:e.target.value})}/>{errors.duration && <span className="error">{errors.duration}</span>}</div>
        </div>

        <div className="row">
          <div className="field"><label>Profissional</label><select value={form.professional} onChange={(e)=>setForm({...form,professional:e.target.value})}><option value="">Selecione</option><option value="dr-a">Dra. Ana</option><option value="dr-x">Dr. Xavier</option></select>{errors.professional && <span className="error">{errors.professional}</span>}</div>
          <div style={{gridColumn:'span 3'}}>
            <SmartSearchSelect label="Mais opções" value={moreOption} onChange={setMoreOption} options={options} />
            {errors.moreOption && <span className="error">{errors.moreOption}</span>}
            {moreOption && <span className="badge">Selecionado: {moreOption.label}</span>}
          </div>
        </div>

        {errors.conflict && <p className="error">{errors.conflict}</p>}

        <AppointmentActionBar onCancel={()=>{}} onSave={onSave} onSaveClose={onSaveClose} onStart={onStart} loading={loading} />
      </div>
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
