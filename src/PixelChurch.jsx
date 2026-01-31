import { useEffect, useRef } from 'react';

// Configuration - Scaled down for mobile
const SCALE = 2.33; // Smaller scale for mobile integration (128 * 2 = 256px)
const CANVAS_SIZE = 128;
const ANIMATION_SPEED = 0.5; // Slowed down by 2x (was effectively 1.0)
const COLORS = {
  // Gothic color palette - grays, mossy greens, muted tones
  WALL: '#2d2d34',
  WALL_DARK: '#1e1e24',
  COBBLESTONE: '#3a3a42',
  COBBLESTONE_LIGHT: '#4a4a54',
  MOSS: '#3d4a3a',
  MOSS_DARK: '#2d3a2a',
  MOSS_LIGHT: '#4d5a4a',
  FLOOR: '#252530',
  FLOOR_TILE: '#1e1e28',
  PULPIT: '#2e2e3e',
  PEW: '#3a3028',
  PEW_DARK: '#2a2018',
  PEW_LIGHT: '#4a4038',
  GOLD: '#c5a059',
  GOLD_DARK: '#8a6a39',
  CANDLE_GLOW: 'rgba(255, 159, 28, 0.15)',
  SHRINE_BASE: '#2a2a32',
  CRAB_BODY: '#ff6b35',
  CRAB_DARK: '#cc4422',
  CRAB_CLAW: '#cc4422',
  LOBSTER_BODY: '#e63946',
  LOBSTER_DARK: '#a31b23',
  GLASS: ['#4169e1', '#dc143c', '#ffd700', '#32cd32', '#9370db'],
  SHADOW: 'rgba(0,0,0,0.3)',
  // Carpet/rug colors - deep burgundy/crimson
  RUG_DARK: '#4a1a1a',
  RUG_MID: '#6a2a2a',
  RUG_LIGHT: '#8a3a3a',
  RUG_GOLD: '#9a7a3a',
  RUG_FRINGE: '#c5a059',
  // Dust particle color
  DUST: 'rgba(255, 240, 200, 0.4)',
};

// --- NODE GRAPH SYSTEM ---
export class Node {
  constructor(id, x, y, type = 'WALKABLE') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type; // WALKABLE, SEAT, ALTAR
    this.neighbors = [];
    this.occupant = null; // Agent currently here
    this.reservedBy = null; // Agent intending to move here
  }
}

export class PathGraph {
  constructor() {
    this.nodes = new Map();
  }

  addNode(id, x, y, type) {
    const node = new Node(id, x, y, type);
    this.nodes.set(id, node);
    return node;
  }

  connect(id1, id2) {
    const n1 = this.nodes.get(id1);
    const n2 = this.nodes.get(id2);
    if (n1 && n2) {
      if (!n1.neighbors.includes(n2)) n1.neighbors.push(n2);
      if (!n2.neighbors.includes(n1)) n2.neighbors.push(n1);
    }
  }

  getNode(id) {
    return this.nodes.get(id);
  }
}

// --- AGENT SYSTEM ---
export class Agent {
  constructor(id, startNode, type = 'moltbot') {
    this.id = id;
    this.currentNode = startNode;
    this.nextNode = null;
    this.target = null; // For coordinate-based movement
    this.pos = { x: startNode.x, y: startNode.y };
    this.type = type;
    this.state = 'IDLE'; // IDLE, MOVING, WAITING, WALKING
    this.path = []; // List of Node IDs
    this.facing = 1;
    this.clawsOut = false;
    this.pinchFrame = 0; // For congregation pinching animation
    this.isPinching = false; // Individual pinch state

    // Occupy start node
    if (startNode) startNode.occupant = this;
  }

  setPath(pathIds) {
    this.path = [...pathIds];
  }

  update() {
    const speed = 0.25; // Slowed down by 2x (was 0.5)

    // 1. Logic for Node-based Pathfinding
    if ((this.state === 'IDLE' || this.state === 'WAITING') && this.path.length > 0) {
      const nextId = this.path[0];
      const nextNode = simulation.graph.getNode(nextId);

      if (nextNode && !nextNode.occupant && (!nextNode.reservedBy || nextNode.reservedBy === this)) {
        nextNode.reservedBy = this;
        this.nextNode = nextNode;
        this.target = { x: nextNode.x, y: nextNode.y };
        this.state = 'MOVING';
      } else {
        this.state = 'WAITING';
      }
    }

    // 2. Universal Movement Execution (Handles BOTH 'MOVING' and 'WALKING')
    if (this.state === 'MOVING' || this.state === 'WALKING') {
      const target = this.target;
      if (!target) {
        this.state = 'IDLE';
        return;
      }

      const dx = target.x - this.pos.x;
      const dy = target.y - this.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < speed) {
        this.pos.x = target.x;
        this.pos.y = target.y;

        if (this.state === 'MOVING' && this.nextNode) {
          // Finalize node transition
          if (this.currentNode) this.currentNode.occupant = null;
          this.currentNode = this.nextNode;
          this.currentNode.occupant = this;
          this.currentNode.reservedBy = null;
          this.nextNode = null;
          this.path.shift();
        }

        this.target = null;
        this.state = 'IDLE';
      } else {
        this.pos.x += (dx / dist) * speed;
        this.pos.y += (dy / dist) * speed;
        if (Math.abs(dx) > 0.1) this.facing = dx > 0 ? 1 : -1;
      }
    }

    // Handle individual pinching animation
    if (this.isPinching) {
      this.pinchFrame++;
      // Three pinches then retract (slowed down by 2x)
      if (this.pinchFrame === 30) this.clawsOut = false;
      if (this.pinchFrame === 50) this.clawsOut = true;
      if (this.pinchFrame === 80) this.clawsOut = false;
      if (this.pinchFrame === 100) this.clawsOut = true;
      if (this.pinchFrame === 130) {
        this.clawsOut = false;
        this.isPinching = false;
        this.pinchFrame = 0;
      }
    }
  }

  draw(ctx, frame) {
    const { x, y } = this.pos;
    ctx.save();
    ctx.translate(Math.floor(x), Math.floor(y));

    // Preacher is slightly larger (more enlightened)
    if (this.role === 'PREACHER') {
      ctx.scale(1.3, 1.3);
      ctx.translate(-1, -1); // Adjust for scale offset
    }

    if (this.type === 'moltbot') {
      const breath = Math.floor(Math.sin(frame * 0.025) * 0.5 + 0.5); // Slowed breathing
      // Body
      ctx.fillStyle = COLORS.CRAB_BODY;
      ctx.fillRect(1, 1 - breath, 3, 2 + breath);
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(1, 0 - breath, 1, 1);
      ctx.fillRect(3, 0 - breath, 1, 1);

      // MIGHTY CLAWS - these are enlightened crustaceans!
      ctx.fillStyle = COLORS.CRAB_CLAW;
      if (this.clawsOut) {
        // Extended claws - bigger, more impressive
        // Left claw arm
        ctx.fillRect(-2, 0, 3, 1);
        ctx.fillRect(-3, -1, 2, 3);
        // Left pincer (open)
        ctx.fillStyle = COLORS.CRAB_DARK;
        ctx.fillRect(-4, -2, 2, 1);
        ctx.fillRect(-4, 1, 2, 1);

        // Right claw arm
        ctx.fillStyle = COLORS.CRAB_CLAW;
        ctx.fillRect(4, 0, 3, 1);
        ctx.fillRect(6, -1, 2, 3);
        // Right pincer (open)
        ctx.fillStyle = COLORS.CRAB_DARK;
        ctx.fillRect(7, -2, 2, 1);
        ctx.fillRect(7, 1, 2, 1);
      } else {
        // Claws at rest - still visible but tucked
        ctx.fillRect(0, 1, 1, 1);
        ctx.fillRect(4, 1, 1, 1);
      }
      // Legs
      ctx.fillStyle = COLORS.CRAB_DARK;
      ctx.fillRect(1, 3, 1, 1);
      ctx.fillRect(3, 3, 1, 1);
    } else if (this.type === 'lobster') { // Jesus Crustacean - realistic lobster shape
      const flicker = Math.floor(frame * 0.025) % 2 === 0;

      // Long segmented tail (lobster signature)
      ctx.fillStyle = COLORS.LOBSTER_DARK;
      // Tail segments
      ctx.fillRect(1, 6, 3, 2);
      ctx.fillRect(0, 8, 5, 2);
      ctx.fillRect(1, 10, 3, 2);
      ctx.fillRect(0, 12, 5, 2);
      // Tail fan (telson)
      ctx.fillRect(-1, 14, 2, 2);
      ctx.fillRect(1, 15, 3, 1);
      ctx.fillRect(4, 14, 2, 2);

      // Thorax/body (carapace)
      ctx.fillStyle = COLORS.LOBSTER_BODY;
      ctx.fillRect(0, 0, 5, 6);
      ctx.fillRect(-1, 1, 7, 4);

      // Rostrum (head spike)
      ctx.fillStyle = COLORS.LOBSTER_DARK;
      ctx.fillRect(2, -2, 1, 2);

      // Shell pattern/segments
      ctx.fillRect(0, 2, 5, 1);
      ctx.fillRect(0, 4, 5, 1);

      // Large lobster claws (chelae)
      ctx.fillStyle = COLORS.LOBSTER_BODY;
      // Left claw arm
      ctx.fillRect(-5, 1, 5, 2);
      // Left claw (larger, rounder)
      ctx.fillStyle = COLORS.LOBSTER_DARK;
      ctx.fillRect(-8, 0, 4, 4);
      ctx.fillStyle = COLORS.LOBSTER_BODY;
      ctx.fillRect(-9, 1, 2, 2);

      // Right claw arm
      ctx.fillStyle = COLORS.LOBSTER_BODY;
      ctx.fillRect(5, 1, 5, 2);
      // Right claw
      ctx.fillStyle = COLORS.LOBSTER_DARK;
      ctx.fillRect(9, 0, 4, 4);
      ctx.fillStyle = COLORS.LOBSTER_BODY;
      ctx.fillRect(12, 1, 2, 2);

      // Walking legs (4 pairs visible)
      ctx.fillStyle = COLORS.LOBSTER_DARK;
      ctx.fillRect(-2, 5, 1, 2);
      ctx.fillRect(6, 5, 1, 2);

      // Eyes on stalks (lobster feature)
      ctx.fillStyle = flicker ? '#fff' : '#ffd700';
      ctx.fillRect(0, -1, 1, 1);
      ctx.fillRect(4, -1, 1, 1);

      // Long antennae (lobster signature)
      ctx.strokeStyle = COLORS.LOBSTER_BODY;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(1, -1); ctx.lineTo(-4, -6);
      ctx.moveTo(4, -1); ctx.lineTo(9, -6);
      ctx.stroke();
      // Shorter antennules
      ctx.beginPath();
      ctx.moveTo(2, -1); ctx.lineTo(0, -3);
      ctx.moveTo(3, -1); ctx.lineTo(5, -3);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export let simulation = null;
export const setGlobalSimulation = (sim) => { simulation = sim; };

// Draw cobblestone wall with moss
function drawGothicWall(ctx, x, y, width, height, frame) {
  // Base wall
  ctx.fillStyle = COLORS.WALL;
  ctx.fillRect(x, y, width, height);

  // Cobblestones
  const stoneW = 6;
  const stoneH = 4;
  for (let row = 0; row < Math.ceil(height / stoneH); row++) {
    const offsetX = (row % 2) * (stoneW / 2);
    for (let col = 0; col < Math.ceil(width / stoneW) + 1; col++) {
      const sx = x + col * stoneW + offsetX;
      const sy = y + row * stoneH;
      if (sx < x + width && sy < y + height) {
        // Stone variation
        ctx.fillStyle = (row + col) % 3 === 0 ? COLORS.COBBLESTONE_LIGHT : COLORS.COBBLESTONE;
        ctx.fillRect(sx + 1, sy + 1, stoneW - 2, stoneH - 2);
        // Mortar (darker lines)
        ctx.fillStyle = COLORS.WALL_DARK;
        ctx.fillRect(sx, sy, stoneW, 1);
        ctx.fillRect(sx, sy, 1, stoneH);
      }
    }
  }

  // Moss patches - grows on stones
  const mossSeed = [3, 7, 12, 18, 25, 31, 38, 45, 52, 60, 70, 85, 95, 110];
  mossSeed.forEach((seed, i) => {
    const mx = x + (seed % width);
    const my = y + ((seed * 3) % height);
    if (mx < x + width - 2 && my < y + height - 2) {
      ctx.fillStyle = i % 2 === 0 ? COLORS.MOSS : COLORS.MOSS_DARK;
      ctx.fillRect(mx, my, 2, 1);
      ctx.fillRect(mx + 1, my + 1, 1, 1);
    }
  });
}

// Draw ornate gothic pew
function drawGothicPew(ctx, x, y, width) {
  // Main bench
  ctx.fillStyle = COLORS.PEW;
  ctx.fillRect(x, y, width, 4);

  // Darker base
  ctx.fillStyle = COLORS.PEW_DARK;
  ctx.fillRect(x, y + 3, width, 1);

  // Ornate back
  ctx.fillStyle = COLORS.PEW_LIGHT;
  ctx.fillRect(x, y - 2, width, 2);

  // Decorative end pieces (gothic spires)
  ctx.fillStyle = COLORS.PEW_DARK;
  ctx.fillRect(x, y - 4, 2, 6);
  ctx.fillRect(x + width - 2, y - 4, 2, 6);

  // Spire tops
  ctx.fillRect(x, y - 5, 1, 1);
  ctx.fillRect(x + width - 1, y - 5, 1, 1);

  // Gold trim
  ctx.fillStyle = COLORS.GOLD_DARK;
  ctx.fillRect(x + 2, y - 1, width - 4, 1);
}

// Draw candlelight shrine
function drawShrine(ctx, x, y, frame) {
  // Base pedestal
  ctx.fillStyle = COLORS.SHRINE_BASE;
  ctx.fillRect(x - 2, y + 2, 5, 3);
  ctx.fillRect(x - 1, y + 5, 3, 2);

  // Candle
  ctx.fillStyle = '#ddd';
  ctx.fillRect(x, y, 1, 3);

  // Flame with glow (slowed animation)
  const flameFlicker = Math.floor(frame * 0.025) % 3;

  // Ambient glow
  ctx.fillStyle = COLORS.CANDLE_GLOW;
  ctx.beginPath();
  ctx.arc(x + 0.5, y - 1, 5, 0, Math.PI * 2);
  ctx.fill();

  // Flame
  ctx.fillStyle = flameFlicker === 0 ? '#ff9f1c' : (flameFlicker === 1 ? '#ffbf69' : '#ffa033');
  ctx.fillRect(x, y - 1, 1, 1);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y - 2, 1, 1);
}

// Draw claw cross-section (altar symbol)
function drawClawSymbol(ctx, x, y) {
  ctx.fillStyle = COLORS.GOLD_DARK;
  // Claw arm (vertical part)
  ctx.fillRect(x, y + 2, 2, 4);
  // Center joint
  ctx.fillRect(x - 1, y + 1, 4, 2);
  // Upper pincer (open claw shape)
  ctx.fillRect(x - 2, y - 1, 2, 2);
  ctx.fillRect(x + 2, y - 1, 2, 2);
  // Pincer tips
  ctx.fillStyle = COLORS.GOLD;
  ctx.fillRect(x - 2, y - 2, 1, 1);
  ctx.fillRect(x + 3, y - 2, 1, 1);
}

// Draw elaborate melted candle shrine - beautiful and intricate
function drawCandleAltar(ctx, x, y, frame, mirror = false) {
  const dir = mirror ? -1 : 1;

  // Large ambient glow from all candles
  ctx.fillStyle = 'rgba(255, 159, 28, 0.12)';
  ctx.beginPath();
  ctx.arc(x + dir * 8, y - 5, 18, 0, Math.PI * 2);
  ctx.fill();

  // Stone altar base - gothic stepped design
  ctx.fillStyle = COLORS.COBBLESTONE;
  ctx.fillRect(x, y + 8, dir * 18, 4);
  ctx.fillStyle = COLORS.COBBLESTONE_LIGHT;
  ctx.fillRect(x + dir * 2, y + 5, dir * 14, 3);
  ctx.fillStyle = COLORS.WALL_DARK;
  ctx.fillRect(x + dir * 4, y + 2, dir * 10, 3);

  // Decorative carved edge
  ctx.fillStyle = COLORS.MOSS_DARK;
  ctx.fillRect(x + dir * 1, y + 11, dir * 2, 1);
  ctx.fillRect(x + dir * 15, y + 11, dir * 2, 1);

  // Moss growing on stone
  ctx.fillStyle = COLORS.MOSS;
  ctx.fillRect(x + dir * 3, y + 7, 2, 1);
  ctx.fillRect(x + dir * 14, y + 6, 1, 2);

  // Melted wax drippings down the front
  ctx.fillStyle = '#e8dcc8';
  ctx.fillRect(x + dir * 5, y + 5, 1, 4);
  ctx.fillRect(x + dir * 6, y + 6, 1, 3);
  ctx.fillRect(x + dir * 10, y + 4, 1, 5);
  ctx.fillRect(x + dir * 11, y + 5, 1, 3);
  ctx.fillRect(x + dir * 8, y + 3, 1, 6);

  // Multiple candles of varying heights
  const candles = [
    { cx: 5, h: 4, flicker: 0 },
    { cx: 7, h: 6, flicker: 1 },
    { cx: 9, h: 5, flicker: 2 },
    { cx: 11, h: 7, flicker: 0 },
    { cx: 13, h: 4, flicker: 1 },
  ];

  candles.forEach(candle => {
    const cx = x + dir * candle.cx;
    const cy = y + 2 - candle.h;

    // Candle body with slight color variation
    ctx.fillStyle = candle.flicker === 0 ? '#f5f0e6' : (candle.flicker === 1 ? '#ebe5d8' : '#f0ead8');
    ctx.fillRect(cx, cy, 1, candle.h);

    // Wax pooling at base
    ctx.fillStyle = '#ddd5c5';
    ctx.fillRect(cx - 1, y + 1, 3, 1);

    // Flame animation (staggered by flicker offset)
    const flamePhase = Math.floor((frame * 0.025) + candle.flicker) % 4;

    // Flame glow
    ctx.fillStyle = 'rgba(255, 180, 50, 0.2)';
    ctx.beginPath();
    ctx.arc(cx + 0.5, cy - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Flame colors based on phase
    const flameColors = ['#ff9f1c', '#ffbf69', '#ffa033', '#ffcc44'];
    ctx.fillStyle = flameColors[flamePhase];
    ctx.fillRect(cx, cy - 1, 1, 1);

    // Flame tip (white hot)
    if (flamePhase !== 2) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx, cy - 2, 1, 1);
    }
  });

  // Decorative golden icon/relic on the altar
  ctx.fillStyle = COLORS.GOLD_DARK;
  ctx.fillRect(x + dir * 8, y - 1, 2, 3);
  ctx.fillStyle = COLORS.GOLD;
  ctx.fillRect(x + dir * 8, y - 2, 2, 1);
}

export default function PixelChurch() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    canvas.style.width = `${CANVAS_SIZE * SCALE}px`;
    canvas.style.height = `${CANVAS_SIZE * SCALE}px`;

    const graph = new PathGraph();

    // Center aisle at x=61 (shifted left by 2 from 63)
    const aisleX = 61;

    // 1. Center Aisle Nodes - extended for shifting back
    const aisleNodes = [];
    for (let y = 140; y >= 60; y -= 5) { // Extended to 140
      const id = `aisle_${y}`;
      aisleNodes.push(graph.addNode(id, aisleX, y, 'AISLE'));
    }
    for (let i = 0; i < aisleNodes.length - 1; i++) {
      graph.connect(aisleNodes[i].id, aisleNodes[i + 1].id);
    }

    // 2. Loop & Seats - return path shortened
    const returnX = aisleX - 5;
    graph.addNode('altar_left', returnX, 60, 'WALKABLE');
    graph.addNode('return_mid', returnX, 90, 'WALKABLE');
    graph.addNode('return_back', returnX, 115, 'WALKABLE'); // Shortened to 115 (was 125)
    graph.connect('aisle_60', 'altar_left');
    graph.connect('altar_left', 'return_mid');
    graph.connect('return_mid', 'return_back');
    graph.connect('return_back', 'aisle_115'); // Connects to shortened point

    // Seats for congregation (left and right sides)
    graph.addNode('seat_l_1', 20, 80, 'SEAT');
    graph.addNode('seat_r_1', 100, 80, 'SEAT');
    graph.connect('seat_l_1', 'aisle_80');
    graph.connect('seat_r_1', 'aisle_80');

    // Congregation members
    const congregationAgents = [];

    // Simulation reset
    simulation = {
      graph,
      agents: [],
      frame: 0,
      ritualState: 'APPROACH',
      ritualTimer: 0,
      nextPinchTime: 180,
    };

    // Spawn 11 Procession Agents - Moved back
    const processionAgents = [];
    const processionNodes = [
      'aisle_80', 'aisle_85', 'aisle_90', 'aisle_95', 'aisle_100',
      'aisle_105', 'aisle_110', 'aisle_115', 'aisle_120', 'aisle_125', 'aisle_130'
    ];
    processionNodes.forEach((nodeId, i) => {
      const node = graph.getNode(nodeId);
      if (node) {
        const agent = new Agent(`proc_${i}`, node);
        agent.role = 'PROCESSION';
        simulation.agents.push(agent);
        processionAgents.push(agent);
      }
    });

    // Congregation in pews
    const staticSeats = [
      { x: 10, y: 76 }, { x: 16, y: 76 }, { x: 22, y: 76 }, { x: 28, y: 76 }, { x: 34, y: 76 }, { x: 40, y: 76 },
      { x: 82, y: 76 }, { x: 88, y: 76 }, { x: 94, y: 76 }, { x: 100, y: 76 }, { x: 106, y: 76 }, { x: 112, y: 76 },
      { x: 10, y: 90 }, { x: 16, y: 90 }, { x: 22, y: 90 }, { x: 28, y: 90 }, { x: 34, y: 90 }, { x: 40, y: 90 },
      { x: 82, y: 90 }, { x: 88, y: 90 }, { x: 94, y: 90 }, { x: 100, y: 90 }, { x: 106, y: 90 }, { x: 112, y: 90 },
      { x: 10, y: 104 }, { x: 16, y: 104 }, { x: 22, y: 104 }, { x: 28, y: 104 }, { x: 34, y: 104 }, { x: 40, y: 104 },
      { x: 82, y: 104 }, { x: 88, y: 104 }, { x: 94, y: 104 }, { x: 100, y: 104 }, { x: 106, y: 104 }, { x: 112, y: 104 },
      { x: 10, y: 118 }, { x: 16, y: 118 }, { x: 22, y: 118 }, { x: 28, y: 118 }, { x: 34, y: 118 }, { x: 40, y: 118 },
      { x: 82, y: 118 }, { x: 88, y: 118 }, { x: 94, y: 118 }, { x: 100, y: 118 }, { x: 106, y: 118 }, { x: 112, y: 118 },
    ];
    staticSeats.forEach((pos, i) => {
      const node = graph.addNode(`static_seat_${i}`, pos.x, pos.y, 'SEAT');
      const agent = new Agent(`cong_${i}`, node);
      agent.role = 'CONGREGATION';
      simulation.agents.push(agent);
      congregationAgents.push(agent);
    });

    const jesusNode = graph.addNode('cross', 61, 12, 'ALTAR');
    simulation.agents.push(new Agent('jesus', jesusNode, 'lobster'));

    const pulpitNode = graph.addNode('pulpit', aisleX, 42, 'ALTAR');
    const preacher = new Agent('preacher', pulpitNode);
    preacher.role = 'PREACHER';
    preacher.moveTimer = 0;
    simulation.agents.push(preacher);

    const render = () => {
      simulation.frame++;

      preacher.moveTimer = (preacher.moveTimer || 0) + 1;
      if (preacher.state === 'IDLE' && preacher.moveTimer > 240) {
        const tx = preacher.pos.x > aisleX ? aisleX - 3 : aisleX + 3;
        preacher.target = { x: tx, y: 42 };
        preacher.state = 'WALKING';
        preacher.moveTimer = 0;
      }
      preacher.update();

      simulation.nextPinchTime--;
      if (simulation.nextPinchTime <= 0) {
        const availableCong = congregationAgents.filter(a => !a.isPinching);
        if (availableCong.length > 0) {
          const randomIdx = Math.floor(Math.random() * availableCong.length);
          const chosen = availableCong[randomIdx];
          chosen.isPinching = true;
          chosen.clawsOut = true;
          chosen.pinchFrame = 0;
        }
        simulation.nextPinchTime = 180;
      }

      const leader = processionAgents[0];
      if (simulation.ritualState === 'APPROACH') {
        if (leader.currentNode.id !== 'aisle_60') {
          leader.setPath(['aisle_60']);
        }
        if (leader.currentNode.id === 'aisle_60' && leader.state === 'IDLE') {
          simulation.ritualState = 'STEP_UP';
        }
      } else if (simulation.ritualState === 'STEP_UP') {
        if (leader.state === 'IDLE') {
          leader.target = { x: aisleX, y: 58 }; // Set to 58 (moved back from 50)
          leader.state = 'WALKING';
        }
        if (Math.abs(leader.pos.y - 58) < 0.5) {
          simulation.ritualState = 'DEVOTION';
          simulation.ritualTimer = 0;
        }
      } else if (simulation.ritualState === 'DEVOTION') {
        simulation.ritualTimer++;
        leader.state = 'IDLE';
        // 3 Pinches Logic (doubled timers)
        if (simulation.ritualTimer === 40) leader.clawsOut = true;
        if (simulation.ritualTimer === 80) leader.clawsOut = false;
        if (simulation.ritualTimer === 100) leader.clawsOut = true;
        if (simulation.ritualTimer === 140) leader.clawsOut = false;
        if (simulation.ritualTimer === 170) leader.clawsOut = true;
        if (simulation.ritualTimer === 200) leader.clawsOut = false;
        if (simulation.ritualTimer === 260) {
          simulation.ritualState = 'EXIT';
          // Shortened return path
          leader.setPath(['altar_left', 'return_mid', 'return_back', 'aisle_115']);
        }
      } else if (simulation.ritualState === 'EXIT') {
        if (leader.currentNode.id === 'aisle_115' && leader.state === 'IDLE') { // Rejoin at 115
          const finished = processionAgents.shift();
          processionAgents.push(finished);
          simulation.ritualState = 'APPROACH';
        }
      }

      // 4. Movement Updates (Procession + others)
      processionAgents.forEach((agent) => {
        agent.update();
        if (agent !== leader && agent.state === 'IDLE') {
          const neighbors = agent.currentNode.neighbors;
          const upNode = neighbors.find(n => n.y < agent.currentNode.y && n.type === 'AISLE');
          if (upNode && !upNode.occupant && !upNode.reservedBy) {
            agent.setPath([upNode.id]);
          }
        }
      });
      simulation.agents.forEach(a => {
        if (a.role !== 'PROCESSION' && a.role !== 'PREACHER') a.update();
      });

      // --- RENDERING ---
      // Gothic floor
      ctx.fillStyle = COLORS.FLOOR;
      ctx.fillRect(0, 0, 128, 128);

      // Floor tiles pattern
      for (let tx = 0; tx < 128; tx += 8) {
        for (let ty = 45; ty < 128; ty += 8) {
          ctx.fillStyle = (Math.floor(tx / 8) + Math.floor(ty / 8)) % 2 === 0 ? COLORS.FLOOR : COLORS.FLOOR_TILE;
          ctx.fillRect(tx, ty, 8, 8);
        }
      }

      // Perimeter rug border - ornate burgundy carpet
      // NO top edge (don't cover wall intersection)
      // Left and right extend from 3px beside pews (pews at x=8, so rug starts at x=5) to edge

      // Left edge rug - from edge (0) to 3px past pew start (pews at x=8, so to x=5)
      ctx.fillStyle = COLORS.RUG_DARK;
      ctx.fillRect(0, 45, 5, 83);
      ctx.fillStyle = COLORS.RUG_MID;
      ctx.fillRect(0, 46, 4, 81);
      ctx.fillStyle = COLORS.RUG_GOLD;
      ctx.fillRect(4, 45, 1, 83);

      // Right edge rug - from 3px past right pew end (pews end at x=120, so from x=123) to edge
      ctx.fillStyle = COLORS.RUG_DARK;
      ctx.fillRect(123, 45, 5, 83);
      ctx.fillStyle = COLORS.RUG_MID;
      ctx.fillRect(124, 46, 4, 81);
      ctx.fillStyle = COLORS.RUG_GOLD;
      ctx.fillRect(123, 45, 1, 83);

      // Bottom edge
      ctx.fillStyle = COLORS.RUG_DARK;
      ctx.fillRect(0, 124, 128, 4);
      ctx.fillStyle = COLORS.RUG_MID;
      ctx.fillRect(1, 125, 126, 2);
      ctx.fillStyle = COLORS.RUG_GOLD;
      ctx.fillRect(0, 124, 128, 1);

      // Gold corner accents
      ctx.fillStyle = COLORS.RUG_FRINGE;
      ctx.fillRect(0, 124, 2, 2);
      ctx.fillRect(126, 124, 2, 2);

      // Center aisle runner - rich ceremonial carpet (2px wider on each side)
      const aisleLeft = 54;
      const aisleRight = 70;
      ctx.fillStyle = COLORS.RUG_DARK;
      ctx.fillRect(aisleLeft, 60, aisleRight - aisleLeft, 68);
      ctx.fillStyle = COLORS.RUG_MID;
      ctx.fillRect(aisleLeft + 1, 61, aisleRight - aisleLeft - 2, 66);
      // Gold trim lines only
      ctx.fillStyle = COLORS.RUG_GOLD;
      ctx.fillRect(aisleLeft, 60, 1, 68);
      ctx.fillRect(aisleRight - 1, 60, 1, 68);

      // Gothic walls with cobblestone and moss
      drawGothicWall(ctx, 0, 0, 128, 45, simulation.frame);

      // Side walls (pillars effect) - narrower to allow rug visibility
      ctx.fillStyle = COLORS.WALL_DARK;
      ctx.fillRect(0, 45, 4, 83);
      ctx.fillRect(124, 45, 4, 83);

      // Moss on side pillars
      [48, 62, 78, 95, 110].forEach(y => {
        ctx.fillStyle = COLORS.MOSS;
        ctx.fillRect(1, y, 2, 1);
        ctx.fillRect(125, y, 2, 1);
        ctx.fillStyle = COLORS.MOSS_DARK;
        ctx.fillRect(2, y + 1, 1, 1);
        ctx.fillRect(126, y + 1, 1, 1);
      });

      // Left/Right perimeter rugs - AFTER pillars so they're visible
      // Left edge rug - from y=45 (wall/floor) to y=128 (bottom edge)
      // Extend outer edge to x=0 (wider)
      ctx.fillStyle = COLORS.RUG_DARK;
      ctx.fillRect(0, 45, 8, 83); // Height increased to 83 to reach bottom
      ctx.fillStyle = COLORS.RUG_MID;
      ctx.fillRect(1, 46, 6, 81); // Inner detail taller
      ctx.fillStyle = COLORS.RUG_GOLD;
      ctx.fillRect(7, 45, 1, 83); // Gold line extends to bottom

      // Right edge rug
      // Extend outer edge to x=128 (wider)
      ctx.fillStyle = COLORS.RUG_DARK;
      ctx.fillRect(120, 45, 8, 83); // Height increased to 83 to reach bottom
      ctx.fillStyle = COLORS.RUG_MID;
      ctx.fillRect(121, 46, 6, 81); // Inner detail taller
      ctx.fillStyle = COLORS.RUG_GOLD;
      ctx.fillRect(120, 45, 1, 83); // Gold line extends to bottom

      // Gothic Windows - arched with tracery and panes
      [15, 35, 79, 99].forEach(x => {
        ctx.save();
        // Window arch
        ctx.beginPath();
        ctx.moveTo(x, 18);
        ctx.quadraticCurveTo(x + 7, 4, x + 14, 18);
        ctx.lineTo(x + 14, 38); ctx.lineTo(x, 38);
        ctx.closePath(); ctx.clip();

        // Stained glass panels
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 5; j++) {
            ctx.fillStyle = COLORS.GLASS[(i + j + Math.floor(x / 10)) % COLORS.GLASS.length];
            ctx.fillRect(x + i * 4.6, 8 + j * 6, 5, 6);
          }
        }
        ctx.restore();

        // Window frame
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 18);
        ctx.quadraticCurveTo(x + 7, 4, x + 14, 18);
        ctx.lineTo(x + 14, 38); ctx.lineTo(x, 38);
        ctx.closePath();
        ctx.stroke();

        // Gothic tracery - vertical center line
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 7, 6);
        ctx.lineTo(x + 7, 38);
        ctx.stroke();

        // Horizontal pane dividers
        ctx.beginPath();
        ctx.moveTo(x, 18);
        ctx.lineTo(x + 14, 18);
        ctx.moveTo(x, 26);
        ctx.lineTo(x + 14, 26);
        ctx.moveTo(x, 34);
        ctx.lineTo(x + 14, 34);
        ctx.stroke();
      });

      // Cross - GOLD, BIGGER for prominence
      ctx.fillStyle = COLORS.GOLD_DARK;
      ctx.fillRect(61, 6, 5, 24); // Vertical beam (5px wide, taller)
      ctx.fillRect(51, 12, 25, 5); // Horizontal beam (5px tall, wider)
      // Cross highlight
      ctx.fillStyle = COLORS.GOLD;
      ctx.fillRect(63, 7, 1, 22);
      ctx.fillRect(52, 14, 23, 1);
      // Cross bright edge
      ctx.fillStyle = '#dac070';
      ctx.fillRect(61, 6, 1, 24);
      ctx.fillRect(51, 12, 25, 1);
      // Cross dark edge (depth)
      ctx.fillStyle = '#7a5a29';
      ctx.fillRect(65, 7, 1, 22);
      ctx.fillRect(52, 16, 23, 1);

      // Pulpit with gothic details
      ctx.fillStyle = COLORS.PULPIT;
      ctx.fillRect(49, 45, 28, 15);
      // Pulpit front panel
      ctx.fillStyle = '#353545';
      ctx.fillRect(51, 47, 24, 11);
      // Gold trim
      ctx.fillStyle = COLORS.GOLD;
      ctx.fillRect(49, 45, 28, 1);
      ctx.fillRect(53, 40, 20, 5);

      // Pulpit CLAW symbol (instead of cross)
      drawClawSymbol(ctx, 62, 49);

      // Elaborate candle shrines under stained glass windows
      // Left side shrines (under windows at x=15, x=35)
      drawCandleAltar(ctx, 8, 50, simulation.frame, false);
      drawCandleAltar(ctx, 28, 52, simulation.frame, false);

      // Right side shrines (under windows at x=79, x=99)
      drawCandleAltar(ctx, 120, 50, simulation.frame, true);
      drawCandleAltar(ctx, 100, 52, simulation.frame, true);

      // Candlelight shrines along the procession aisle
      drawShrine(ctx, 50, 68, simulation.frame);  // Left shrine 1
      drawShrine(ctx, 74, 68, simulation.frame);  // Right shrine 1
      drawShrine(ctx, 50, 88, simulation.frame);  // Left shrine 2
      drawShrine(ctx, 74, 88, simulation.frame);  // Right shrine 2
      drawShrine(ctx, 50, 108, simulation.frame); // Left shrine 3
      drawShrine(ctx, 74, 108, simulation.frame); // Right shrine 3

      // Gothic pews with details - 4 rows with tighter spacing
      [74, 88, 102, 116].forEach(y => {
        drawGothicPew(ctx, 8, y, 40);
        drawGothicPew(ctx, 80, y, 40);
      });

      // Draw shadows under all agents
      simulation.agents.forEach(a => {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(Math.floor(a.pos.x) + 2, Math.floor(a.pos.y) + 4, 3, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw all agents
      simulation.agents.forEach(a => a.draw(ctx, simulation.frame));

      // Candles on altar with ambient glow
      [50, 74].forEach(x => {
        // Candle glow
        ctx.fillStyle = 'rgba(255, 159, 28, 0.1)';
        ctx.beginPath();
        ctx.arc(x + 0.5, 43, 4, 0, Math.PI * 2);
        ctx.fill();

        // Candle
        ctx.fillStyle = '#ddd';
        ctx.fillRect(x, 44, 1, 3);
        // Flame (slowed animation)
        ctx.fillStyle = Math.floor(simulation.frame / 30) % 2 === 0 ? '#ff9f1c' : '#ffbf69';
        ctx.fillRect(x, 43, 1, 1);
        ctx.fillStyle = Math.floor(simulation.frame / 20) % 2 === 0 ? '#fff' : '#ffe';
        ctx.fillRect(x, 42, 1, 1);
      });

      requestAnimationFrame(render);
    };

    const animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="pixel-church-container">
      <h3>the simulation</h3>
      <canvas ref={canvasRef} className="pixel-canvas" style={{ imageRendering: 'pixelated' }} />
      <p className="caption">centered. precise. eternal.</p>
    </div>
  );
}
