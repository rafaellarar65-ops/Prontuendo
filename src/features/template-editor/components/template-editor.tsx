import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { AlertCircle, Eye, FileDown, Loader2, Save, Trash2, X } from 'lucide-react';
import { consultationApi } from '@/lib/api/consultation-api';
import { http } from '@/lib/api/http';
import { patientApi } from '@/lib/api/patient-api';
import type { Patient } from '@/types/api';
import type { TemplateRecord } from '@/types/template';

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
type ContextAction = 'preview' | 'pdf';

interface RenderTemplatePayload {
  patientId: string;
  consultationId?: string;
}

const MM_TO_PX = 3.7795275591;
const GRID_SIZE = 24;

const variables = ['{{paciente.nome}}', '{{bio.peso}}', '{{bio.imc}}', '{{glicemia.media}}', '{{medico.crm}}', '{{data.hoje}}'];

const pageDimensions = (format: PageFormat) =>
  format === 'a4-landscape'
    ? { width: Math.round(297 * MM_TO_PX), height: Math.round(210 * MM_TO_PX) }
    : { width: Math.round(210 * MM_TO_PX), height: Math.round(297 * MM_TO_PX) };

const mapTemplateName = (template: TemplateRecord) => template.name ?? template.payload?.name ?? 'Sem nome';
const mapCanvasJson = (template: TemplateRecord) => template.canvasJson ?? template.payload?.canvas;

const saveTemplate = async (name: string, canvasJson: object) => {
  const { data } = await http.post('/templates', { name, canvasJson });
  return data as { id: string };
};

const loadTemplates = async (): Promise<TemplateRecord[]> => {
  const { data } = await http.get('/templates');
  return data as TemplateRecord[];
};

const renderTemplate = async (templateId: string, payload: RenderTemplatePayload) => {
  const { data } = await http.post(`/templates/${templateId}/render`, payload);
  return data as { canvasJson: object };
};

const generateTemplatePdf = async (templateId: string, payload: RenderTemplatePayload) => {
  const { data } = await http.post<Blob>(`/templates/${templateId}/pdf`, payload, { responseType: 'blob' as const });
  return data;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

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
  const [initError, setInitError] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('Novo template');
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<TemplateRecord[]>([]);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [editableSnapshot, setEditableSnapshot] = useState<string | null>(null);

  const [contextModalOpen, setContextModalOpen] = useState(false);
  const [contextAction, setContextAction] = useState<ContextAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [consultations, setConsultations] = useState<Array<{ id: string; createdAt: string }>>([]);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedConsultationId, setSelectedConsultationId] = useState<string>('');

  const dimensions = useMemo(() => pageDimensions(pageFormat), [pageFormat]);

  const pushHistory = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || isPreviewMode) return;
    const snapshot = JSON.stringify(canvas.toJSON(['data']));
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), snapshot].slice(-40));
    setHistoryIndex((prev) => Math.min(prev + 1, 39));
  }, [historyIndex, isPreviewMode]);

  useEffect(() => {
    const setup = () => {
      if (!canvasRef.current) return;

      const canvas = new fabric.Canvas(canvasRef.current, {
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
        if (!snapToGrid || !event.target || isPreviewMode) return;
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

    try {
      setup();
      setInitError(null);
    } catch {
      setInitError('Não foi possível inicializar o editor de template no momento.');
      fabricCanvasRef.current = null;
    }

    return () => {
      fabricCanvasRef.current?.dispose();
      fabricCanvasRef.current = null;
    };
  }, [dimensions.height, dimensions.width, isPreviewMode, pushHistory, snapToGrid]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || !(event.ctrlKey || event.metaKey) || isPreviewMode) return;
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
  }, [history, historyIndex, isPreviewMode]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
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
    if (!canvas || isPreviewMode) return;

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
  }, [isPreviewMode]);

  const layerObjects = useMemo(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return [];
    return canvas.getObjects().filter((obj: any) => !obj.data?.isGridLine).reverse();
  }, [historyIndex, selectedObject]);

  const handleSave = useCallback(async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || isPreviewMode) return;
    setSavingStatus('saving');
    try {
      const { id } = await saveTemplate(templateName, canvas.toJSON(['data']));
      setCurrentTemplateId(id);
      setSavingStatus('saved');
      const templates = await loadTemplates();
      setSavedTemplates(templates);
      setTimeout(() => setSavingStatus('idle'), 2000);
    } catch {
      setSavingStatus('idle');
    }
  }, [isPreviewMode, templateName]);

  const handleLoad = useCallback((template: TemplateRecord) => {
    const canvas = fabricCanvasRef.current;
    const templateCanvas = mapCanvasJson(template);
    if (!canvas || !templateCanvas) return;
    if (isPreviewMode) {
      const shouldExit = window.confirm('Você está em modo preview. Deseja sair do preview e carregar outro template?');
      if (!shouldExit) return;
    }
    setIsPreviewMode(false);
    setEditableSnapshot(null);
    if (mapTemplateName(template)) setTemplateName(mapTemplateName(template));
    setCurrentTemplateId(template.id);
    canvas.loadFromJSON(templateCanvas, () => canvas.renderAll());
  }, [isPreviewMode]);

  const handleClear = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || isPreviewMode) return;
    canvas.getObjects().filter((obj: any) => !obj.data?.isGridLine).forEach((obj: any) => canvas.remove(obj));
    canvas.renderAll();
  }, [isPreviewMode]);

  const exitPreviewMode = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !editableSnapshot) return;
    canvas.loadFromJSON(editableSnapshot, () => {
      canvas.renderAll();
      setIsPreviewMode(false);
      setEditableSnapshot(null);
      setActionError(null);
    });
  }, [editableSnapshot]);

  const openContextModal = useCallback((action: ContextAction) => {
    if (!currentTemplateId) {
      setActionError('Salve ou carregue um template antes de continuar.');
      return;
    }
    setContextAction(action);
    setContextModalOpen(true);
    setActionError(null);
  }, [currentTemplateId]);

  const applyContextAction = useCallback(async () => {
    if (!currentTemplateId || !selectedPatientId || !contextAction) return;

    const payload: RenderTemplatePayload = {
      patientId: selectedPatientId,
      ...(selectedConsultationId ? { consultationId: selectedConsultationId } : {}),
    };

    try {
      if (contextAction === 'preview') {
        setPreviewLoading(true);
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        if (!editableSnapshot) {
          setEditableSnapshot(JSON.stringify(canvas.toJSON(['data'])));
        }

        const response = await renderTemplate(currentTemplateId, payload);
        canvas.loadFromJSON(response.canvasJson, () => {
          canvas.discardActiveObject();
          canvas.forEachObject((obj: any) => obj.set({ selectable: false, evented: false }));
          canvas.renderAll();
          setIsPreviewMode(true);
        });
      }

      if (contextAction === 'pdf') {
        setPdfLoading(true);
        const blob = await generateTemplatePdf(currentTemplateId, payload);
        const safeName = templateName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
        downloadBlob(blob, `${safeName || 'template'}-preview.pdf`);
      }

      setContextModalOpen(false);
      setActionError(null);
    } catch {
      setActionError(contextAction === 'preview' ? 'Erro ao gerar preview com dados.' : 'Erro ao gerar PDF do template.');
    } finally {
      setPreviewLoading(false);
      setPdfLoading(false);
    }
  }, [contextAction, currentTemplateId, editableSnapshot, selectedConsultationId, selectedPatientId, templateName]);

  useEffect(() => {
    loadTemplates().then(setSavedTemplates).catch(() => {});
  }, []);

  useEffect(() => {
    if (!contextModalOpen) return;
    setLoadingPatients(true);
    patientApi
      .list()
      .then(setPatients)
      .catch(() => setActionError('Não foi possível carregar pacientes para o preview.'))
      .finally(() => setLoadingPatients(false));
  }, [contextModalOpen]);

  useEffect(() => {
    if (!selectedPatientId) {
      setConsultations([]);
      setSelectedConsultationId('');
      return;
    }
    setLoadingConsultations(true);
    consultationApi
      .list(selectedPatientId)
      .then((data) => setConsultations(data.map((c) => ({ id: c.id, createdAt: c.createdAt }))))
      .catch(() => setActionError('Não foi possível carregar consultas do paciente selecionado.'))
      .finally(() => setLoadingConsultations(false));
  }, [selectedPatientId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg border bg-white px-4 py-2">
        <input
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className="flex-1 rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:border-indigo-400"
          placeholder="Nome do template"
          disabled={isPreviewMode}
        />
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          type="button"
          disabled={isPreviewMode || savingStatus === 'saving'}
        >
          <Save size={13} />
          {savingStatus === 'saving' ? 'Salvando...' : savingStatus === 'saved' ? 'Salvo!' : 'Salvar'}
        </button>
        <button onClick={handleClear} className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-60" type="button" disabled={isPreviewMode}>
          <Trash2 size={12} /> Limpar
        </button>
        <button onClick={() => openContextModal('preview')} className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50" type="button" disabled={!currentTemplateId || previewLoading}>
          {previewLoading ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />} Preview com dados
        </button>
        <button onClick={() => openContextModal('pdf')} className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50" type="button" disabled={!currentTemplateId || pdfLoading}>
          {pdfLoading ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />} Gerar PDF
        </button>
        {savedTemplates.length > 0 && (
          <select
            onChange={(e) => {
              const t = savedTemplates.find((tpl) => tpl.id === e.target.value);
              if (t) handleLoad(t);
            }}
            defaultValue=""
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-indigo-400"
          >
            <option value="" disabled>Carregar template...</option>
            {savedTemplates.map((t) => (
              <option key={t.id} value={t.id}>{mapTemplateName(t)}</option>
            ))}
          </select>
        )}
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertCircle size={14} /> {actionError}
        </div>
      )}

      {isPreviewMode && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <p>Modo preview ativo. O template original não será sobrescrito até você sair do preview.</p>
          <button type="button" onClick={exitPreviewMode} className="rounded border border-amber-300 bg-white px-2 py-1 font-medium">Voltar para edição</button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[220px_1fr_320px]">
        <aside className="space-y-3 rounded-lg border bg-white p-3">
          <h2 className="font-semibold">Toolbar</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['text', 'Texto'], ['image', 'Imagem'], ['svg', 'SVG'], ['variable', 'Variável'], ['graph-range', 'Range Bar'],
              ['graph-gauge', 'Gauge'], ['shape-rect', 'Retângulo'], ['shape-circle', 'Círculo'], ['qr', 'QR Code'],
            ].map(([key, label]) => (
              <button className="rounded border px-2 py-2 text-left hover:bg-slate-50 disabled:opacity-60" key={key} onClick={() => addElement(key as ToolType)} type="button" disabled={isPreviewMode}>{label}</button>
            ))}
          </div>
          <label className="flex items-center justify-between text-sm">Grid <input checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} type="checkbox" /></label>
          <label className="flex items-center justify-between text-sm">Snap <input checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} type="checkbox" disabled={isPreviewMode} /></label>
          <select className="w-full rounded border px-2 py-1 text-sm" onChange={(e) => setPageFormat(e.target.value as PageFormat)} value={pageFormat}>
            <option value="a4-portrait">A4 Retrato</option>
            <option value="a4-landscape">A4 Paisagem</option>
          </select>
        </aside>

        <section className="rounded-lg border bg-slate-50 p-3">
          {initError ? <p className="mb-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">{initError}</p> : null}
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

      {contextModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{contextAction === 'preview' ? 'Preview com dados' : 'Gerar PDF'}</h3>
              <button type="button" onClick={() => setContextModalOpen(false)}><X size={15} /></button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-600">Paciente</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full rounded border border-slate-200 px-2 py-2 text-sm"
                disabled={loadingPatients}
              >
                <option value="">Selecione um paciente...</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>{patient.fullName}</option>
                ))}
              </select>
              <label className="block text-xs font-medium text-slate-600">Consulta (opcional)</label>
              <select
                value={selectedConsultationId}
                onChange={(e) => setSelectedConsultationId(e.target.value)}
                className="w-full rounded border border-slate-200 px-2 py-2 text-sm"
                disabled={!selectedPatientId || loadingConsultations}
              >
                <option value="">Sem consulta específica</option>
                {consultations.map((consultation) => (
                  <option key={consultation.id} value={consultation.id}>
                    {new Date(consultation.createdAt).toLocaleDateString('pt-BR')} - {consultation.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded border px-3 py-1.5 text-xs" onClick={() => setContextModalOpen(false)}>Cancelar</button>
              <button
                type="button"
                className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-indigo-300"
                onClick={applyContextAction}
                disabled={!selectedPatientId || previewLoading || pdfLoading}
              >
                {previewLoading || pdfLoading ? <Loader2 size={12} className="animate-spin" /> : contextAction === 'preview' ? 'Gerar preview' : 'Gerar PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
