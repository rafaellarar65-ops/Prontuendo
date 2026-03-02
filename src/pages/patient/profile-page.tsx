import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePatientAuthStore } from '@/lib/stores/patient-auth-store';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const patient = usePatientAuthStore((state) => state.patient);
  const signOut = usePatientAuthStore((state) => state.signOut);

  const [phone, setPhone] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    setIsSigningOut(true);
    signOut();
    navigate('/paciente/login', { replace: true });
  };

  if (!patient?.patientId) {
    return (
      <section className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-amber-900">
        Não encontramos seus dados de perfil. Faça login novamente para continuar.
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Perfil</h1>
      <article className="space-y-2 rounded-2xl border-2 border-slate-300 bg-white p-4 text-base text-slate-900">
        <p>
          <strong>Nome:</strong> {patient.fullName}
        </p>
        <p>
          <strong>E-mail:</strong> {patient.email}
        </p>
        <div className="space-y-2">
          <p>
            <strong>Telefone:</strong>
          </p>
          {isEditingPhone ? (
            <div className="flex items-center gap-2">
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="(00) 00000-0000"
                className="h-10 flex-1 rounded-xl border-2 border-slate-300 px-3"
              />
              <button
                type="button"
                onClick={() => setIsEditingPhone(false)}
                className="h-10 rounded-xl bg-blue-800 px-3 text-sm font-semibold text-white"
              >
                Salvar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingPhone(true)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
            >
              {phone || 'Adicionar telefone'}
            </button>
          )}
        </div>
      </article>

      <button
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-700 text-base font-bold text-white"
        onClick={handleSignOut}
        disabled={isSigningOut}
        type="button"
      >
        {isSigningOut ? (
          <>
            <Loader2 size={15} className="animate-spin" /> Saindo...
          </>
        ) : (
          'Sair'
        )}
      </button>
    </section>
  );
};
