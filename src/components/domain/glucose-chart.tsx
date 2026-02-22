interface GlucoseChartPoint {
  label: string;
  value: number;
}

interface GlucoseChartProps {
  points: GlucoseChartPoint[];
}

export const GlucoseChart = ({ points }: GlucoseChartProps) => (
  <section className="rounded-lg border bg-white p-4">
    <h3 className="font-medium">Glucose Chart (placeholder)</h3>
    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
      {points.map((point) => (
        <li key={point.label}>
          {point.label}: {point.value} mg/dL
        </li>
      ))}
    </ul>
  </section>
);
