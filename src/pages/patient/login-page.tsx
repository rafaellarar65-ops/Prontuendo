import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { usePatientLoginMutation } from '@/features/auth/use-patient-login-mutation';
import { usePatientAuthStore } from '@/lib/stores/patient-auth-store';

export const LoginPage = () => {
  const isAuthenticated = usePatientAuthStore((state) => state.isAuthenticated);
  const { mutate, isPending, error } = usePatientLoginMutation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/paciente" replace />;
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    mutate(
      { email, password },
      {
        onSuccess: () => {
          setMessage('Login realizado com sucesso.');
          void navigate('/paciente');
        },
      },
    );
  };

  return (
    <section className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Área do paciente</h1>
      <p className="text-sm text-slate-600">Acesse para acompanhar sua jornada de cuidados.</p>

      <form className="space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm font-medium text-slate-700" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          className="h-11 w-full rounded-xl border border-slate-300 px-3 text-base"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label className="block text-sm font-medium text-slate-700" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          type="password"
          className="h-11 w-full rounded-xl border border-slate-300 px-3 text-base"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-700">Credenciais inválidas. Tente novamente.</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="h-11 w-full rounded-xl bg-blue-900 text-base font-semibold text-white disabled:opacity-60"
        >
          {isPending ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </section>
  );
};
