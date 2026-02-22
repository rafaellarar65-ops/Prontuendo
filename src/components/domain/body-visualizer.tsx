interface BodyVisualizerProps {
  hydrationPercent: number;
  fatMassPercent: number;
}

export const BodyVisualizer = ({ hydrationPercent, fatMassPercent }: BodyVisualizerProps) => (
  <section className="rounded-lg border bg-white p-4">
    <h3 className="font-medium">Body Visualizer</h3>
    <div className="mt-3 grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs text-muted-foreground">Hidratação</p>
        <div className="mt-1 h-2 rounded bg-muted">
          <div className="h-2 rounded bg-primary" style={{ width: `${hydrationPercent}%` }} />
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Gordura corporal</p>
        <div className="mt-1 h-2 rounded bg-muted">
          <div className="h-2 rounded bg-warning" style={{ width: `${fatMassPercent}%` }} />
        </div>
      </div>
    </div>
  </section>
);
