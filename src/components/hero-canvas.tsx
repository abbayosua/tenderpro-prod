'use client';

import { useEffect, useRef } from 'react';

// Configuration
const CONFIG = {
  friction: 0.5,
  trails: 50,
  size: 50,
  dampening: 0.025,
  tension: 0.99,
};

// Node class for the wave points
class Node {
  x: number = 0;
  y: number = 0;
  vy: number = 0;
  vx: number = 0;
}

// Oscillator for color cycling
class Oscillator {
  phase: number;
  offset: number;
  frequency: number;
  amplitude: number;
  value: number;

  constructor(options: { phase?: number; offset?: number; frequency?: number; amplitude?: number }) {
    this.phase = options.phase || 0;
    this.offset = options.offset || 0;
    this.frequency = options.frequency || 0.001;
    this.amplitude = options.amplitude || 1;
    this.value = this.offset;
  }

  update(): number {
    this.phase += this.frequency;
    this.value = this.offset + Math.sin(this.phase) * this.amplitude;
    return this.value;
  }
}

// Line class for each wave trail
class Line {
  spring: number;
  friction: number;
  nodes: Node[];

  constructor(options: { spring: number }) {
    this.spring = options.spring + 0.1 * Math.random() - 0.05;
    this.friction = CONFIG.friction + 0.01 * Math.random() - 0.005;
    this.nodes = [];
    
    for (let i = 0; i < CONFIG.size; i++) {
      const node = new Node();
      node.x = 0;
      node.y = 0;
      this.nodes.push(node);
    }
  }

  update(pos: { x: number; y: number }): void {
    let spring = this.spring;
    const first = this.nodes[0];
    
    first.vx += (pos.x - first.x) * spring;
    first.vy += (pos.y - first.y) * spring;

    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      
      if (i > 0) {
        const prev = this.nodes[i - 1];
        node.vx += (prev.x - node.x) * spring;
        node.vy += (prev.y - node.y) * spring;
        node.vx += prev.vx * CONFIG.dampening;
        node.vy += prev.vy * CONFIG.dampening;
      }

      node.vx *= this.friction;
      node.vy *= this.friction;
      node.x += node.vx;
      node.y += node.vy;

      spring *= CONFIG.tension;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    let cx: number, cy: number;
    const first = this.nodes[0];
    let nx = first.x;
    let ny = first.y;

    ctx.beginPath();
    ctx.moveTo(nx, ny);

    for (let i = 1; i < this.nodes.length - 2; i++) {
      const node = this.nodes[i];
      const next = this.nodes[i + 1];
      cx = 0.5 * (node.x + next.x);
      cy = 0.5 * (node.y + next.y);
      ctx.quadraticCurveTo(node.x, node.y, cx, cy);
    }

    const last = this.nodes[this.nodes.length - 2];
    const final = this.nodes[this.nodes.length - 1];
    ctx.quadraticCurveTo(last.x, last.y, final.x, final.y);
    ctx.stroke();
    ctx.closePath();
  }
}

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const linesRef = useRef<Line[]>([]);
  const posRef = useRef({ x: 0, y: 0 });
  const oscillatorRef = useRef<Oscillator | null>(null);
  const runningRef = useRef(true);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctxRef.current = ctx;
    runningRef.current = true;
    frameRef.current = 0;

    // Initialize oscillator for subtle color variation
    oscillatorRef.current = new Oscillator({
      phase: Math.random() * 2 * Math.PI,
      amplitude: 30,
      frequency: 0.001,
      offset: 220, // Blue hue center
    });

    // Initialize position to center
    posRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    // Initialize lines
    linesRef.current = [];
    for (let i = 0; i < CONFIG.trails; i++) {
      linesRef.current.push(new Line({ spring: 0.4 + (i / CONFIG.trails) * 0.025 }));
    }

    // Resize canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Render function
    function render() {
      const ctx = ctxRef.current;
      if (!ctx || !runningRef.current) return;

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      // Use the primary blue color
      const hue = oscillatorRef.current?.update() || 220;
      ctx.strokeStyle = `hsla(${hue}, 70%, 50%, 0.05)`;
      ctx.lineWidth = 6;

      for (const line of linesRef.current) {
        line.update(posRef.current);
        line.draw(ctx);
      }

      frameRef.current++;
      requestAnimationFrame(render);
    }

    // Mouse/Touch handlers
    function handleMouseMove(e: MouseEvent | TouchEvent) {
      const touch = 'touches' in e ? e.touches[0] : e;
      if (touch) {
        posRef.current.x = touch.pageX;
        posRef.current.y = touch.pageY;
      }
      e.preventDefault();
    }

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length === 1) {
        posRef.current.x = e.touches[0].pageX;
        posRef.current.y = e.touches[0].pageY;
      }
    }

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    // Event listeners
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('touchstart', handleTouchStart);

    // Start animation
    render();

    return () => {
      runningRef.current = false;
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="hero-canvas"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.8 }}
    />
  );
}
