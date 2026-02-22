import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('Entrando...');
    window.setTimeout(() => navigate('/'), 400);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-slate-50 px-4 py-8">
      <div className="mb-8 rounded-2xl border-2 border-blue-200 bg-white p-6 text-center">
        <p className="text-lg font-bold text-blue-900">Portal de pacientes - Dr Rafael Lara</p>
        <p className="mt-1 text-base text-slate-700">Acesso seguro do paciente</p>
      </div>

      <form className="space-y-4 rounded-2xl border-2 border-slate-300 bg-white p-5" onSubmit={onSubmit}>
        <h1 className="text-2xl font-bold text-slate-900">Entrar</h1>

        <label className="block text-base font-semibold text-slate-800" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 w-full rounded-xl border-2 border-slate-400 px-3 text-base"
        />

        <label className="block text-base font-semibold text-slate-800" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-12 w-full rounded-xl border-2 border-slate-400 px-3 text-base"
        />

        <button type="submit" className="h-12 w-full rounded-xl bg-blue-800 text-base font-bold text-white">
          Entrar no portal
        </button>

        <button
          type="button"
          onClick={() => setMessage('Enviamos o link de recuperação para o seu e-mail.')}
          className="h-12 w-full rounded-xl border-2 border-blue-800 text-base font-semibold text-blue-900"
        >
          Esqueci a senha
        </button>
      </form>

      {message && <p className="mt-3 rounded-xl border-2 border-slate-300 bg-white p-3 text-base text-slate-800">{message}</p>}
    </main>
  );
};
