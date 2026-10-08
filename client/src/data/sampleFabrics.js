// Built-in High-Definition Fabric Defect Samples for Quick Testing

export const SAMPLE_FABRICS = [
  {
    id: 'sample-denim-hole',
    name: 'Denim Twill - Puncture & Weft Tear',
    fabricType: 'Heavy Denim (14oz)',
    defectCount: 2,
    previewColor: '#1d3557',
    primaryDefect: 'Hole',
    generateCanvasDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      // Denim base
      ctx.fillStyle = '#1e385b';
      ctx.fillRect(0, 0, 640, 480);

      // Twill weave lines
      ctx.strokeStyle = '#274b7a';
      ctx.lineWidth = 1.5;
      for (let x = -480; x < 640; x += 6) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 480, 480);
        ctx.stroke();
      }

      // Cross threads
      ctx.strokeStyle = '#162b47';
      ctx.lineWidth = 1;
      for (let y = 0; y < 480; y += 5) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(640, y);
        ctx.stroke();
      }

      // Defect 1: Puncture Hole
      const cx = 260, cy = 210, r = 32;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#060a12';
      ctx.fill();

      // Frayed white threads inside hole
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 18; i++) {
        const ang = Math.random() * Math.PI * 2;
        const len = r * (0.6 + Math.random() * 0.4);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
        ctx.stroke();
      }
      ctx.restore();

      // Defect 2: Small abrasion snag
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(420, 160);
      ctx.lineTo(470, 145);
      ctx.lineTo(440, 190);
      ctx.stroke();

      return canvas.toDataURL('image/jpeg', 0.9);
    }
  },
  {
    id: 'sample-cotton-stain',
    name: 'Raw Cotton - Machinery Oil Stain',
    fabricType: 'Organic Cotton Twill',
    defectCount: 1,
    previewColor: '#e9ecef',
    primaryDefect: 'Oil Stain',
    generateCanvasDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      // Cream Cotton Base
      ctx.fillStyle = '#e8dec8';
      ctx.fillRect(0, 0, 640, 480);

      // Fine linen weave texture
      ctx.strokeStyle = '#d7c7aa';
      ctx.lineWidth = 1;
      for (let x = 0; x < 640; x += 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 480);
        ctx.stroke();
      }
      for (let y = 0; y < 480; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(640, y);
        ctx.stroke();
      }

      // Defect: Irregular dark brown oil seepage
      ctx.save();
      ctx.fillStyle = 'rgba(74, 48, 26, 0.82)';
      ctx.beginPath();
      ctx.ellipse(330, 230, 65, 45, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // Spatter droplets
      ctx.fillStyle = 'rgba(64, 38, 16, 0.7)';
      ctx.beginPath();
      ctx.arc(390, 260, 14, 0, Math.PI * 2);
      ctx.arc(260, 210, 10, 0, Math.PI * 2);
      ctx.arc(350, 175, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      return canvas.toDataURL('image/jpeg', 0.9);
    }
  },
  {
    id: 'sample-silk-thread',
    name: 'Silk Crepe - Weave Skip & Loose Knot',
    fabricType: 'Mulberry Silk',
    defectCount: 2,
    previewColor: '#7209b7',
    primaryDefect: 'Weaving Flaw',
    generateCanvasDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      // Violet silk base
      ctx.fillStyle = '#4a154b';
      ctx.fillRect(0, 0, 640, 480);

      // Subtle sheen gradient
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // Weft Skip Line
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(120, 180);
      ctx.lineTo(480, 185);
      ctx.stroke();

      // Loose bunched thread loop
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.bezierCurveTo(240, 180, 250, 110, 290, 175);
      ctx.stroke();

      return canvas.toDataURL('image/jpeg', 0.9);
    }
  },
  {
    id: 'sample-clean-linen',
    name: 'Natural Flax - Grade A Flawless (Pass)',
    fabricType: 'Pure Linen Weave',
    defectCount: 0,
    previewColor: '#8d99ae',
    primaryDefect: 'None (Pass)',
    generateCanvasDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#9aa5b1';
      ctx.fillRect(0, 0, 640, 480);

      ctx.strokeStyle = '#8592a0';
      ctx.lineWidth = 1;
      for (let x = 0; x < 640; x += 5) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 480);
        ctx.stroke();
      }
      for (let y = 0; y < 480; y += 5) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(640, y);
        ctx.stroke();
      }

      return canvas.toDataURL('image/jpeg', 0.9);
    }
  }
];
