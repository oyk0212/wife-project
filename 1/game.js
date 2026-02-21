(() => {
  "use strict";

  const CONFIG = {
    canvas: { width: 900, height: 600 },
    player: { radius: 14, speed: 170 },
    wife: {
      radius: 15,
      baseSpeed: 1.4,
      chaseLoseTime: 3,
      patrolReach: 10,
      scanMax: 2.2,
      scanMin: 0.8,
    },
    interactionRadius: 40,
    angryPerMess: 8,
    gameOverDistance: 20,
  };

  const RUNTIME = {
    isMobile: window.matchMedia("(hover: none) and (pointer: coarse)").matches,
    camera: {
      x: CONFIG.canvas.width / 2,
      y: CONFIG.canvas.height / 2,
      zoom: 1,
    },
  };

  const FINAL_CHALLENGE = {
    zone: { x: 20, y: 360, w: 860, h: 220 },
    start: { x: 70, y: 555 },
    wifeStart: { x: 70, y: 405 },
    goal: { x: 845, y: 405, r: 18 },
    walls: [
      { x: 150, y: 380, w: 20, h: 150 },
      { x: 250, y: 430, w: 20, h: 150 },
      { x: 350, y: 380, w: 20, h: 150 },
      { x: 450, y: 430, w: 20, h: 150 },
      { x: 550, y: 380, w: 20, h: 150 },
      { x: 650, y: 430, w: 20, h: 150 },
      { x: 750, y: 380, w: 20, h: 150 },
    ],
  };

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const angryBar = document.getElementById("angryBar");
  const angryValue = document.getElementById("angryValue");
  const progressText = document.getElementById("progressText");
  const stateText = document.getElementById("stateText");
  const warningFlash = document.getElementById("warningFlash");

  const startOverlay = document.getElementById("startOverlay");
  const gameOverOverlay = document.getElementById("gameOverOverlay");
  const winOverlay = document.getElementById("winOverlay");

  const startBtn = document.getElementById("startBtn");
  const restartBtn1 = document.getElementById("restartBtn1");
  const restartBtn2 = document.getElementById("restartBtn2");
  const copyBtn = document.getElementById("copyBtn");

  const dpadButtons = Array.from(document.querySelectorAll(".dir-btn"));
  const messBtn = document.getElementById("messBtn");

  const map = {
    walls: [
      { x: 0, y: 0, w: 900, h: 20 },
      { x: 0, y: 580, w: 900, h: 20 },
      { x: 0, y: 0, w: 20, h: 600 },
      { x: 880, y: 0, w: 20, h: 600 },
      { x: 290, y: 20, w: 20, h: 230 },
      { x: 290, y: 350, w: 20, h: 230 },
      { x: 590, y: 20, w: 20, h: 160 },
      { x: 590, y: 280, w: 20, h: 300 },
    ],
    rooms: [
      { x: 20, y: 20, w: 270, h: 560, color: "#dfefe0", name: "거실" },
      { x: 310, y: 20, w: 280, h: 560, color: "#f7e6cb", name: "주방" },
      { x: 610, y: 20, w: 270, h: 560, color: "#e6e8fb", name: "침실" },
    ],
    doors: [
      { x: 290, y: 250, w: 20, h: 100 },
      { x: 590, y: 180, w: 20, h: 100 },
    ],
  };

  let objects = [];
  let particles = [];

  const player = {
    x: 95,
    y: 100,
    vx: 0,
    vy: 0,
    radius: CONFIG.player.radius,
    facing: { x: 1, y: 0 },
  };

  const wife = {
    x: 745,
    y: 500,
    vx: 0,
    vy: 0,
    radius: CONFIG.wife.radius,
    facing: { x: -1, y: 0 },
    state: "patrol",
    waypointIndex: 0,
    lostSightTimer: 0,
    scanTimer: 0,
    burstTimer: 0,
  };

  const patrolWaypoints = [
    { x: 740, y: 500 },
    { x: 740, y: 120 },
    { x: 640, y: 220 },
    { x: 510, y: 230 },
    { x: 380, y: 470 },
    { x: 510, y: 110 },
    { x: 640, y: 220 },
    { x: 740, y: 420 },
  ];

  const game = {
    started: false,
    ended: false,
    win: false,
    angry: 0,
    messyCount: 0,
    totalObjects: 0,
    finalMode: false,
    flashTimer: 0,
    lastTime: 0,
  };

  const keys = Object.create(null);
  let interactPressed = false;

  const touchMove = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  const audio = {
    ctx: null,
    enabled: false,
  };

  function initObjects() {
    objects = [
      { id: "obj1", name: "Cushion", x: 95, y: 170, room: "Living Room" },
      { id: "obj2", name: "Book", x: 230, y: 230, room: "Living Room" },
      { id: "obj3", name: "Toy", x: 150, y: 390, room: "Living Room" },
      { id: "obj4", name: "Remote", x: 240, y: 500, room: "Living Room" },
      { id: "obj5", name: "Cup", x: 390, y: 120, room: "Kitchen" },
      { id: "obj6", name: "Plate", x: 520, y: 170, room: "Kitchen" },
      { id: "obj7", name: "Towel", x: 370, y: 290, room: "Kitchen" },
      { id: "obj8", name: "Laundry", x: 520, y: 420, room: "Kitchen" },
      { id: "obj9", name: "Mug", x: 450, y: 520, room: "Kitchen" },
      { id: "obj10", name: "Pillow", x: 700, y: 130, room: "Bedroom" },
      { id: "obj11", name: "Socks", x: 820, y: 210, room: "Bedroom" },
      { id: "obj12", name: "Magazine", x: 760, y: 350, room: "Bedroom" },
      { id: "obj13", name: "Shirt", x: 680, y: 500, room: "Bedroom" },
      { id: "obj14", name: "Doll", x: 820, y: 470, room: "Bedroom" },
    ].map((o) => ({ ...o, state: "tidy", r: 12, shake: 0 }));

    game.totalObjects = objects.length;
  }

  function resetGame() {
    initObjects();
    particles = [];

    player.x = 95;
    player.y = 100;
    player.vx = 0;
    player.vy = 0;
    player.facing.x = 1;
    player.facing.y = 0;

    wife.x = 745;
    wife.y = 500;
    wife.vx = 0;
    wife.vy = 0;
    wife.facing.x = -1;
    wife.facing.y = 0;
    wife.state = "patrol";
    wife.waypointIndex = 0;
    wife.lostSightTimer = 0;
    wife.scanTimer = 0;
    wife.burstTimer = 0;

    game.started = false;
    game.ended = false;
    game.win = false;
    game.angry = 0;
    game.messyCount = 0;
    game.finalMode = false;
    game.flashTimer = 0;
    game.lastTime = 0;
    RUNTIME.camera.x = player.x;
    RUNTIME.camera.y = player.y;

    hideAllOverlays();
    showOverlay(startOverlay);
    updateHud();
  }

  function hideAllOverlays() {
    startOverlay.classList.remove("show");
    gameOverOverlay.classList.remove("show");
    winOverlay.classList.remove("show");
  }

  function showOverlay(el) {
    hideAllOverlays();
    el.classList.add("show");
  }

  function startGame() {
    game.started = true;
    game.ended = false;
    hideAllOverlays();
    ensureAudioContext();
  }

  function setGameOver() {
    game.ended = true;
    game.win = false;
    showOverlay(gameOverOverlay);
    beep(130, 0.15, "sawtooth");
  }

  function setWin() {
    game.ended = true;
    game.win = true;
    showOverlay(winOverlay);
    beep(600, 0.12, "sine");
    setTimeout(() => beep(760, 0.12, "sine"), 90);
  }

  function startFinalChallenge() {
    if (game.finalMode) return;

    game.finalMode = true;
    game.angry = 100;
    wife.state = "chase";
    wife.scanTimer = 0;
    wife.burstTimer = 0;
    wife.lostSightTimer = 0;
    game.flashTimer = 0.5;

    player.x = FINAL_CHALLENGE.start.x;
    player.y = FINAL_CHALLENGE.start.y;
    wife.x = FINAL_CHALLENGE.wifeStart.x;
    wife.y = FINAL_CHALLENGE.wifeStart.y;

    beep(220, 0.12, "sawtooth");
    setTimeout(() => beep(180, 0.12, "sawtooth"), 80);
    updateHud();
  }

  function updateHud() {
    angryBar.style.width = `${game.angry}%`;
    angryValue.textContent = `${Math.round(game.angry)}`;
    progressText.textContent = `${game.messyCount}/${game.totalObjects}`;
    stateText.textContent = wife.state.toUpperCase();
    stateText.classList.toggle("patrol", wife.state === "patrol");
    stateText.classList.toggle("chase", wife.state === "chase");
  }

  function getWifeSpeedPx() {
    const speedUnit = CONFIG.wife.baseSpeed + (game.angry / 100) * 2.0;
    const burst = wife.burstTimer > 0 ? 1.25 : 1.0;
    const mobileAssist = RUNTIME.isMobile ? 0.9 : 1.0;
    const finalBoost = game.finalMode ? 1.55 : 1.0;
    return speedUnit * 60 * burst * mobileAssist * finalBoost;
  }

  function getVisionRadius() {
    return 120 + (game.angry / 100) * 80;
  }

  function getVisionAngleDeg() {
    return 90 + (game.angry / 100) * 40;
  }

  function getScanInterval() {
    return CONFIG.wife.scanMax - (game.angry / 100) * (CONFIG.wife.scanMax - CONFIG.wife.scanMin);
  }

  function getInteractionRadius() {
    return CONFIG.interactionRadius + (RUNTIME.isMobile ? 16 : 0);
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function dist2(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    return dx * dx + dy * dy;
  }

  function length(x, y) {
    return Math.sqrt(x * x + y * y);
  }

  function normalize(x, y) {
    const len = length(x, y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: x / len, y: y / len };
  }

  function circleRectOverlap(cx, cy, r, rect) {
    const closestX = clamp(cx, rect.x, rect.x + rect.w);
    const closestY = clamp(cy, rect.y, rect.y + rect.h);
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < r * r;
  }

  function segmentIntersectsRect(p1, p2, rect) {
    if (pointInRect(p1.x, p1.y, rect) || pointInRect(p2.x, p2.y, rect)) {
      return true;
    }
    const edges = [
      [{ x: rect.x, y: rect.y }, { x: rect.x + rect.w, y: rect.y }],
      [{ x: rect.x + rect.w, y: rect.y }, { x: rect.x + rect.w, y: rect.y + rect.h }],
      [{ x: rect.x + rect.w, y: rect.y + rect.h }, { x: rect.x, y: rect.y + rect.h }],
      [{ x: rect.x, y: rect.y + rect.h }, { x: rect.x, y: rect.y }],
    ];
    for (const [a, b] of edges) {
      if (segmentsIntersect(p1, p2, a, b)) {
        return true;
      }
    }
    return false;
  }

  function pointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }

  function segmentsIntersect(a, b, c, d) {
    const d1 = direction(c, d, a);
    const d2 = direction(c, d, b);
    const d3 = direction(a, b, c);
    const d4 = direction(a, b, d);

    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
      return true;
    }

    if (d1 === 0 && onSegment(c, d, a)) return true;
    if (d2 === 0 && onSegment(c, d, b)) return true;
    if (d3 === 0 && onSegment(a, b, c)) return true;
    if (d4 === 0 && onSegment(a, b, d)) return true;

    return false;
  }

  function direction(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  }

  function onSegment(a, b, p) {
    return (
      Math.min(a.x, b.x) <= p.x &&
      p.x <= Math.max(a.x, b.x) &&
      Math.min(a.y, b.y) <= p.y &&
      p.y <= Math.max(a.y, b.y)
    );
  }

  function getActiveWalls() {
    return game.finalMode ? map.walls.concat(FINAL_CHALLENGE.walls) : map.walls;
  }

  function moveWithCollision(entity, dx, dy) {
    const walls = getActiveWalls();
    const nextX = entity.x + dx;
    const nextY = entity.y + dy;

    entity.x = nextX;
    for (const wall of walls) {
      if (circleRectOverlap(entity.x, entity.y, entity.radius, wall)) {
        entity.x -= dx;
        break;
      }
    }

    entity.y = nextY;
    for (const wall of walls) {
      if (circleRectOverlap(entity.x, entity.y, entity.radius, wall)) {
        entity.y -= dy;
        break;
      }
    }

    entity.x = clamp(entity.x, entity.radius, CONFIG.canvas.width - entity.radius);
    entity.y = clamp(entity.y, entity.radius, CONFIG.canvas.height - entity.radius);
  }

  function updatePlayer(dt) {
    let ix = 0;
    let iy = 0;

    if (keys.KeyW) iy -= 1;
    if (keys.KeyS) iy += 1;
    if (keys.KeyA) ix -= 1;
    if (keys.KeyD) ix += 1;

    if (RUNTIME.isMobile) {
      if (touchMove.up) iy -= 1;
      if (touchMove.down) iy += 1;
      if (touchMove.left) ix -= 1;
      if (touchMove.right) ix += 1;
    }

    const vec = normalize(ix, iy);
    const speed = CONFIG.player.speed * (RUNTIME.isMobile ? 1.2 : 1.0);
    player.vx = vec.x * speed;
    player.vy = vec.y * speed;

    if (vec.x !== 0 || vec.y !== 0) {
      player.facing.x = vec.x;
      player.facing.y = vec.y;
    }

    moveWithCollision(player, player.vx * dt, player.vy * dt);
  }

  function hasLineOfSight(from, to) {
    const p1 = { x: from.x, y: from.y };
    const p2 = { x: to.x, y: to.y };
    for (const wall of getActiveWalls()) {
      if (segmentIntersectsRect(p1, p2, wall)) {
        return false;
      }
    }
    return true;
  }

  function canSeePlayer() {
    const dx = player.x - wife.x;
    const dy = player.y - wife.y;
    const d2 = dx * dx + dy * dy;
    const radius = getVisionRadius();
    if (d2 > radius * radius) return false;

    const dirToPlayer = normalize(dx, dy);
    const facing = normalize(wife.facing.x, wife.facing.y);
    const dot = facing.x * dirToPlayer.x + facing.y * dirToPlayer.y;
    const angleLimit = Math.cos((getVisionAngleDeg() * 0.5 * Math.PI) / 180);
    if (dot < angleLimit) return false;

    return hasLineOfSight(wife, player);
  }

  function updateWife(dt) {
    if (!game.finalMode) {
      wife.scanTimer += dt;
      if (wife.scanTimer >= getScanInterval()) {
        wife.scanTimer = 0;
        wife.burstTimer = 0.45;
        if (wife.state === "patrol") {
          wife.waypointIndex = (wife.waypointIndex + 1) % patrolWaypoints.length;
        }
      }
      wife.burstTimer = Math.max(0, wife.burstTimer - dt);

      const seesPlayer = canSeePlayer();

      if (seesPlayer) {
        if (wife.state !== "chase") {
          game.flashTimer = 0.35;
          beep(260, 0.1, "square");
        }
        wife.state = "chase";
        wife.lostSightTimer = 0;
      } else if (wife.state === "chase") {
        wife.lostSightTimer += dt;
        if (wife.lostSightTimer >= CONFIG.wife.chaseLoseTime) {
          wife.state = "patrol";
          wife.waypointIndex = findClosestWaypoint(wife.x, wife.y);
        }
      }
    } else {
      wife.state = "chase";
      wife.lostSightTimer = 0;
    }

    let target;
    if (wife.state === "chase" || game.finalMode) {
      target = { x: player.x, y: player.y };
    } else {
      target = patrolWaypoints[wife.waypointIndex];
      const d2Waypoint = dist2(wife.x, wife.y, target.x, target.y);
      if (d2Waypoint < CONFIG.wife.patrolReach * CONFIG.wife.patrolReach) {
        wife.waypointIndex = (wife.waypointIndex + 1) % patrolWaypoints.length;
        target = patrolWaypoints[wife.waypointIndex];
      }
    }

    const moveDir = normalize(target.x - wife.x, target.y - wife.y);
    wife.vx = moveDir.x * getWifeSpeedPx();
    wife.vy = moveDir.y * getWifeSpeedPx();

    if (moveDir.x !== 0 || moveDir.y !== 0) {
      wife.facing.x = moveDir.x;
      wife.facing.y = moveDir.y;
    }

    moveWithCollision(wife, wife.vx * dt, wife.vy * dt);

    if (dist2(player.x, player.y, wife.x, wife.y) < CONFIG.gameOverDistance * CONFIG.gameOverDistance) {
      setGameOver();
    }

    updateHud();
  }

  function findClosestWaypoint(x, y) {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < patrolWaypoints.length; i += 1) {
      const wp = patrolWaypoints[i];
      const d = dist2(x, y, wp.x, wp.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function tryInteract() {
    if (!game.started || game.ended) return;

    let picked = null;
    let bestD = Infinity;
    const interactionRadius = getInteractionRadius();
    const radius2 = interactionRadius * interactionRadius;

    for (const obj of objects) {
      if (obj.state !== "tidy") continue;
      const d2 = dist2(player.x, player.y, obj.x, obj.y);
      if (d2 <= radius2 && d2 < bestD) {
        bestD = d2;
        picked = obj;
      }
    }

    if (!picked) return;

    picked.state = "messy";
    picked.shake = 0.18;
    game.messyCount += 1;

    const progress = game.messyCount / game.totalObjects;
    const bonus = progress > 0.7 ? 2 : 0;
    game.angry = clamp(game.angry + CONFIG.angryPerMess + bonus, 0, 100);

    spawnMessParticles(picked.x, picked.y);
    beep(420, 0.06, "triangle");
    updateHud();

    if (game.messyCount >= game.totalObjects) {
      startFinalChallenge();
    }
  }

  function updateFinalChallenge() {
    if (!game.finalMode || game.ended) return;
    const gx = FINAL_CHALLENGE.goal.x;
    const gy = FINAL_CHALLENGE.goal.y;
    const winDist = FINAL_CHALLENGE.goal.r + player.radius;
    if (dist2(player.x, player.y, gx, gy) <= winDist * winDist) {
      setWin();
    }
  }

  function spawnMessParticles(x, y) {
    for (let i = 0; i < 10; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 130;
      particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0.4 + Math.random() * 0.25,
        size: 2 + Math.random() * 3,
      });
    }
  }

  function updateParticles(dt) {
    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
    }
    particles = particles.filter((p) => p.life > 0);
  }

  function updateObjects(dt) {
    for (const obj of objects) {
      obj.shake = Math.max(0, obj.shake - dt);
    }
  }

  function drawMap() {
    for (const room of map.rooms) {
      ctx.fillStyle = room.color;
      ctx.fillRect(room.x, room.y, room.w, room.h);
      ctx.fillStyle = "rgba(20, 25, 30, 0.55)";
      ctx.font = "bold 16px Trebuchet MS";
      ctx.fillText(room.name, room.x + 14, room.y + 24);
    }

    ctx.fillStyle = "#5f5142";
    for (const wall of map.walls) {
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    }

    ctx.fillStyle = "#a3896f";
    for (const door of map.doors) {
      ctx.fillRect(door.x, door.y, door.w, door.h);
    }

    if (game.finalMode) {
      drawFinalChallenge();
    }
  }

  function drawFinalChallenge() {
    const zone = FINAL_CHALLENGE.zone;

    ctx.fillStyle = "rgba(25, 28, 35, 0.22)";
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);

    ctx.fillStyle = "rgba(67, 74, 86, 0.96)";
    for (const wall of FINAL_CHALLENGE.walls) {
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    }

    const pulse = 0.7 + Math.sin(performance.now() * 0.01) * 0.2;
    ctx.beginPath();
    ctx.arc(FINAL_CHALLENGE.goal.x, FINAL_CHALLENGE.goal.y, FINAL_CHALLENGE.goal.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 215, 64, ${pulse})`;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#8b6b00";
    ctx.stroke();

    ctx.fillStyle = "rgba(20, 20, 20, 0.8)";
    ctx.font = "bold 13px Trebuchet MS";
    ctx.fillText("FINAL MAZE", 28, 378);
    ctx.fillText("GOAL", FINAL_CHALLENGE.goal.x - 18, FINAL_CHALLENGE.goal.y - 26);
  }

  function drawObjects() {
    for (const obj of objects) {
      const wobble = obj.shake > 0 ? Math.sin(obj.shake * 90) * 4 : 0;
      const x = obj.x + wobble;

      ctx.beginPath();
      ctx.arc(x, obj.y, obj.r, 0, Math.PI * 2);
      ctx.fillStyle = obj.state === "tidy" ? "#5aa06a" : "#bc6f34";
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(25,30,35,0.6)";
      ctx.stroke();

      ctx.fillStyle = "rgba(10,15,18,0.72)";
      ctx.font = "11px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText(obj.name, x, obj.y - 16);
      ctx.textAlign = "start";
    }
  }

  function drawPlayer() {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#248fcc";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + player.facing.x * 20, player.y + player.facing.y * 20);
    ctx.strokeStyle = "#083750";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function drawWife() {
    const radius = game.finalMode ? 160 : getVisionRadius();
    const angle = (getVisionAngleDeg() * Math.PI) / 180;
    const facingAngle = Math.atan2(wife.facing.y, wife.facing.x);

    ctx.beginPath();
    ctx.moveTo(wife.x, wife.y);
    ctx.arc(wife.x, wife.y, radius, facingAngle - angle / 2, facingAngle + angle / 2);
    ctx.closePath();
    ctx.fillStyle = wife.state === "chase" ? "rgba(230, 50, 45, 0.2)" : "rgba(240, 160, 80, 0.18)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(wife.x, wife.y, wife.radius, 0, Math.PI * 2);
    ctx.fillStyle = wife.state === "chase" ? "#e3422f" : "#df7a5d";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(wife.x, wife.y);
    ctx.lineTo(wife.x + wife.facing.x * 22, wife.y + wife.facing.y * 22);
    ctx.strokeStyle = "#6e1913";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function drawParticles() {
    for (const p of particles) {
      const alpha = clamp(p.life / 0.6, 0, 1);
      ctx.fillStyle = `rgba(247, 95, 58, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawInteractionHint() {
    if (!game.started || game.ended || game.finalMode) return;

    let hasNearby = false;
    const interactionRadius = getInteractionRadius();
    const radius2 = interactionRadius * interactionRadius;
    for (const obj of objects) {
      if (obj.state === "tidy" && dist2(player.x, player.y, obj.x, obj.y) <= radius2) {
        hasNearby = true;
        break;
      }
    }
    if (!hasNearby) return;

    ctx.beginPath();
    ctx.arc(player.x, player.y, interactionRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(35, 95, 40, 0.55)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(10, 18, 23, 0.72)";
    ctx.font = "bold 14px Trebuchet MS";
    ctx.fillText("E / 어지르기", player.x - 38, player.y - 24);
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (RUNTIME.isMobile && RUNTIME.camera.zoom > 1.01) {
      applyCameraTransform();
    }
    drawMap();
    drawObjects();
    drawParticles();
    drawPlayer();
    drawWife();
    drawInteractionHint();
    ctx.restore();

    if (RUNTIME.isMobile) {
      drawMobileGuide();
    }
  }

  function applyCameraTransform() {
    const z = RUNTIME.camera.zoom;
    const tx = canvas.width / 2 - RUNTIME.camera.x * z;
    const ty = canvas.height / 2 - RUNTIME.camera.y * z;
    ctx.setTransform(z, 0, 0, z, tx, ty);
  }

  function updateCamera(dt) {
    if (!RUNTIME.isMobile || RUNTIME.camera.zoom <= 1.01) {
      return;
    }
    const z = RUNTIME.camera.zoom;
    const halfW = canvas.width / (2 * z);
    const halfH = canvas.height / (2 * z);

    const targetX = clamp(player.x, halfW, CONFIG.canvas.width - halfW);
    const targetY = clamp(player.y, halfH, CONFIG.canvas.height - halfH);
    const smoothing = Math.min(1, dt * 8);

    RUNTIME.camera.x += (targetX - RUNTIME.camera.x) * smoothing;
    RUNTIME.camera.y += (targetY - RUNTIME.camera.y) * smoothing;
  }

  function drawMobileGuide() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(10, canvas.height - 34, 300, 24);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px Trebuchet MS";
    ctx.fillText("화살표 버튼으로 이동 / 어지르기", 18, canvas.height - 18);
  }

  function updateWarning(dt) {
    game.flashTimer = Math.max(0, game.flashTimer - dt);
    const chasing = wife.state === "chase";
    warningFlash.classList.toggle("show", chasing || game.flashTimer > 0);
  }

  function gameLoop(ts) {
    if (!game.lastTime) game.lastTime = ts;
    const dt = Math.min(0.033, (ts - game.lastTime) / 1000);
    game.lastTime = ts;

    if (game.started && !game.ended) {
      updatePlayer(dt);
      updateWife(dt);
      updateObjects(dt);
      updateParticles(dt);
      updateCamera(dt);
      updateFinalChallenge();

      if (interactPressed) {
        tryInteract();
        interactPressed = false;
      }
    }

    updateWarning(dt);
    draw();
    requestAnimationFrame(gameLoop);
  }

  function ensureAudioContext() {
    if (audio.enabled) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audio.ctx = new AudioCtx();
    audio.enabled = true;
  }

  function beep(freq, duration, type) {
    if (!audio.enabled || !audio.ctx) return;
    const now = audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();

    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(audio.ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function onKeyDown(e) {
    keys[e.code] = true;
    if (e.code === "KeyE") {
      interactPressed = true;
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  function setupDesktopInput() {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
  }

  function setupTouchControls() {
    for (const btn of dpadButtons) {
      const dir = btn.dataset.dir;
      if (!dir || !(dir in touchMove)) continue;

      const activate = (e) => {
        e.preventDefault();
        e.stopPropagation();
        touchMove[dir] = true;
        btn.classList.add("active");
        ensureAudioContext();
      };
      const deactivate = (e) => {
        e.preventDefault();
        e.stopPropagation();
        touchMove[dir] = false;
        btn.classList.remove("active");
      };

      btn.addEventListener("pointerdown", activate);
      btn.addEventListener("pointerup", deactivate);
      btn.addEventListener("pointercancel", deactivate);
      btn.addEventListener("pointerleave", deactivate);
    }

    messBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      interactPressed = true;
      ensureAudioContext();
    });
    messBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  function setupUI() {
    startBtn.addEventListener("click", startGame);
    restartBtn1.addEventListener("click", resetGame);
    restartBtn2.addEventListener("click", resetGame);

    copyBtn.addEventListener("click", async () => {
      const text = "Wife Project에서 들키지 않고 집안을 전부 어질러서 승리했다!";
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = "복사됨!";
        setTimeout(() => {
          copyBtn.textContent = "공유 문구 복사";
        }, 900);
      } catch (err) {
        copyBtn.textContent = "복사 실패";
        setTimeout(() => {
          copyBtn.textContent = "공유 문구 복사";
        }, 900);
      }
    });
  }

  function init() {
    document.body.classList.toggle("mobile-mode", RUNTIME.isMobile);
    setupDesktopInput();
    setupTouchControls();
    setupUI();
    resetGame();
    requestAnimationFrame(gameLoop);
  }

  init();
})();
