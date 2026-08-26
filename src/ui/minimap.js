import { PLANETS } from '../objects/planets.js';
import { state, emit } from '../core/state.js';

export const minimap = {
  canvas: null,
  ctx: null,
  bigCanvas: null,
  bigCtx: null,
  expanded: false,
  bigOpen: false,

  init() {
    const holder = document.getElementById('ui');
    const wrap = document.createElement('div');
    wrap.className = 'ui-block minimap-wrap';
    wrap.innerHTML = '<canvas id="minimap" class="ui-el" width="150" height="150"></canvas>';
    holder.appendChild(wrap);
    this.canvas = document.getElementById('minimap');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.addEventListener('click', () => emit('toggleMap'));

    this.bigCanvas = document.getElementById('bigmap-canvas');
    this.bigCtx = this.bigCanvas.getContext('2d');

    addEventListener('resize', () => this.sizeBig());
    this.sizeBig();
  },

  sizeBig() {
    const s = Math.min(innerWidth, innerHeight) * 0.72;
    this.bigCanvas.width = s;
    this.bigCanvas.height = s;
  },

  draw(rocketPos, rocketYaw) {
    if (!state.launched) return;
    this._drawTo(this.ctx, 150, rocketPos, rocketYaw, false);
    if (this.bigOpen) {
      const s = this.bigCanvas.width;
      this._drawTo(this.bigCtx, s, rocketPos, rocketYaw, true);
    }
  },

  _drawTo(ctx, size, rocketPos, rocketYaw, withNames) {
    const c = size / 2;
    const scale = (withNames ? (c - 34) : (c - 14)) / 300;
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(c, c, c - 3, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = 'rgba(10,16,58,0.55)';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(160,150,255,0.18)';
    ctx.lineWidth = 1;
    for (let r = 1; r <= 3; r++) {
      ctx.beginPath();
      ctx.arc(c, c, ((c - 6) / 3) * r * (withNames ? 0.92 : 1), 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const p of PLANETS) {
      const px = c + p.pos.x * scale * 0.98;
      const py = c + p.pos.z * scale * 0.98;
      const pr = withNames ? Math.max(5, p.radius * 0.32) : 4.5;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      if (p.discovered) {
        ctx.fillStyle = p.id === 'forever' && p.locked && p.locked() ? '#b08fd8' : '#ffd88a';
        ctx.shadowColor = '#ffd88a';
        ctx.shadowBlur = withNames ? 12 : 7;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = 'rgba(143,134,201,0.55)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(200,190,255,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      if (withNames) {
        ctx.font = '600 13px Quicksand, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(235,230,255,0.9)';
        ctx.fillText(p.name, px, py + pr + 15);
      }
    }

    const rx = c + rocketPos.x * scale * 0.98;
    const ry = c + rocketPos.z * scale * 0.98;
    ctx.translate(rx, ry);
    ctx.rotate(Math.PI - rocketYaw);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#9ad5ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
};
