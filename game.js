// --- Web Audio Synthesizer (Retro 8-Bit sound effects) ---
class RetroAudio {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playJump() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playCoin() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
    osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.08); // E6
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playStomp() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playHit() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playGameOver() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const playTone = (freq, duration, delay) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + delay);
      
      gain.gain.setValueAtTime(0.12, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + delay);
      osc.stop(now + delay + duration);
    };

    playTone(400, 0.15, 0);
    playTone(360, 0.15, 0.15);
    playTone(320, 0.15, 0.30);
    playTone(240, 0.50, 0.45);
  }
}

const sfx = new RetroAudio();

// --- Game Engine Variables ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const overlayScreen = document.getElementById('overlay-screen');
const overlayTitle = document.getElementById('overlay-title');
const overlayInstructions = document.getElementById('overlay-instructions');
const startBtn = document.getElementById('start-btn');

const scoreDisplay = document.getElementById('score-display');
const coinsDisplay = document.getElementById('coins-display');
const livesDisplay = document.getElementById('lives-display');

// Key States
const keys = {};

// Mobile virtual button events
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnJump = document.getElementById('btn-jump');

let mobileLeft = false;
let mobileRight = false;

// Game State
let gameState = 'START'; // START, RUNNING, GAMEOVER, VICTORY
let score = 0;
let coins = 0;
let lives = 3;
let invulnerableFrames = 0;

// Physics Config
const GRAVITY = 0.5;
const FRICTION = 0.85;

// Entities
let player;
let platforms = [];
let codeBlocks = [];
let enemies = [];
let particles = [];
let floatingTexts = [];

// Camera
let cameraX = 0;
const LEVEL_WIDTH = 3000;

// --- Entity Blueprints ---

class Player {
  constructor() {
    this.width = 24;
    this.height = 32;
    this.x = 80;
    this.y = 200;
    this.vx = 0;
    this.vy = 0;
    this.isJumping = false;
    this.facing = 'right';
    this.runFrame = 0;
  }

  update() {
    // Movement Logic
    let dir = 0;
    if (keys['ArrowRight'] || keys['KeyD'] || mobileRight) {
      dir = 1;
      this.facing = 'right';
    } else if (keys['ArrowLeft'] || keys['KeyA'] || mobileLeft) {
      dir = -1;
      this.facing = 'left';
    }

    // Acceleration
    if (dir !== 0) {
      this.vx += dir * 0.8;
      this.runFrame += 0.25;
    } else {
      this.vx *= FRICTION;
      this.runFrame = 0;
    }

    // Velocity Clamping
    const maxSpeed = 4.5;
    if (this.vx > maxSpeed) this.vx = maxSpeed;
    if (this.vx < -maxSpeed) this.vx = -maxSpeed;

    // Apply Gravity
    this.vy += GRAVITY;

    // Position updates
    this.x += this.vx;
    this.y += this.vy;

    // Boundary constraints
    if (this.x < 0) {
      this.x = 0;
      this.vx = 0;
    }
    if (this.x > LEVEL_WIDTH - this.width) {
      this.x = LEVEL_WIDTH - this.width;
      this.vx = 0;
      // Trigger victory if at the very end
      if (gameState === 'RUNNING') {
        winGame();
      }
    }

    // Floor Fall-off Check
    if (this.y > canvas.height + 50) {
      this.takeDamage(true);
    }
  }

  jump() {
    if (!this.isJumping) {
      this.vy = -10.5;
      this.isJumping = true;
      sfx.playJump();
      // Spawn tiny jump smoke
      for (let i = 0; i < 5; i++) {
        particles.push(new Particle(this.x + this.width / 2, this.y + this.height, '#999', -2 + Math.random() * 4, -1 - Math.random() * 2));
      }
    }
  }

  takeDamage(instantFall = false) {
    if (invulnerableFrames > 0 && !instantFall) return;
    
    lives--;
    sfx.playHit();
    invulnerableFrames = 60; // 1 second of blinking

    if (lives <= 0) {
      gameOver();
    } else {
      // Respawn or reset position slightly back
      this.vx = 0;
      this.vy = 0;
      this.x = Math.max(80, this.x - 150);
      this.y = 100;
    }
    updateHUD();
  }

  draw() {
    if (invulnerableFrames > 0 && Math.floor(invulnerableFrames / 5) % 2 === 0) {
      return; // Blinking invulnerability
    }

    ctx.save();
    ctx.translate(this.x - cameraX, this.y);

    // Draw stylized cute retro developer pixel character
    // Cap/Hair
    ctx.fillStyle = '#00e5ff'; // Cyan Cap
    ctx.fillRect(4, 0, 16, 6);
    ctx.fillStyle = '#111'; // Glasses band/Hair
    ctx.fillRect(2, 6, 20, 4);
    
    // Glowing Cyber-Glasses
    ctx.fillStyle = '#ff69b4'; // Pink visor neon glow
    ctx.fillRect(10, 5, 10, 4);

    // Face / Skin
    ctx.fillStyle = '#ffdbac'; 
    ctx.fillRect(4, 10, 16, 8);
    // Mouth
    ctx.fillStyle = '#e07a5f';
    ctx.fillRect(14, 15, 4, 2);

    // Body (Developer Hoodie)
    ctx.fillStyle = '#221e30'; // Dark hoodie
    ctx.fillRect(2, 18, 20, 10);
    
    // Tiny decorative Code character '<' on hoodie
    ctx.fillStyle = '#ff69b4';
    ctx.font = '7px Arial';
    ctx.fillText('<>', 7, 26);

    // Running legs animation
    ctx.fillStyle = '#00e5ff';
    const frameIndex = Math.floor(this.runFrame) % 3;
    if (this.isJumping) {
      // Jumping pose legs
      ctx.fillRect(4, 28, 6, 4);
      ctx.fillRect(14, 28, 6, 3);
    } else if (this.vx !== 0 && frameIndex === 1) {
      ctx.fillRect(2, 28, 6, 4);
      ctx.fillRect(16, 28, 6, 4);
    } else if (this.vx !== 0 && frameIndex === 2) {
      ctx.fillRect(6, 28, 6, 4);
      ctx.fillRect(12, 28, 6, 4);
    } else {
      // Idle legs
      ctx.fillRect(4, 28, 6, 4);
      ctx.fillRect(14, 28, 6, 4);
    }

    ctx.restore();
  }
}

class Platform {
  constructor(x, y, width, height, type = 'normal') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // normal, steel, neon
  }

  draw() {
    ctx.save();
    ctx.translate(this.x - cameraX, this.y);

    if (this.type === 'neon') {
      ctx.fillStyle = '#110d24';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(1, 1, this.width - 2, this.height - 2);
    } else {
      // Pixelated retro grass block
      ctx.fillStyle = '#8b5a2b'; // dirt
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#4ade80'; // grass top
      ctx.fillRect(0, 0, this.width, 10);
      // Pixel cracks decoration
      ctx.fillStyle = '#6b3e1b';
      for (let i = 20; i < this.width; i += 40) {
        ctx.fillRect(i, 18, 6, 6);
        ctx.fillRect(i + 15, 30, 8, 4);
      }
    }

    ctx.restore();
  }
}

class CodeBlock {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.isHit = false;
    this.bounceOffset = 0;
  }

  bounce() {
    if (this.isHit) return;
    this.isHit = true;
    this.bounceOffset = -8;
    coins++;
    score += 200;
    sfx.playCoin();
    updateHUD();
    
    // Spawn floating score
    floatingTexts.push(new FloatingText('+200 COMMIT', this.x + 15, this.y - 10));

    // Spawn sparks
    for (let i = 0; i < 8; i++) {
      particles.push(new Particle(this.x + 15, this.y + 15, '#ffd700', -3 + Math.random() * 6, -3 + Math.random() * 6));
    }
  }

  update() {
    if (this.bounceOffset < 0) {
      this.bounceOffset += 1;
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x - cameraX, this.y + this.bounceOffset);

    // Glowing arcade question block
    if (this.isHit) {
      ctx.fillStyle = '#3c2b5c'; // Inactive block
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.strokeStyle = '#1e1530';
      ctx.strokeRect(0, 0, this.width, this.height);
      // Drawing static 'OK' text inside hit block
      ctx.fillStyle = '#a8a2b5';
      ctx.font = '9px "Press Start 2P"';
      ctx.fillText('OK', 6, 20);
    } else {
      ctx.fillStyle = '#221144'; // Cyber question box
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.strokeStyle = '#ff69b4';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, this.width - 2, this.height - 2);

      // Question Mark or Code logo
      ctx.fillStyle = '#00e5ff';
      ctx.font = '14px "Press Start 2P"';
      ctx.fillText('?', 9, 21);
      
      // Neon pulsing effect
      if (Math.floor(Date.now() / 200) % 2 === 0) {
        ctx.strokeStyle = '#00e5ff';
        ctx.strokeRect(0, 0, this.width, this.height);
      }
    }

    ctx.restore();
  }
}

class Bug {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 20;
    this.vx = -1.2;
    this.vy = 0;
    this.isDead = false;
    this.deadTimer = 0;
  }

  update() {
    if (this.isDead) {
      this.deadTimer--;
      return;
    }

    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;

    // Platform Collisions for Enemy
    let onGround = false;
    for (const p of platforms) {
      if (this.x + this.width > p.x && this.x < p.x + p.width) {
        // Landing top
        if (this.y + this.height >= p.y && this.y + this.height - this.vy <= p.y + 10) {
          this.y = p.y - this.height;
          this.vy = 0;
          onGround = true;
        }
      }
    }

    // Bounce off platform horizontal boundaries
    if (this.x < 10 || this.x > LEVEL_WIDTH - this.width) {
      this.vx = -this.vx;
    }

    // Basic AI bounce on codeblocks/obstacles
    for (const b of codeBlocks) {
      if (this.x + this.width >= b.x && this.x <= b.x + b.width) {
        if (this.y + this.height > b.y && this.y < b.y + b.height) {
          this.vx = -this.vx;
        }
      }
    }
  }

  die() {
    this.isDead = true;
    this.deadTimer = 25; // 25 frames of squashed display
    score += 100;
    sfx.playStomp();
    updateHUD();
    
    // Spawn floating score
    floatingTexts.push(new FloatingText('+100 SQUASH', this.x + 14, this.y - 10));

    // Spawn green goo particles
    for (let i = 0; i < 6; i++) {
      particles.push(new Particle(this.x + 14, this.y + 10, '#39ff14', -2 + Math.random() * 4, -1 - Math.random() * 2));
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x - cameraX, this.y);

    if (this.isDead) {
      // Squashed Bug rendering
      ctx.fillStyle = '#780e22'; // dead bug goo
      ctx.fillRect(0, 10, this.width, 10);
      ctx.fillStyle = '#ff3366'; // dead bug back shell squashed
      ctx.fillRect(4, 15, this.width - 8, 5);
    } else {
      // Crawling Red software Bug
      ctx.fillStyle = '#450410'; // leg joint
      ctx.fillRect(2, 14, 24, 6);
      
      ctx.fillStyle = '#ff3366'; // glowing pinkish-red back shell
      ctx.fillRect(4, 0, this.width - 8, 16);
      
      ctx.fillStyle = '#fff'; // glowing white buggy eyes
      ctx.fillRect(0, 4, 6, 6);
      ctx.fillStyle = '#39ff14'; // neon green buggy pupils
      ctx.fillRect(0, 6, 3, 3);

      // Cute tiny pixel antennas
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(4, -4);
      ctx.moveTo(20, 0);
      ctx.lineTo(24, -4);
      ctx.stroke();

      // Walking legs animation
      ctx.fillStyle = '#ff3366';
      if (Math.floor(Date.now() / 150) % 2 === 0) {
        ctx.fillRect(0, 14, 3, 6);
        ctx.fillRect(12, 14, 3, 6);
        ctx.fillRect(24, 14, 3, 6);
      } else {
        ctx.fillRect(4, 14, 3, 6);
        ctx.fillRect(16, 14, 3, 6);
        ctx.fillRect(20, 14, 3, 6);
      }
    }

    ctx.restore();
  }
}

class Particle {
  constructor(x, y, color, vx, vy) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = vx;
    this.vy = vy;
    this.life = 30 + Math.random() * 20;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.15; // minor gravity
    this.life--;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x - cameraX, this.y);
    ctx.fillStyle = this.color;
    ctx.fillRect(-2, -2, 4, 4);
    ctx.restore();
  }
}

class FloatingText {
  constructor(text, x, y) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.life = 40;
  }

  update() {
    this.y -= 0.8;
    this.life--;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x - cameraX, this.y);
    ctx.fillStyle = '#fff';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(this.text, 0, 0);
    ctx.restore();
  }
}

// --- Level Design Builder ---
function buildLevel() {
  platforms = [];
  codeBlocks = [];
  enemies = [];
  particles = [];
  floatingTexts = [];

  // Ground platforms
  platforms.push(new Platform(0, 360, 600, 40));
  platforms.push(new Platform(680, 360, 450, 40)); // Gap 1
  platforms.push(new Platform(1220, 360, 500, 40)); // Gap 2
  platforms.push(new Platform(1800, 360, 1200, 40)); // Gap 3

  // Floating platforms (cyan neon steel blocks)
  platforms.push(new Platform(300, 240, 120, 25, 'neon'));
  platforms.push(new Platform(800, 240, 160, 25, 'neon'));
  platforms.push(new Platform(1020, 160, 100, 25, 'neon'));
  platforms.push(new Platform(1350, 240, 200, 25, 'neon'));
  platforms.push(new Platform(1640, 180, 120, 25, 'neon'));
  platforms.push(new Platform(2100, 260, 150, 25, 'neon'));
  platforms.push(new Platform(2400, 180, 150, 25, 'neon'));

  // Question/Code Blocks
  codeBlocks.push(new CodeBlock(180, 250));
  codeBlocks.push(new CodeBlock(340, 130));
  codeBlocks.push(new CodeBlock(840, 130));
  codeBlocks.push(new CodeBlock(880, 130));
  codeBlocks.push(new CodeBlock(1400, 130));
  codeBlocks.push(new CodeBlock(1480, 130));
  codeBlocks.push(new CodeBlock(2150, 150));
  codeBlocks.push(new CodeBlock(2440, 80));

  // Spawn Enemies (Bugs)
  enemies.push(new Bug(250, 300));
  enemies.push(new Bug(500, 300));
  enemies.push(new Bug(850, 300));
  enemies.push(new Bug(1000, 300));
  enemies.push(new Bug(1420, 300));
  enemies.push(new Bug(1580, 300));
  enemies.push(new Bug(1950, 300));
  enemies.push(new Bug(2200, 300));
  enemies.push(new Bug(2500, 300));
  enemies.push(new Bug(2700, 300));
}

// --- Collision Math Engine ---
function checkCollisions() {
  // Player & Platform Collisions
  player.isJumping = true; // Default to falling if no platform hit

  for (const p of platforms) {
    // Check horizontal alignment
    if (player.x + player.width > p.x && player.x < p.x + p.width) {
      // Landing on top
      if (player.vy >= 0 && player.y + player.height >= p.y && player.y + player.height - player.vy <= p.y + 10) {
        player.y = p.y - player.height;
        player.vy = 0;
        player.isJumping = false;
      }
      // Hitting underside
      else if (player.vy < 0 && player.y <= p.y + p.height && player.y - player.vy >= p.y + p.height - 10) {
        player.y = p.y + p.height;
        player.vy = 0;
      }
    }
  }

  // Player & CodeBlock Collisions
  for (const b of codeBlocks) {
    if (player.x + player.width > b.x && player.x < b.x + b.width) {
      // Landing on top
      if (player.vy >= 0 && player.y + player.height >= b.y && player.y + player.height - player.vy <= b.y + 6) {
        player.y = b.y - player.height;
        player.vy = 0;
        player.isJumping = false;
      }
      // Hitting from bottom (Triggers bounce and commit points!)
      else if (player.vy < 0 && player.y <= b.y + b.height && player.y - player.vy >= b.y + b.height - 6) {
        player.y = b.y + b.height;
        player.vy = 0;
        b.bounce();
      }
    }
  }

  // Player & Enemy (Bug) Collisions
  for (const e of enemies) {
    if (e.isDead) continue;

    if (player.x + player.width > e.x && player.x < e.x + e.width &&
        player.y + player.height > e.y && player.y < e.y + e.height) {
      
      // Checking if landing from above (stomp action)
      if (player.vy > 0 && player.y + player.height - player.vy <= e.y + 8) {
        e.die();
        player.vy = -6.5; // Bounce off squashed enemy
        player.isJumping = true;
      } else {
        // Player gets bitten by bugs
        player.takeDamage();
      }
    }
  }
}

// --- HUD UI Rendering ---
function updateHUD() {
  const padScore = String(score).padStart(6, '0');
  scoreDisplay.textContent = padScore;
  coinsDisplay.textContent = 'x' + String(coins).padStart(2, '0');
  livesDisplay.textContent = '❤️'.repeat(Math.max(0, lives)) || '☠️';
}

// --- Background Cyber-Metropolis Draw ---
function drawBackground() {
  // Parallax stars
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  for (let i = 0; i < 40; i++) {
    const starX = (i * 97) % (canvas.width + 100) - (cameraX * 0.1) % (canvas.width + 100);
    const starY = (i * 29) % 150;
    ctx.fillRect(starX, starY, 2, 2);
  }

  // Synthwave glowing grids / city silhouette
  ctx.fillStyle = '#080512';
  for (let i = 0; i < 15; i++) {
    const w = 120 + (i * 17) % 80;
    const h = 80 + (i * 31) % 120;
    const bx = (i * 150) - cameraX * 0.25;
    ctx.fillRect(bx, canvas.height - h - 40, w, h);
    ctx.strokeStyle = '#181238';
    ctx.strokeRect(bx, canvas.height - h - 40, w, h);
  }

  // Giant glowing Synthwave grid sun at Level End
  const sunX = 2800 - cameraX;
  if (sunX > -200 && sunX < canvas.width + 200) {
    const grad = ctx.createRadialGradient(sunX, 150, 10, sunX, 150, 100);
    grad.addColorStop(0, '#ff69b4');
    grad.addColorStop(0.5, '#9d4edd');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sunX, 150, 100, 0, Math.PI * 2);
    ctx.fill();

    // Retro grid lines inside the sun
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 3;
    for (let sy = 70; sy < 230; sy += 18) {
      ctx.beginPath();
      ctx.moveTo(sunX - 100, sy);
      ctx.lineTo(sunX + 100, sy);
      ctx.stroke();
    }
  }

  // Endpoint flagpole representation: Giant Cyber Server Tower
  const endpointX = 2940 - cameraX;
  ctx.fillStyle = '#1e1438';
  ctx.fillRect(endpointX, 100, 30, 260);
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 3;
  ctx.strokeRect(endpointX, 100, 30, 260);

  // Tower glowing led lights
  ctx.fillStyle = '#ff69b4';
  if (Math.floor(Date.now() / 300) % 2 === 0) {
    ctx.fillRect(endpointX + 10, 120, 10, 10);
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(endpointX + 10, 200, 10, 10);
  } else {
    ctx.fillRect(endpointX + 10, 160, 10, 10);
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(endpointX + 10, 240, 10, 10);
  }

  // Visual text overlay at goal
  ctx.fillStyle = '#39ff14';
  ctx.font = '10px "Press Start 2P"';
  ctx.fillText('DEPLOY', endpointX - 25, 80);
}

// --- Main Engine Game loop ---
function gameLoop() {
  if (gameState !== 'RUNNING') return;

  // 1. Update Diagnostics
  player.update();
  
  // Camera smooth follow
  const centerScreen = canvas.width / 2;
  cameraX = player.x - centerScreen + player.width / 2;
  if (cameraX < 0) cameraX = 0;
  if (cameraX > LEVEL_WIDTH - canvas.width) cameraX = LEVEL_WIDTH - canvas.width;

  // Update other entities
  for (const b of codeBlocks) b.update();
  for (const e of enemies) e.update();

  // Filter out squashed/expired enemies and dead particles
  enemies = enemies.filter(e => !e.isDead || e.deadTimer > 0);
  
  particles.forEach(p => p.update());
  particles = particles.filter(p => p.life > 0);

  floatingTexts.forEach(t => t.update());
  floatingTexts = floatingTexts.filter(t => t.life > 0);

  // Check frame diagnostics
  if (invulnerableFrames > 0) invulnerableFrames--;

  // Collisions check
  checkCollisions();

  // 2. Rendering pass
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Canvas Retro Arc Gradient
  const mainGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  mainGrad.addColorStop(0, '#070512');
  mainGrad.addColorStop(1, '#1b0e2b');
  ctx.fillStyle = mainGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Background components
  drawBackground();

  // Draw Entities
  for (const p of platforms) p.draw();
  for (const b of codeBlocks) b.draw();
  for (const e of enemies) e.draw();
  for (const p of particles) p.draw();
  for (const t of floatingTexts) t.draw();
  player.draw();

  requestAnimationFrame(gameLoop);
}

// --- Controller System Bindings ---
function bindControls() {
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (gameState === 'RUNNING') {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        player.jump();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // Mobile virtual buttons handlers (touch controls)
  const touchStart = (flagSetter) => (e) => {
    e.preventDefault();
    flagSetter(true);
  };
  const touchEnd = (flagSetter) => (e) => {
    e.preventDefault();
    flagSetter(false);
  };

  btnLeft.addEventListener('mousedown', () => mobileLeft = true);
  btnLeft.addEventListener('mouseup', () => mobileLeft = false);
  btnLeft.addEventListener('mouseleave', () => mobileLeft = false);
  btnLeft.addEventListener('touchstart', touchStart((val) => mobileLeft = val));
  btnLeft.addEventListener('touchend', touchEnd((val) => mobileLeft = val));

  btnRight.addEventListener('mousedown', () => mobileRight = true);
  btnRight.addEventListener('mouseup', () => mobileRight = false);
  btnRight.addEventListener('mouseleave', () => mobileRight = false);
  btnRight.addEventListener('touchstart', touchStart((val) => mobileRight = val));
  btnRight.addEventListener('touchend', touchEnd((val) => mobileRight = val));

  btnJump.addEventListener('mousedown', () => {
    if (gameState === 'RUNNING') player.jump();
  });
  btnJump.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'RUNNING') player.jump();
  });

  startBtn.addEventListener('click', () => {
    sfx.init();
    if (gameState === 'START' || gameState === 'GAMEOVER' || gameState === 'VICTORY') {
      resetGame();
    }
  });
}

// --- State Transitions ---

function resetGame() {
  gameState = 'RUNNING';
  score = 0;
  coins = 0;
  lives = 3;
  invulnerableFrames = 0;
  cameraX = 0;

  overlayScreen.classList.remove('overlay-active');
  
  player = new Player();
  buildLevel();
  updateHUD();
  
  sfx.playCoin(); // Start sound chime
  gameLoop();
}

function gameOver() {
  gameState = 'GAMEOVER';
  overlayScreen.classList.add('overlay-active');
  overlayTitle.textContent = 'GAME OVER';
  overlayInstructions.innerHTML = 'YOUR SCORE: ' + score + '<br>TRY TO SQUASH ALL THE BUGS!';
  startBtn.textContent = 'INSERT COIN';
  sfx.playGameOver();
}

function winGame() {
  gameState = 'VICTORY';
  overlayScreen.classList.add('overlay-active');
  overlayTitle.textContent = 'DEPLIOYED!';
  overlayTitle.style.color = '#39ff14';
  overlayInstructions.innerHTML = 'YOU SQUASHED THE BUGS AND DEPLOYED CODE!<br>FINAL SCORE: ' + score;
  startBtn.textContent = 'REPLAY ENGINE';
  sfx.playCoin();
}

// --- Entry Point ---
bindControls();
updateHUD();
