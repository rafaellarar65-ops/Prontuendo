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
  | 'graph-bars'
  | 'graph-timeline'
  | 'shape-rect'
  | 'shape-circle'
  | 'shape-triangle'
  | 'qr'
  | 'body-visualizer';

type PageFormat = 'a4-portrait' | 'a4-landscape';

type TemplatePage = {
  id: string;
  name: string;
  objectsJson: string | null;
};

const MM_TO_PX = 3.7795275591;
const GRID_SIZE = 24;
const ALIGN_TOLERANCE = 8;
const FABRIC_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js';

const VARIABLE_TOKENS = [
  '{{paciente.nome}}',
  '{{bio.peso}}',
  '{{bio.imc}}',
  '{{glicemia.media}}',
  '{{medico.crm}}',
  '{{data.hoje}}',
];

const pageDimensions = (format: PageFormat) =>
  format === 'a4-landscape'
    ? { width: Math.round(297 * MM_TO_PX), height: Math.round(210 * MM_TO_PX) }
    : { width: Math.round(210 * MM_TO_PX), height: Math.round(297 * MM_TO_PX) };

const createEmptySnapshot = () => JSON.stringify({ version: '5', objects: [] });

export const TemplateEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<any>(null);
  const isRestoringRef = useRef(false);

  const [loadingFabric, setLoadingFabric] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [pageFormat, setPageFormat] = useState<PageFormat>('a4-portrait');
  const [activePageId, setActivePageId] = useState('p1');
  const [pages, setPages] = useState<TemplatePage[]>([{ id: 'p1', name: 'Página 1', objectsJson: createEmptySnapshot() }]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const dimensions = useMemo(() => pageDimensions(pageFormat), [pageFormat]);

  const savePageSnapshot = useCallback((pageId: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const snapshot = JSON.stringify(canvas.toJSON(['data']));
    setPages((current) => current.map((page) => (page.id === pageId ? { ...page, objectsJson: snapshot } : page)));
  }, []);

  const pushHistory = useCallback(() => {
    if (isRestoringRef.current) return;
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const snapshot = JSON.stringify(canvas.toJSON(['data']));
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), snapshot].slice(-50));
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
    savePageSnapshot(activePageId);
  }, [activePageId, historyIndex, savePageSnapshot]);

  const loadSnapshot = useCallback((snapshot: string | null) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    isRestoringRef.current = true;
    canvas.loadFromJSON(snapshot || createEmptySnapshot(), () => {
      isRestoringRef.current = false;
      canvas.renderAll();
      setSelectedObject(null);
    });
  }, []);

  const drawGrid = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const fabric = window.fabric;
    if (!canvas || !fabric) return;

    canvas.getObjects().forEach((obj: any) => {
      if (obj.data?.isGridLine || obj.data?.isGuide) canvas.remove(obj);
    });

    if (!showGrid) {
      canvas.renderAll();
      return;
    }

    for (let i = 0; i <= dimensions.width / GRID_SIZE; i += 1) {
      const line = new fabric.Line([i * GRID_SIZE, 0, i * GRID_SIZE, dimensions.height], {
        stroke: '#e5e7eb',
        selectable: false,
        evented: false,
      });
      line.data = { isGridLine: true };
      canvas.add(line);
      canvas.sendToBack(line);
    }

    for (let i = 0; i <= dimensions.height / GRID_SIZE; i += 1) {
      const line = new fabric.Line([0, i * GRID_SIZE, dimensions.width, i * GRID_SIZE], {
        stroke: '#e5e7eb',
        selectable: false,
        evented: false,
      });
      line.data = { isGridLine: true };
      canvas.add(line);
      canvas.sendToBack(line);
    }

    canvas.renderAll();
  }, [dimensions.height, dimensions.width, showGrid]);

  useEffect(() => {
    const loadFabric = async () => {
      if (window.fabric) return;
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = FABRIC_CDN;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Não foi possível carregar Fabric.js via CDN.'));
        document.body.appendChild(script);
      });
    };

    const setup = async () => {
      try {
        await loadFabric();
        if (!window.fabric || !canvasRef.current) return;

        const canvas = new window.fabric.Canvas(canvasRef.current, {
          width: dimensions.width,
          height: dimensions.height,
          backgroundColor: '#ffffff',
          preserveObjectStacking: true,
          selection: true,
        });

        fabricCanvasRef.current = canvas;

        canvas.on('selection:created', (e: any) => setSelectedObject(e.selected?.[0] ?? null));
        canvas.on('selection:updated', (e: any) => setSelectedObject(e.selected?.[0] ?? null));
        canvas.on('selection:cleared', () => setSelectedObject(null));

        canvas.on('object:moving', (event: any) => {
          const target = event.target;
          if (!target) return;

          if (snapToGrid) {
            target.set({
              left: Math.round((target.left ?? 0) / GRID_SIZE) * GRID_SIZE,
              top: Math.round((target.top ?? 0) / GRID_SIZE) * GRID_SIZE,
            });
          }

          const centerX = target.getCenterPoint().x;
          const centerY = target.getCenterPoint().y;
          const guideX = dimensions.width / 2;
          const guideY = dimensions.height / 2;

          if (Math.abs(centerX - guideX) < ALIGN_TOLERANCE) {
            target.set({ left: guideX - target.getScaledWidth() / 2 });
          }

          if (Math.abs(centerY - guideY) < ALIGN_TOLERANCE) {
            target.set({ top: guideY - target.getScaledHeight() / 2 });
          }
        });

        canvas.on('object:modified', () => pushHistory());
        canvas.on('object:added', (event: any) => {
          if (event.target?.data?.isGridLine || event.target?.data?.isGuide) return;
          pushHistory();
        });

        let panning = false;
        canvas.on('mouse:down', (opt: any) => {
          if (opt.e?.altKey) {
            panning = true;
            canvas.selection = false;
          }
        });

        canvas.on('mouse:move', (opt: any) => {
          if (!panning) return;
          const event = opt.e as MouseEvent;
          canvas.relativePan({ x: event.movementX, y: event.movementY });
        });

        canvas.on('mouse:up', () => {
          panning = false;
          canvas.selection = true;
        });

        drawGrid();
        setLoadingFabric(false);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Erro ao inicializar editor.');
        setLoadingFabric(false);
      }
    };

    void setup();

    return () => {
      fabricCanvasRef.current?.dispose();
      fabricCanvasRef.current = null;
    };
  }, [dimensions.height, dimensions.width, drawGrid, pushHistory, snapToGrid]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.setDimensions({ width: dimensions.width, height: dimensions.height });
    drawGrid();
    canvas.renderAll();
  }, [dimensions.height, dimensions.width, drawGrid]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || !(event.ctrlKey || event.metaKey)) return;

      if (event.key.toLowerCase() === 'z' && historyIndex > 0) {
        event.preventDefault();
        isRestoringRef.current = true;
        canvas.loadFromJSON(history[historyIndex - 1], () => {
          isRestoringRef.current = false;
          canvas.renderAll();
          setHistoryIndex((current) => current - 1);
          savePageSnapshot(activePageId);
        });
      }

      if (event.key.toLowerCase() === 'y' && history[historyIndex + 1]) {
        event.preventDefault();
        isRestoringRef.current = true;
        canvas.loadFromJSON(history[historyIndex + 1], () => {
          isRestoringRef.current = false;
          canvas.renderAll();
          setHistoryIndex((current) => current + 1);
          savePageSnapshot(activePageId);
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePageId, history, historyIndex, savePageSnapshot]);

  const addElement = useCallback((tool: ToolType) => {
    const canvas = fabricCanvasRef.current;
    const fabric = window.fabric;
    if (!canvas || !fabric) return;

    const styles = { left: 100, top: 100 };

    if (tool === 'text') {
      canvas.add(new fabric.IText('Texto médico', { ...styles, fontSize: 22, fill: '#0f172a', fontFamily: 'Arial' }));
    }

    if (tool === 'variable') {
      canvas.add(new fabric.Textbox('{{paciente.nome}}', { ...styles, width: 260, fontSize: 18, fill: '#1d4ed8' }));
    }

    if (tool === 'shape-rect') {
      canvas.add(new fabric.Rect({ ...styles, width: 200, height: 90, fill: '#dbeafe', rx: 8, ry: 8 }));
    }

    if (tool === 'shape-circle') {
      canvas.add(new fabric.Circle({ ...styles, radius: 52, fill: '#fde68a' }));
    }

    if (tool === 'shape-triangle') {
      canvas.add(new fabric.Triangle({ ...styles, width: 90, height: 90, fill: '#fecaca' }));
    }

    if (tool === 'graph-range') {
      canvas.add(new fabric.Rect({ ...styles, width: 320, height: 34, fill: '#e2e8f0', rx: 8, ry: 8 }));
      canvas.add(new fabric.Rect({ ...styles, width: 188, height: 34, fill: '#0ea5e9', rx: 8, ry: 8 }));
      canvas.add(new fabric.Textbox('IMC {{bio.imc}}', { left: 112, top: 109, width: 200, fontSize: 14, fill: '#0f172a' }));
    }

    if (tool === 'graph-gauge') {
      canvas.add(new fabric.Circle({ ...styles, radius: 74, fill: 'transparent', stroke: '#e2e8f0', strokeWidth: 16 }));
      canvas.add(new fabric.Textbox('68%', { left: 140, top: 150, width: 90, fontSize: 28, fill: '#16a34a' }));
    }

    if (tool === 'graph-bars') {
      [70, 110, 85, 132].forEach((h, idx) => {
        canvas.add(
          new fabric.Rect({ left: 100 + idx * 44, top: 260 - h, width: 28, height: h, fill: ['#0ea5e9', '#8b5cf6', '#22c55e', '#f97316'][idx] }),
        );
      });
    }

    if (tool === 'graph-timeline') {
      canvas.add(new fabric.Line([90, 210, 360, 210], { stroke: '#94a3b8', strokeWidth: 2 }));
      canvas.add(
        new fabric.Polyline(
          [
            { x: 90, y: 200 },
            { x: 150, y: 178 },
            { x: 210, y: 162 },
            { x: 270, y: 170 },
            { x: 330, y: 148 },
          ],
          { fill: 'transparent', stroke: '#0284c7', strokeWidth: 3 },
        ),
      );
    }

    if (tool === 'svg') {
      canvas.add(new fabric.Textbox('SVG Médico (placeholder)', { ...styles, width: 240, fontSize: 16, fill: '#475569' }));
    }

    if (tool === 'qr') {
      canvas.add(new fabric.Rect({ ...styles, width: 120, height: 120, fill: '#fff', stroke: '#111827', strokeWidth: 2 }));
      canvas.add(new fabric.Textbox('QR', { left: 145, top: 142, width: 36, fontSize: 24 }));
    }

    if (tool === 'body-visualizer') {
      canvas.add(new fabric.Circle({ left: 168, top: 74, radius: 30, fill: '#bfdbfe' }));
      canvas.add(new fabric.Rect({ left: 140, top: 110, width: 90, height: 190, rx: 16, ry: 16, fill: '#dbeafe' }));
      canvas.add(new fabric.Textbox('Body Visualizer', { left: 128, top: 182, width: 122, fontSize: 13, textAlign: 'center' }));
    }

    if (tool === 'image') {
      fabric.Image.fromURL('https://dummyimage.com/420x140/e2e8f0/1f2937.png&text=Logo+ou+Imagem', (img: any) => {
        img.set({ left: 80, top: 80, scaleX: 0.65, scaleY: 0.65 });
        canvas.add(img);
      });
    }

    canvas.renderAll();
  }, []);

  const layerObjects = useMemo(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return [] as any[];
    return canvas.getObjects().filter((obj: any) => !obj.data?.isGridLine && !obj.data?.isGuide).reverse();
  }, [selectedObject, historyIndex, pages]);

  const updateSelectedProp = (prop: 'left' | 'top' | 'angle' | 'fill' | 'fontSize' | 'width' | 'height', value: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !selectedObject) return;

    if (prop === 'fill') {
      selectedObject.set('fill', value);
    } else {
      selectedObject.set(prop, Number(value));
    }

    selectedObject.setCoords();
    canvas.renderAll();
    pushHistory();
  };

  const duplicateSelected = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !selectedObject) return;

    selectedObject.clone((clone: any) => {
      clone.set({ left: (selectedObject.left ?? 0) + 24, top: (selectedObject.top ?? 0) + 24 });
      canvas.add(clone);
      canvas.setActiveObject(clone);
      setSelectedObject(clone);
      canvas.renderAll();
    });
  };

  const deleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !selectedObject) return;
    canvas.remove(selectedObject);
    setSelectedObject(null);
    canvas.renderAll();
    pushHistory();
  };

  const switchPage = (nextPageId: string) => {
    if (nextPageId === activePageId) return;
    savePageSnapshot(activePageId);
    setActivePageId(nextPageId);
    const next = pages.find((p) => p.id === nextPageId);
    loadSnapshot(next?.objectsJson ?? createEmptySnapshot());
    setHistory([]);
    setHistoryIndex(-1);
  };

  const addPage = () => {
    savePageSnapshot(activePageId);
    const id = `p${pages.length + 1}`;
    const newPage: TemplatePage = { id, name: `Página ${pages.length + 1}`, objectsJson: createEmptySnapshot() };
    setPages((current) => [...current, newPage]);
    setActivePageId(id);
    loadSnapshot(newPage.objectsJson);
    setHistory([]);
    setHistoryIndex(-1);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr_340px]">
      <aside className="space-y-3 rounded-lg border bg-white p-3">
        <h2 className="font-semibold">Ferramentas</h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ['text', 'Texto'],
            ['image', 'Imagem'],
            ['svg', 'SVG'],
            ['variable', 'Variável'],
            ['graph-range', 'Range'],
            ['graph-gauge', 'Gauge'],
            ['graph-bars', 'Barras'],
            ['graph-timeline', 'Linha'],
            ['shape-rect', 'Retângulo'],
            ['shape-circle', 'Círculo'],
            ['shape-triangle', 'Triângulo'],
            ['qr', 'QR'],
            ['body-visualizer', 'Body SVG'],
          ].map(([key, label]) => (
            <button
              className="rounded border px-2 py-2 text-left hover:bg-slate-50"
              key={key}
              onClick={() => addElement(key as ToolType)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-2 border-t pt-3 text-sm">
          <label className="flex items-center justify-between">Grid
            <input checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} type="checkbox" />
          </label>
          <label className="flex items-center justify-between">Snap to grid
            <input checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} type="checkbox" />
          </label>
          <label className="block">
            Formato
            <select className="mt-1 w-full rounded border px-2 py-1" onChange={(e) => setPageFormat(e.target.value as PageFormat)} value={pageFormat}>
              <option value="a4-portrait">A4 Retrato</option>
              <option value="a4-landscape">A4 Paisagem</option>
            </select>
          </label>
          <button className="w-full rounded border bg-white px-2 py-1" onClick={addPage} type="button">+ Nova página</button>
        </div>
      </aside>

      <section className="rounded-lg border bg-slate-50 p-3">
        <header className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <button className="rounded border bg-white px-2 py-1" onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))} type="button">-</button>
          <span>Zoom {Math.round(zoom * 100)}%</span>
          <button className="rounded border bg-white px-2 py-1" onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))} type="button">+</button>
          <span className="ml-2 text-xs text-slate-500">Pan: ALT + arrastar</span>
          <div className="ml-auto flex gap-2">
            {pages.map((page) => (
              <button
                className={`rounded border px-2 py-1 text-xs ${page.id === activePageId ? 'bg-slate-900 text-white' : 'bg-white'}`}
                key={page.id}
                onClick={() => switchPage(page.id)}
                type="button"
              >
                {page.name}
              </button>
            ))}
          </div>
        </header>

        {loadingFabric ? <p className="rounded border bg-white p-3 text-sm">Carregando Fabric.js...</p> : null}
        {loadError ? <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{loadError}</p> : null}

        <div className="overflow-auto rounded border bg-slate-200 p-6">
          <div className="relative mx-auto w-fit">
            <div className="pointer-events-none absolute -top-5 left-0 right-0 flex justify-between text-[10px] text-slate-500">
              <span>0 mm</span>
              <span>{Math.round(dimensions.width / MM_TO_PX)} mm</span>
            </div>
            <div className="pointer-events-none absolute -left-10 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-500">
              <span>0 mm</span>
              <span>{Math.round(dimensions.height / MM_TO_PX)} mm</span>
            </div>
            <canvas ref={canvasRef} style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }} />
          </div>
        </div>
      </section>

      <aside className="space-y-4 rounded-lg border bg-white p-3">
        <section>
          <h2 className="font-semibold">Propriedades</h2>
          {!selectedObject ? <p className="mt-2 text-sm text-slate-500">Selecione um elemento.</p> : null}
          {selectedObject ? (
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {[
                ['left', 'X'],
                ['top', 'Y'],
                ['width', 'Largura'],
                ['height', 'Altura'],
                ['angle', 'Rotação'],
                ['fontSize', 'Fonte'],
              ].map(([prop, label]) => (
                <label className="space-y-1" key={prop}>
                  {label}
                  <input
                    className="w-full rounded border px-2 py-1"
                    defaultValue={Math.round(selectedObject[prop] ?? 0)}
                    onBlur={(e) => updateSelectedProp(prop as any, e.target.value)}
                    type="number"
                  />
                </label>
              ))}

              <label className="col-span-2 space-y-1">
                Cor
                <input className="h-8 w-full rounded border" defaultValue={selectedObject.fill ?? '#111827'} onChange={(e) => updateSelectedProp('fill', e.target.value)} type="color" />
              </label>

              <div className="col-span-2 flex gap-2">
                <button className="w-full rounded border px-2 py-1" onClick={duplicateSelected} type="button">Duplicar</button>
                <button className="w-full rounded border border-red-300 px-2 py-1 text-red-700" onClick={deleteSelected} type="button">Excluir</button>
              </div>
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="font-semibold">Camadas</h2>
          <ul className="mt-2 max-h-52 space-y-2 overflow-auto text-xs">
            {layerObjects.map((obj, index) => (
              <li className="flex items-center gap-1 rounded border p-2" key={`${obj.type}-${index}`}>
                <button
                  className="rounded border px-1"
                  onClick={() => {
                    const canvas = fabricCanvasRef.current;
                    if (!canvas) return;
                    canvas.bringForward(obj);
                    canvas.renderAll();
                  }}
                  type="button"
                >
                  ↑
                </button>
                <button
                  className="rounded border px-1"
                  onClick={() => {
                    const canvas = fabricCanvasRef.current;
                    if (!canvas) return;
                    canvas.sendBackwards(obj);
                    canvas.renderAll();
                  }}
                  type="button"
                >
                  ↓
                </button>
                <button
                  className="rounded border px-1"
                  onClick={() => {
                    obj.visible = !obj.visible;
                    fabricCanvasRef.current?.renderAll();
                    setSelectedObject({ ...obj });
                  }}
                  type="button"
                >
                  {obj.visible === false ? '🙈' : '👁'}
                </button>
                <button
                  className="rounded border px-1"
                  onClick={() => {
                    obj.selectable = !obj.selectable;
                    obj.evented = obj.selectable;
                    fabricCanvasRef.current?.renderAll();
                    setSelectedObject({ ...obj });
                  }}
                  type="button"
                >
                  {obj.selectable === false ? '🔒' : '🔓'}
                </button>
                <button
                  className="truncate text-left"
                  onClick={() => {
                    fabricCanvasRef.current?.setActiveObject(obj);
                    setSelectedObject(obj);
                  }}
                  type="button"
                >
                  {obj.type}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-semibold">Variáveis</h2>
          <ul className="mt-2 space-y-1 text-xs">
            {VARIABLE_TOKENS.map((token) => (
              <li className="rounded border bg-slate-50 px-2 py-1" key={token}>{token}</li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
};
