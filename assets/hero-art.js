/* An original, dependency-free contour sculpture for the portfolio hero. */
(() => {
  'use strict';

  const canvas = document.getElementById('hero-art');
  if (!canvas) return;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  const host = canvas.closest('.hero-artwork') || canvas.parentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  let width = 1;
  let height = 1;
  let pixelRatio = 1;
  let rings = [];
  let samples = 60;
  let visible = true;
  let enabled = document.documentElement.dataset.motion !== 'off';
  let frame = 0;
  let previousFrame = 0;
  let elapsed = 0;
  let pointerX = 0;
  let pointerY = 0;
  let easedX = 0;
  let easedY = 0;

  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  function makeSculpture() {
    const count = width < 450 ? 68 : 88;
    samples = width < 450 ? 48 : 60;
    rings = [];

    for (let index = 0; index < count; index += 1) {
      const u = (index / count) * TAU;
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);
      const radius = 1.12 + 0.095 * Math.cos(3 * u + 0.45);
      const center = [radius * cosU, radius * sinU, 0.12 * Math.sin(2 * u)];
      const twist = 1.5 * u + 0.35;
      const cosTwist = Math.cos(twist);
      const sinTwist = Math.sin(twist);
      const thickness = 0.47 + 0.055 * Math.sin(3 * u - 0.2);
      const vertices = [];

      for (let point = 0; point <= samples; point += 1) {
        const v = (point / samples) * TAU;
        const radial = thickness * Math.cos(v);
        const axial = thickness * 0.76 * Math.sin(v);
        const out = radial * cosTwist - axial * sinTwist;
        const z = radial * sinTwist + axial * cosTwist;
        const length = Math.hypot(out, z);
        vertices.push({
          x: center[0] + out * cosU,
          y: center[1] + out * sinU,
          z: center[2] + z,
          nx: (out * cosU) / length,
          ny: (out * sinU) / length,
          nz: z / length,
        });
      }
      rings.push({ center, vertices, index });
    }
  }

  function rotation(x, y, z) {
    const cx = Math.cos(x);
    const sx = Math.sin(x);
    const cy = Math.cos(y);
    const sy = Math.sin(y);
    const cz = Math.cos(z);
    const sz = Math.sin(z);
    return [
      cy * cz, sx * sy * cz - cx * sz, cx * sy * cz + sx * sz,
      cy * sz, sx * sy * sz + cx * cz, cx * sy * sz - sx * cz,
      -sy, sx * cy, cx * cy,
    ];
  }

  function render() {
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    if (width < 2 || height < 2) return;

    const size = Math.min(width, height);
    const centerX = width * 0.5;
    const centerY = height * 0.49;
    const scale = size * 0.253;
    const breathing = Math.sin(elapsed * 0.32) * 0.045;
    const matrix = rotation(
      0.48 + breathing + easedY * 0.15,
      -0.5 + elapsed * 0.067 + easedX * 0.2,
      -0.34 + Math.sin(elapsed * 0.21) * 0.045,
    );

    // A quiet ambient halo and a soft ground shadow anchor the wire sculpture.
    const halo = context.createRadialGradient(centerX, centerY, size * 0.04, centerX, centerY, size * 0.48);
    halo.addColorStop(0, 'rgba(174, 208, 103, 0.044)');
    halo.addColorStop(0.6, 'rgba(142, 171, 81, 0.016)');
    halo.addColorStop(1, 'rgba(142, 171, 81, 0)');
    context.fillStyle = halo;
    context.fillRect(0, 0, width, height);

    context.save();
    context.translate(centerX, height * 0.9);
    context.scale(1, 0.15);
    const shadow = context.createRadialGradient(0, 0, 0, 0, 0, size * 0.32);
    shadow.addColorStop(0, 'rgba(0, 0, 0, 0.22)');
    shadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = shadow;
    context.fillRect(-size * 0.35, -size * 0.35, size * 0.7, size * 0.7);
    context.restore();

    const projected = rings.map((ring) => {
      const [cx, cy, cz] = ring.center;
      const depth = matrix[6] * cx + matrix[7] * cy + matrix[8] * cz;
      const points = ring.vertices.map((point) => {
        const x = matrix[0] * point.x + matrix[1] * point.y + matrix[2] * point.z;
        const y = matrix[3] * point.x + matrix[4] * point.y + matrix[5] * point.z;
        const z = matrix[6] * point.x + matrix[7] * point.y + matrix[8] * point.z;
        const perspective = 6.5 / (6.5 - z);
        const nx = matrix[0] * point.nx + matrix[1] * point.ny + matrix[2] * point.nz;
        const ny = matrix[3] * point.nx + matrix[4] * point.ny + matrix[5] * point.nz;
        const nz = matrix[6] * point.nx + matrix[7] * point.ny + matrix[8] * point.nz;
        const light = clamp((-0.5 * nx + 0.64 * ny + 0.59 * nz + 1) * 0.5, 0, 1);
        return {
          x: centerX + x * scale * perspective,
          y: centerY - y * scale * perspective,
          z,
          light,
          facing: nz,
        };
      });
      return { depth, points, index: ring.index };
    });

    projected.sort((a, b) => a.depth - b.depth);
    context.lineCap = 'round';
    context.lineJoin = 'round';

    projected.forEach((ring) => {
      const depth = clamp((ring.depth + 1.35) / 2.7, 0, 1);
      const points = ring.points;

      // Nearly transparent cross-sections retain depth without hiding the filaments.
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      for (let index = 1; index < points.length; index += 1) {
        context.lineTo(points[index].x, points[index].y);
      }
      context.closePath();
      context.fillStyle = `rgba(18,20,19,${0.045 + depth * 0.065})`;
      context.fill();

      const arcLength = samples / 6;
      for (let arc = 0; arc < 6; arc += 1) {
        const start = arc * arcLength;
        const end = start + arcLength;
        const middle = points[start + Math.floor(arcLength / 2)];
        const light = middle.light;
        const front = clamp((middle.facing + 0.3) / 1.3, 0, 1);
        const opacity = clamp(0.12 + depth * 0.24 + light * 0.31 + front * 0.1, 0, 0.83);
        const red = Math.round(113 + light * 104);
        const green = Math.round(136 + light * 109);
        const blue = Math.round(70 + light * 63);
        context.beginPath();
        context.moveTo(points[start].x, points[start].y);
        for (let index = start + 1; index <= end; index += 1) {
          context.lineTo(points[index].x, points[index].y);
        }
        context.strokeStyle = `rgba(${red},${green},${blue},${opacity})`;
        context.lineWidth = (0.54 + depth * 0.36 + light * 0.18) * (size < 380 ? 0.9 : 1);
        context.stroke();
      }
    });
  }

  const canAnimate = () => enabled && !reducedMotion.matches && visible && !document.hidden;

  function tick(timestamp) {
    frame = 0;
    if (!canAnimate()) return;
    const interval = width < 450 ? 40 : 32;
    if (!previousFrame || timestamp - previousFrame >= interval) {
      const delta = previousFrame ? Math.min((timestamp - previousFrame) / 1000, 0.08) : 0;
      previousFrame = timestamp;
      elapsed += delta;
      easedX += (pointerX - easedX) * 0.075;
      easedY += (pointerY - easedY) * 0.075;
      render();
    }
    frame = window.requestAnimationFrame(tick);
  }

  function updateActivity() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    previousFrame = 0;
    if (canAnimate()) frame = window.requestAnimationFrame(tick);
    else render();
  }

  function resize() {
    const bounds = host.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(bounds.width));
    const nextHeight = Math.max(1, Math.round(bounds.height));
    const nextRatio = Math.min(window.devicePixelRatio || 1, 2);
    if (nextWidth === width && nextHeight === height && nextRatio === pixelRatio) return;
    width = nextWidth;
    height = nextHeight;
    pixelRatio = nextRatio;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    makeSculpture();
    render();
    updateActivity();
  }

  host.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || !canAnimate()) return;
    const bounds = host.getBoundingClientRect();
    pointerX = clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 2, -1, 1);
    pointerY = clamp(((event.clientY - bounds.top) / bounds.height - 0.5) * 2, -1, 1);
  }, { passive: true });

  host.addEventListener('pointerleave', () => {
    pointerX = 0;
    pointerY = 0;
  }, { passive: true });

  document.addEventListener('portfolio:motion', (event) => {
    if (typeof event.detail?.enabled !== 'boolean') return;
    enabled = event.detail.enabled;
    updateActivity();
  });
  document.addEventListener('visibilitychange', updateActivity);
  reducedMotion.addEventListener('change', updateActivity);

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
  else window.addEventListener('resize', resize, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      updateActivity();
    }, { threshold: 0.01 }).observe(host);
  }

  resize();
})();
