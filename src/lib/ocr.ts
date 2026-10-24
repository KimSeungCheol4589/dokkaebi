// 브라우저 안에서 스크린샷 글자를 읽습니다 (Tesseract.js). 이미지는 어디에도 업로드되지 않고,
// 한국어·영어 인식 데이터만 처음 한 번 CDN 에서 내려받습니다.
import type { Worker } from 'tesseract.js';

export interface OcrWord {
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OcrRow {
  text: string;
  words: OcrWord[];
  y: number;
}

let workerPromise: Promise<Worker> | null = null;
let progressCb: ((p: number) => void) | null = null;

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = import('tesseract.js').then(({ createWorker }) =>
      createWorker(['kor', 'eng'], 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') progressCb?.(m.progress);
        },
      }),
    );
    workerPromise.catch(() => (workerPromise = null));
  }
  return workerPromise;
}

/** 게임 화면(어두운 배경·밝은 글자)을 인식이 잘 되는 밝은 배경·검은 글자로 바꾸고 2배 키웁니다. */
async function preprocess(file: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const scale = bitmap.width < 1800 ? 2 : 1;
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width * scale;
  canvas.height = bitmap.height * scale;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  const dark = sum / (d.length / 4) < 128;
  for (let i = 0; i < d.length; i += 4) {
    // 글자 색(흰색·노란색 등)이 남도록 가장 밝은 채널 기준으로 회색 변환
    let v = Math.max(d[i], d[i + 1], d[i + 2]);
    if (dark) v = 255 - v;
    v = v < 150 ? Math.max(0, (v - 40) * 1.6) : 255; // 대비 강화
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** 스크린샷을 읽어 화면의 가로줄(행) 단위로 돌려줍니다. */
export async function readScreenshot(file: Blob, onProgress?: (p: number) => void): Promise<OcrRow[]> {
  const worker = await getWorker();
  const canvas = await preprocess(file);
  progressCb = onProgress ?? null;
  try {
    const { data } = await worker.recognize(canvas, {}, { blocks: true });
    const words: OcrWord[] = [];
    for (const b of data.blocks ?? [])
      for (const p of b.paragraphs)
        for (const l of p.lines)
          for (const w of l.words) {
            const t = w.text.trim();
            if (t) words.push({ text: t, ...w.bbox });
          }
    return groupRows(words);
  } finally {
    progressCb = null;
  }
}

/** 세로 위치가 비슷한 단어끼리 한 행으로 묶습니다 (닉네임과 전투력이 다른 칸에 있어도 같은 행으로). */
function groupRows(words: OcrWord[]): OcrRow[] {
  const sorted = [...words].sort((a, b) => (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2);
  const rows: OcrWord[][] = [];
  for (const w of sorted) {
    const cy = (w.y0 + w.y1) / 2;
    const h = w.y1 - w.y0;
    const row = rows[rows.length - 1];
    if (row) {
      const last = row[row.length - 1];
      const ly = (last.y0 + last.y1) / 2;
      if (Math.abs(cy - ly) < Math.max(h, last.y1 - last.y0) * 0.6) {
        row.push(w);
        continue;
      }
    }
    rows.push([w]);
  }
  return rows.map((r) => {
    const ws = r.sort((a, b) => a.x0 - b.x0);
    return { words: ws, text: ws.map((w) => w.text).join(' '), y: ws[0].y0 };
  });
}
