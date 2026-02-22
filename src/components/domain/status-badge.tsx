interface StatusBadgeProps {
  label: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
}

const toneClass: Record<StatusBadgeProps['tone'], string> = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  neutral: 'bg-muted text-muted-foreground',
};

export const StatusBadge = ({ label, tone }: StatusBadgeProps) => (
  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${toneClass[tone]}`}>{label}</span>
);
