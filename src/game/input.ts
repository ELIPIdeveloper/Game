// Simple global input singleton polled inside useFrame loops (avoids React re-renders).
class InputState {
  keys = new Set<string>();
  mouseDown = false;
  rightDown = false;
  dragging = false;
  orbitYaw = 0;
  orbitPitch = 0.35;
  zoom = 1;
  lastX = 0;
  lastY = 0;
  fireRequested = false;

  isDown(code: string) {
    return this.keys.has(code);
  }
  anyDown(...codes: string[]) {
    return codes.some((c) => this.keys.has(c));
  }
}

export const input = new InputState();

let initialized = false;
export function initInput() {
  if (initialized) return;
  initialized = true;

  window.addEventListener("keydown", (e) => {
    input.keys.add(e.code);
  });
  window.addEventListener("keyup", (e) => {
    input.keys.delete(e.code);
  });
  window.addEventListener("blur", () => input.keys.clear());

  window.addEventListener("mousedown", (e) => {
    if (e.button === 0) {
      input.mouseDown = true;
      input.fireRequested = true;
    }
    if (e.button === 2) input.rightDown = true;
    input.dragging = true;
    input.lastX = e.clientX;
    input.lastY = e.clientY;
  });
  window.addEventListener("mouseup", (e) => {
    if (e.button === 0) input.mouseDown = false;
    if (e.button === 2) input.rightDown = false;
    input.dragging = false;
  });
  window.addEventListener("mousemove", (e) => {
    if (input.dragging) {
      const dx = e.clientX - input.lastX;
      const dy = e.clientY - input.lastY;
      input.lastX = e.clientX;
      input.lastY = e.clientY;
      input.orbitYaw -= dx * 0.005;
      input.orbitPitch = Math.max(0.08, Math.min(1.3, input.orbitPitch - dy * 0.004));
    }
  });
  window.addEventListener(
    "wheel",
    (e) => {
      input.zoom = Math.max(0.5, Math.min(2.5, input.zoom + e.deltaY * 0.001));
    },
    { passive: true }
  );
  window.addEventListener("contextmenu", (e) => e.preventDefault());
}
