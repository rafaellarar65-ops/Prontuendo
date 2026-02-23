import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

declare global {
  interface Window {
    fabric?: any;
  }
}

type ToolType =
  | 'text'
  | 'image'
  | 'svg'
  | 'variable'
  | 'graph-range'
  | 'graph-gauge'
  | 'shape-rect'
  | 'shape-circle'
  | 'qr';

type PageFormat = 'a4-portrait' | 'a4-landscape';

const MM_TO_PX = 3.7795275591;
const GRID_SIZE = 24;
const FABRIC_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js';

const variables = ['{{paciente.nome}}', '{{bio.peso}}', '{{bio.imc}}', '{{glicemia.media}}', '{{medico.crm}}', '{{data.hoje}}'];

const pageDimensions = (format: PageFormat) =>
  format === 'a4-landscape'
    ? { width: Math.round(297 * MM_TO_PX), height: Math.round(210 * MM_TO_PX) }
    : { width: Math.round(210 * MM_TO_PX), height: Math.round(297 * MM_TO_PX) };

export const TemplateEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<any>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [pageFormat, setPageFormat] = useState<PageFormat>('a4-portrait');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const dimensions = useMemo(() => pageDimensions(pageFormat), [pageFormat]);

  const pushHistory = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const snapshot = JSON.stringify(canvas.toJSON(['data']));
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), snapshot].slice(-40));
    setHistoryIndex((prev) => Math.min(prev + 1, 39));
  }, [historyIndex]);

  useEffect(() => {
    const loadFabric = async () => {
      if (window.fabric) return;
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = FABRIC_CDN;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Não foi possível carregar o Fabric.js.'));
        document.body.appendChild(script);
      });
    };

    const setup = async () => {
      await loadFabric();
      if (!canvasRef.current || !window.fabric) return;

      const canvas = new window.fabric.Canvas(canvasRef.current, {
        width: dimensions.width,
        height: dimensions.height,
        backgroundColor: '#fff',
        preserveObjectStacking: true,
      });

      fabricCanvasRef.current = canvas;
      canvas.on('selection:created', (e: any) => setSelectedObject(e.selected?.[0] ?? null));
      canvas.on('selection:updated', (e: any) => setSelectedObject(e.selected?.[0] ?? null));
      canvas.on('selection:cleared', () => setSelectedObject(null));
      canvas.on('object:moving', (event: any) => {
        if (!snapToGrid || !event.target) return;
        event.target.set({
          left: Math.round((event.target.left ?? 0) / GRID_SIZE) * GRID_SIZE,
          top: Math.round((event.target.top ?? 0) / GRID_SIZE) * GRID_SIZE,
        });
      });
      canvas.on('object:added', (event: any) => {
        if (event.target?.data?.isGridLine) return;
        pushHistory();
      });

      pushHistory();
    };

    void setup();
    return () => fabricCanvasRef.current?.dispose();
  }, [dimensions.height, dimensions.width, pushHistory, snapToGrid]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || !(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === 'z' && historyIndex > 0) {
        event.preventDefault();
        canvas.loadFromJSON(history[historyIndex - 1], () => {
          canvas.renderAll();
          setHistoryIndex((current) => current - 1);
        });
      }
      if (event.key.toLowerCase() === 'y' && history[historyIndex + 1]) {
        event.preventDefault();
        canvas.loadFromJSON(history[historyIndex + 1], () => {
          canvas.renderAll();
          setHistoryIndex((current) => current + 1);
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [history, historyIndex]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    const fabric = window.fabric;
    if (!canvas || !fabric) return;
    canvas.getObjects().forEach((obj: any) => obj.data?.isGridLine && canvas.remove(obj));
    if (!showGrid) return canvas.renderAll();

    for (let i = 0; i < dimensions.width / GRID_SIZE; i += 1) {
      const line = new fabric.Line([i * GRID_SIZE, 0, i * GRID_SIZE, dimensions.height], {
        stroke: '#f1f5f9',
        selectable: false,
        evented: false,
      });
      line.data = { isGridLine: true };
      canvas.add(line);
      canvas.sendToBack(line);
    }

    for (let i = 0; i < dimensions.height / GRID_SIZE; i += 1) {
      const line = new fabric.Line([0, i * GRID_SIZE, dimensions.width, i * GRID_SIZE], {
        stroke: '#f1f5f9',
        selectable: false,
        evented: false,
      });
      line.data = { isGridLine: true };
      canvas.add(line);
      canvas.sendToBack(line);
    }
    canvas.renderAll();
  }, [dimensions.height, dimensions.width, showGrid]);

  const addElement = useCallback((tool: ToolType) => {
    const canvas = fabricCanvasRef.current;
    const fabric = window.fabric;
    if (!canvas || !fabric) return;

    if (tool === 'text') canvas.add(new fabric.IText('Digite seu texto', { left: 120, top: 120, fontSize: 22 }));
    if (tool === 'variable') canvas.add(new fabric.Textbox('{{paciente.nome}}', { left: 110, top: 120, width: 260, fontSize: 18 }));
    if (tool === 'shape-rect') canvas.add(new fabric.Rect({ left: 90, top: 90, width: 180, height: 80, fill: '#bfdbfe' }));
    if (tool === 'shape-circle') canvas.add(new fabric.Circle({ left: 90, top: 90, radius: 46, fill: '#fef3c7' }));
    if (tool === 'graph-range') {
      canvas.add(new fabric.Rect({ left: 80, top: 80, width: 300, height: 30, fill: '#e2e8f0' }));
      canvas.add(new fabric.Rect({ left: 80, top: 80, width: 185, height: 30, fill: '#0ea5e9' }));
      canvas.add(new fabric.Textbox('IMC {{bio.imc}}', { left: 90, top: 86, width: 260, fontSize: 14 }));
    }
    if (tool === 'graph-gauge') {
      canvas.add(new fabric.Circle({ left: 120, top: 80, radius: 75, fill: 'transparent', stroke: '#e2e8f0', strokeWidth: 18 }));
      canvas.add(new fabric.Textbox('78%', { left: 175, top: 140, fontSize: 32 }));
    }
    if (tool === 'svg') canvas.add(new fabric.Textbox('Elemento SVG', { left: 120, top: 140, width: 200, fontSize: 16 }));
    if (tool === 'qr') {
      canvas.add(new fabric.Rect({ left: 100, top: 100, width: 120, height: 120, fill: '#fff', stroke: '#111827' }));
      canvas.add(new fabric.Textbox('QR', { left: 145, top: 145, width: 50, fontSize: 24 }));
    }
    if (tool === 'image') {
      fabric.Image.fromURL('https://dummyimage.com/320x120/dbeafe/1e3a8a.png&text=Imagem', (img: any) => {
        img.set({ left: 100, top: 100 });
        canvas.add(img);
      });
    }
    canvas.renderAll();
  }, []);

  const layerObjects = useMemo(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return [];
    return canvas.getObjects().filter((obj: any) => !obj.data?.isGridLine).reverse();
  }, [historyIndex, selectedObject]);

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr_320px]">
      <aside className="space-y-3 rounded-lg border bg-white p-3">
        <h2 className="font-semibold">Toolbar</h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ['text', 'Texto'], ['image', 'Imagem'], ['svg', 'SVG'], ['variable', 'Variável'], ['graph-range', 'Range Bar'],
            ['graph-gauge', 'Gauge'], ['shape-rect', 'Retângulo'], ['shape-circle', 'Círculo'], ['qr', 'QR Code'],
          ].map(([key, label]) => (
            <button className="rounded border px-2 py-2 text-left hover:bg-slate-50" key={key} onClick={() => addElement(key as ToolType)} type="button">{label}</button>
          ))}
        </div>
        <label className="flex items-center justify-between text-sm">Grid <input checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} type="checkbox" /></label>
        <label className="flex items-center justify-between text-sm">Snap <input checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} type="checkbox" /></label>
        <select className="w-full rounded border px-2 py-1 text-sm" onChange={(e) => setPageFormat(e.target.value as PageFormat)} value={pageFormat}>
          <option value="a4-portrait">A4 Retrato</option>
          <option value="a4-landscape">A4 Paisagem</option>
        </select>
      </aside>

      <section className="rounded-lg border bg-slate-50 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm">
          <button className="rounded border bg-white px-2 py-1" onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))} type="button">-</button>
          Zoom {Math.round(zoom * 100)}%
          <button className="rounded border bg-white px-2 py-1" onClick={() => setZoom((z) => Math.min(2.2, z + 0.1))} type="button">+</button>
        </div>
        <div className="overflow-auto rounded border bg-slate-200 p-6">
          <canvas ref={canvasRef} style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }} />
        </div>
      </section>

      <aside className="space-y-4 rounded-lg border bg-white p-3">
        <section>
          <h2 className="font-semibold">Propriedades</h2>
          {selectedObject ? (
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <p>X: {Math.round(selectedObject.left ?? 0)}</p><p>Y: {Math.round(selectedObject.top ?? 0)}</p>
              <p>W: {Math.round(selectedObject.width ?? 0)}</p><p>H: {Math.round(selectedObject.height ?? 0)}</p>
            </div>
          ) : <p className="text-sm text-slate-500">Selecione um elemento.</p>}
        </section>
        <section>
          <h2 className="font-semibold">Camadas</h2>
          <ul className="mt-2 space-y-1 text-xs">{layerObjects.map((obj: any, i: number) => <li className="rounded border px-2 py-1" key={`${obj.type}-${i}`}>{obj.type}</li>)}</ul>
        </section>
        <section>
          <h2 className="font-semibold">Variáveis</h2>
          <ul className="mt-2 space-y-1 text-xs">{variables.map((variable) => <li className="rounded border px-2 py-1" key={variable}>{variable}</li>)}</ul>
        </section>
      </aside>
    </div>
  );
};
