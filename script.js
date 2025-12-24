// ====== ELEMENTOS ======
const stage = document.getElementById("stage");
const card = document.getElementById("card");
const replay = document.getElementById("replay");
const muteBtn = document.getElementById("mute");

// MP3
const music = document.getElementById("music");
music.volume = 0.6;

let muted = false;
muteBtn.addEventListener("click", () => {
  muted = !muted;
  music.muted = muted;
  muteBtn.textContent = muted ? "🔇 Música" : "🔊 Música";
});

// ====== CONFETTI CANVAS ======
const canvas = document.getElementById("confetti");
const ctx = canvas.getContext("2d");

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

const rand = (a, b) => Math.random() * (b - a) + a;

let particles = [];
let running = false;
let fallTimer = null;

// ====== DESENHOS ======
function drawStar(x, y, r, rot) {
  const spikes = 5;
  const step = Math.PI / spikes;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = rot + i * step;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function drawPixelTree(size) {
  const px = Math.max(2, Math.floor(size / 6));
  const grid = [
    [0,0,0,1,0,0,0],
    [0,0,1,1,1,0,0],
    [0,1,1,1,1,1,0],
    [0,0,0,2,0,0,0],
    [0,0,0,2,0,0,0],
  ];

  const green = "hsl(135 65% 45%)";
  const trunk = "hsl(30 55% 40%)";

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const v = grid[r][c];
      if (!v) continue;
      ctx.fillStyle = v === 1 ? green : trunk;
      ctx.fillRect((c - 3) * px, (r - 2) * px, px, px);
    }
  }

  ctx.globalAlpha *= 0.9;
  ctx.fillStyle = "hsl(350 85% 60%)";
  ctx.fillRect(-px, -px, px, px);
  ctx.fillStyle = "hsl(200 85% 60%)";
  ctx.fillRect(px, 0, px, px);
}

// ====== PARTICULAS ======
function addBurst(x, y, count = 900) {
  for (let i = 0; i < count; i++) {
    particles.push({
      kind: "confetti",
      x, y,
      vx: rand(-8, 8),
      vy: rand(-14, -5),
      g: rand(0.14, 0.26),
      size: rand(3, 8),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.3, 0.3),
      life: rand(180, 320), // dura mais
      hue: rand(0, 360),
      shape: Math.random() < 0.2 ? "star" : "rect",
    });
  }
  if (!running) animate();
}

function addFaller(kind = "tree") {
  const x = rand(20, window.innerWidth - 20);
  const y = rand(-40, -10);
  const isTree = kind === "tree";

  particles.push({
    kind,
    x, y,
    vx: rand(-0.8, 0.8),
    vy: isTree ? rand(0.8, 1.7) : rand(1.2, 2.4),
    g: 0.01,
    size: isTree ? rand(12, 20) : rand(10, 18),
    rot: rand(0, Math.PI * 2),
    vr: rand(-0.05, 0.05),
    life: isTree ? rand(450, 700) : rand(320, 540),
    hue: isTree ? rand(110, 150) : rand(40, 70),
  });

  if (!running) animate();
}

function startFalling(durationMs = 11000) {
  if (fallTimer) clearInterval(fallTimer);

  const start = Date.now();
  fallTimer = setInterval(() => {
    const t = Date.now() - start;
    if (t > durationMs) {
      clearInterval(fallTimer);
      fallTimer = null;
      return;
    }

    const intense = t < 2800;

    const treesToSpawn = intense ? 3 : 1;
    for (let i = 0; i < treesToSpawn; i++) addFaller("tree");

    const starsToSpawn = intense ? 4 : 2;
    for (let i = 0; i < starsToSpawn; i++) addFaller("starFall");
  }, 120);
}

// ====== ANIMAÇÃO ======
function animate() {
  running = true;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  particles = particles.filter((p) => p.life > 0);

  for (const p of particles) {
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= 1;

    const alpha = Math.max(0, Math.min(1, p.life / 170));

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);

    if (p.kind === "confetti") {
      ctx.fillStyle = `hsl(${p.hue} 90% 60%)`;
      if (p.shape === "star") drawStar(0, 0, p.size, 0);
      else ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    }

    if (p.kind === "starFall") {
      ctx.fillStyle = `hsl(${p.hue} 95% 65%)`;
      drawStar(0, 0, p.size, 0);
    }

    if (p.kind === "tree") {
      drawPixelTree(p.size);
    }

    ctx.restore();
  }

  if (particles.length) requestAnimationFrame(animate);
  else running = false;
}

// ====== UTIL ======
function centerOfCard() {
  const rect = card.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// ====== LÓGICA DO CARTÃO ======
let opened = false;

function openCard() {
  if (opened) return;
  opened = true;

  stage.classList.add("opened");

  // 🎵 MP3
  music.currentTime = 0;
  music.play().catch(()=>{});

  const { x, y } = centerOfCard();
  addBurst(x, y, 900);
  startFalling(11000);
}

function replayConfetti() {
  const { x, y } = centerOfCard();
  addBurst(x, y, 650);
  startFalling(8000);
}

card.addEventListener("click", openCard);
card.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    openCard();
  }
});

replay.addEventListener("click", replayConfetti);
