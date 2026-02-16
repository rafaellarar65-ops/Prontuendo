'use client';

type Props = {
  onCancel: () => void;
  onSave: () => void;
  onSaveClose: () => void;
  onStart: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function AppointmentActionBar({
  onCancel,
  onSave,
  onSaveClose,
  onStart,
  disabled,
  loading,
}: Props) {
  return (
    <div className="actions">
      <button className="btn" type="button" onClick={onCancel} disabled={disabled || loading}>
        Cancelar
      </button>
      <button className="btn" type="button" onClick={onSave} disabled={disabled || loading}>
        Salvar
      </button>
      <button className="btn" type="button" onClick={onSaveClose} disabled={disabled || loading}>
        Salvar e fechar
      </button>
      <button className="btn primary" type="button" onClick={onStart} disabled={disabled || loading}>
        {loading ? 'Iniciando...' : 'Iniciar atendimento'}
      </button>
    </div>
  );
}
