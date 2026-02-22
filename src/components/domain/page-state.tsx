interface PageStateProps {
  title: string;
  description: string;
}

export const PageState = ({ title, description }: PageStateProps) => (
  <section className="rounded-lg border border-dashed p-8 text-center">
    <h2 className="text-lg font-medium">{title}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
  </section>
);
