import { useState } from 'react';
import { Link } from 'react-router-dom';

export const ProfilePage = () => {
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(Notification.permission);

  const askNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const status = await Notification.requestPermission();
    setNotificationStatus(status);
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Perfil</h1>
      <article className="rounded-2xl border-2 border-slate-300 bg-white p-4 text-base text-slate-900">
        <p>
          <strong>Nome:</strong> Maria da Silva
        </p>
        <p>
          <strong>E-mail:</strong> maria@email.com
        </p>
        <p>
          <strong>Notificações:</strong>{' '}
          {notificationStatus === 'granted' ? 'Ativadas' : notificationStatus === 'denied' ? 'Bloqueadas' : 'Pendente'}
        </p>
      </article>

      <button
        className="h-12 w-full rounded-xl border-2 border-blue-800 bg-white text-base font-semibold text-blue-900"
        onClick={askNotificationPermission}
        type="button"
      >
        Ativar notificações
      </button>
      <button className="h-12 w-full rounded-xl border-2 border-blue-800 bg-white text-base font-semibold text-blue-900">
        Trocar senha
      </button>
      <Link
        to="/login"
        className="flex h-12 w-full items-center justify-center rounded-xl bg-red-700 text-base font-bold text-white"
      >
        Sair
      </Link>
    </section>
  );
};
