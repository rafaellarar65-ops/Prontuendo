interface BioimpedanceCardProps {
  title: string;
  value: string;
  helper: string;
}

export const BioimpedanceCard = ({ title, value, helper }: BioimpedanceCardProps) => (
  <article className="rounded-lg border bg-white p-4">
    <p className="text-sm text-muted-foreground">{title}</p>
    <p className="mt-1 text-2xl font-semibold">{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
  </article>
);
