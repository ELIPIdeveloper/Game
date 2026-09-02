import * as THREE from "three";

function canvasTex(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const asphaltTexture = canvasTex(256, (ctx, s) => {
  ctx.fillStyle = "#232427";
  ctx.fillRect(0, 0, s, s);
  const imgData = ctx.getImageData(0, 0, s, s);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    imgData.data[i] += n;
    imgData.data[i + 1] += n;
    imgData.data[i + 2] += n;
  }
  ctx.putImageData(imgData, 0, 0);
});
asphaltTexture.repeat.set(40, 40);

export const sidewalkTexture = canvasTex(128, (ctx, s) => {
  ctx.fillStyle = "#9a9a92";
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 2;
  const step = s / 4;
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step, s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * step);
    ctx.lineTo(s, i * step);
    ctx.stroke();
  }
});
sidewalkTexture.repeat.set(4, 4);

export const grassTexture = canvasTex(128, (ctx, s) => {
  ctx.fillStyle = "#3f6b3a";
  ctx.fillRect(0, 0, s, s);
  const imgData = ctx.getImageData(0, 0, s, s);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 24;
    imgData.data[i] += n * 0.5;
    imgData.data[i + 1] += n;
    imgData.data[i + 2] += n * 0.3;
  }
  ctx.putImageData(imgData, 0, 0);
});
grassTexture.repeat.set(10, 10);

function makeFacade(litRatio: number, seed: number) {
  return canvasTex(64, (ctx, s) => {
    ctx.fillStyle = "#0b0d12";
    ctx.fillRect(0, 0, s, s);
    const cols = 8;
    const rows = 12;
    let r = seed;
    const rand = () => {
      r = (r * 9301 + 49297) % 233280;
      return r / 233280;
    };
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const lit = rand() < litRatio;
        ctx.fillStyle = lit ? "#ffd98a" : "#141824";
        const w = s / cols;
        const h = s / rows;
        ctx.fillRect(x * w + 1, y * h + 1, w - 2, h - 2);
      }
    }
  });
}

export const facadeDay = makeFacade(0.04, 7);
export const facadeNight = makeFacade(0.55, 7);
facadeDay.repeat.set(1, 1);
facadeNight.repeat.set(1, 1);

export function buildingFacadeTexture(seed: number, lit: number) {
  return makeFacade(lit, seed);
}
