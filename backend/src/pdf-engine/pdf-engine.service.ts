import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';
type Item = { id: string; tenantId: string; payload: Record<string, unknown>; createdBy: string; createdAt: string; updatedAt: string };

type FabricObject = {
  type?: string;
  text?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
};

type FabricCanvasJson = {
  width?: number;
  height?: number;
  objects?: FabricObject[];
};

@Injectable()
export class PdfEngineService {
  private readonly store: Item[] = [];

  private readonly defaultPageWidth = 794;

  private readonly defaultPageHeight = 1123;

  list(tenantId: string) {
    return this.store.filter((item) => item.tenantId === tenantId);
  }

  create(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    const now = new Date().toISOString();
    const item: Item = { id: randomUUID(), tenantId, payload, createdBy: actorId, createdAt: now, updatedAt: now };
    this.store.push(item);
    return item;
  }

  update(tenantId: string, id: string, payload: Record<string, unknown>) {
    const item = this.store.find((entry) => entry.tenantId === tenantId && entry.id === id);
    if (!item) {
      return null;
    }

    item.payload = { ...item.payload, ...payload };
    item.updatedAt = new Date().toISOString();
    return item;
  }

  remove(tenantId: string, id: string) {
    const index = this.store.findIndex((entry) => entry.tenantId === tenantId && entry.id === id);
    if (index < 0) {
      return { deleted: false };
    }

    this.store.splice(index, 1);
    return { deleted: true };
  }

  async renderPdf(canvasJson: unknown): Promise<Buffer> {
    const parsed = this.resolveCanvas(canvasJson);
    const html = this.buildHtml(parsed);
    let browser: { newPage: () => Promise<{ setContent: (html: string, options: { waitUntil: 'networkidle0' }) => Promise<void>; pdf: (options: { format: 'A4'; printBackground: boolean }) => Promise<Uint8Array> }>; close: () => Promise<void> } | null = null;

    try {
      const puppeteer = await this.loadPuppeteer();
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      return Buffer.from(pdf);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  execute(action: string, tenantId: string, actorId: string, payload: Record<string, unknown>) {
    return { action, tenantId, actorId, status: 'queued', payload };
  }


  private async loadPuppeteer(): Promise<{ launch: (options: { headless: boolean; args: string[] }) => Promise<{ newPage: () => Promise<{ setContent: (html: string, options: { waitUntil: 'networkidle0' }) => Promise<void>; pdf: (options: { format: 'A4'; printBackground: boolean }) => Promise<Uint8Array> }>; close: () => Promise<void> }> }> {
    const moduleName = 'puppeteer';
    const module = await import(moduleName);
    const puppeteer = (module as { default?: unknown }).default ?? module;
    return puppeteer as { launch: (options: { headless: boolean; args: string[] }) => Promise<{ newPage: () => Promise<{ setContent: (html: string, options: { waitUntil: 'networkidle0' }) => Promise<void>; pdf: (options: { format: 'A4'; printBackground: boolean }) => Promise<Uint8Array> }>; close: () => Promise<void> }> };
  }

  private resolveCanvas(canvasJson: unknown): FabricCanvasJson {
    if (!canvasJson || typeof canvasJson !== 'object') {
      return { objects: [] };
    }

    const raw = canvasJson as Partial<FabricCanvasJson>;
    const objects = Array.isArray(raw.objects) ? raw.objects : [];

    return {
      width: typeof raw.width === 'number' ? raw.width : this.defaultPageWidth,
      height: typeof raw.height === 'number' ? raw.height : this.defaultPageHeight,
      objects,
    };
  }

  private buildHtml(canvas: FabricCanvasJson): string {
    const objectsHtml = (canvas.objects ?? []).map((object) => this.objectToHtml(object)).join('');

    return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #ffffff; }
    .page {
      position: relative;
      width: ${canvas.width}px;
      height: ${canvas.height}px;
      margin: 0 auto;
      overflow: hidden;
      background: #fff;
    }
    .object {
      position: absolute;
      white-space: pre-wrap;
      word-break: break-word;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div class="page">${objectsHtml}</div>
</body>
</html>`;
  }

  private objectToHtml(object: FabricObject): string {
    const left = this.numberOrZero(object.left);
    const top = this.numberOrZero(object.top);
    const scaleX = this.numberOrOne(object.scaleX);
    const scaleY = this.numberOrOne(object.scaleY);
    const width = this.numberOrZero(object.width) * scaleX;
    const height = this.numberOrZero(object.height) * scaleY;
    const fontSize = this.numberOrFallback(object.fontSize, 16);
    const color = this.escapeHtml(object.fill ?? object.color ?? '#000000');
    const fontFamily = this.escapeHtml(object.fontFamily ?? 'Arial, sans-serif');
    const textAlign = object.textAlign ?? 'left';

    const style = [
      `left:${left}px`,
      `top:${top}px`,
      `width:${width}px`,
      `height:${height}px`,
      `font-size:${fontSize}px`,
      `font-family:${fontFamily}`,
      `color:${color}`,
      `text-align:${textAlign}`,
      object.type === 'rect' ? `background:${color}` : '',
    ]
      .filter(Boolean)
      .join(';');

    if (object.type === 'textbox' || object.type === 'i-text' || object.type === 'text') {
      return `<div class="object" style="${style}">${this.escapeHtml(object.text ?? '')}</div>`;
    }

    return `<div class="object" style="${style}"></div>`;
  }

  private numberOrZero(value?: number): number {
    return typeof value === 'number' ? value : 0;
  }

  private numberOrOne(value?: number): number {
    return typeof value === 'number' ? value : 1;
  }

  private numberOrFallback(value: number | undefined, fallback: number): number {
    return typeof value === 'number' ? value : fallback;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
