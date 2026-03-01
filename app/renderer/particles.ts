export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity: number;
}

export const MAX_PARTICLES = 200;

export function spawnParticles(
  particles: Particle[],
  type: string,
  x: number,
  y: number
): void {
  switch (type) {
    case 'dust': {
      for (let i = 0; i < 4; i++) {
        if (particles.length >= MAX_PARTICLES) break;
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.3,
          life: 15,
          maxLife: 15,
          color: '#888888',
          size: 2,
          gravity: 0,
        });
      }
      break;
    }

    case 'sparks': {
      const sparkColors = ['#FFD700', '#FFA500', '#FFCC33', '#FF8C00'];
      for (let i = 0; i < 10; i++) {
        if (particles.length >= MAX_PARTICLES) break;
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 20,
          maxLife: 20,
          color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
          size: 2,
          gravity: 0.1,
        });
      }
      break;
    }

    case 'deathPoof': {
      for (let i = 0; i < 18; i++) {
        if (particles.length >= MAX_PARTICLES) break;
        const angle = (Math.PI * 2 * i) / 18;
        const speed = 1.5 + Math.random() * 2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 30,
          maxLife: 30,
          color: '#F5F5DC',
          size: 3,
          gravity: 0,
        });
      }
      break;
    }

    case 'shimmer': {
      if (particles.length >= MAX_PARTICLES) break;
      const shimmerColors = ['#FFD700', '#FFFFFF'];
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.3 - Math.random() * 0.2,
        life: 40,
        maxLife: 40,
        color: shimmerColors[Math.floor(Math.random() * shimmerColors.length)],
        size: 2,
        gravity: 0,
      });
      break;
    }

    case 'blood': {
      const redShades = ['#8B0000', '#B22222', '#DC143C', '#CC0000', '#990000'];
      for (let i = 0; i < 6; i++) {
        if (particles.length >= MAX_PARTICLES) break;
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 25,
          maxLife: 25,
          color: redShades[Math.floor(Math.random() * redShades.length)],
          size: 2,
          gravity: 0.15,
        });
      }
      break;
    }

    case 'portalSwirl': {
      const cyanColors = ['#00FFFF', '#00CED1', '#40E0D0'];
      for (let i = 0; i < 3; i++) {
        if (particles.length >= MAX_PARTICLES) break;
        const angle = (Math.PI * 2 * i) / 3 + Math.random() * 0.5;
        const radius = 1.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * radius,
          vy: Math.sin(angle) * radius,
          life: 35,
          maxLife: 35,
          color: cyanColors[i],
          size: 3,
          gravity: 0,
        });
      }
      break;
    }

    case 'fireHit': {
      const fireColors = ['#FF4500', '#FF6347', '#FF8C00', '#DC143C'];
      for (let i = 0; i < 8; i++) {
        if (particles.length >= MAX_PARTICLES) break;
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 3,
          vy: -1 - Math.random() * 3,
          life: 20,
          maxLife: 20,
          color: fireColors[Math.floor(Math.random() * fireColors.length)],
          size: 3,
          gravity: 0,
        });
      }
      break;
    }
  }
}

export function updateParticles(particles: Particle[], dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.gravity * dt;
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
): void {
  for (const p of particles) {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}
