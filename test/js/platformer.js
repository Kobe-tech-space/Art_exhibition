const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const bgm = document.getElementById('bgm');

canvas.width = 800;
canvas.height = 600;

// Focus canvas automatically
canvas.tabIndex = 1;
canvas.style.outline = 'none';

let gameState = 'START';
let currentLevel = 1;
let collectedItems = 0;
let score = 0;
let cameraY = 0;
let autoScrollSpeed = 0;
let lives = 5;

// Weather system
let snowflakes = [];
let hailstones = [];
let lastHailTime = 0;

// Constants
const GRAVITY = 0.3;
const BASE_JUMP = -10;
const SUPER_JUMP = -14;
const MOVE_SPEED = 3;
const FRICTION = 0.85;

// Key images for inventory and goals
const keyImages = [];
const keyImagePaths = [
    'picture/key1.JPG',
    'picture/key2.JPG',
    'picture/key3.JPG',
    'picture/key4.JPG',
    'picture/key5.JPG'
];

// Preload key images
keyImagePaths.forEach((src, i) => {
    const img = new Image();
    img.src = src;
    keyImages.push(img);
});

const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false,
    ' ': false
};

window.addEventListener('keydown', e => {
    let k = e.key.toLowerCase();
    if (keys.hasOwnProperty(k)) keys[k] = true;
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});

window.addEventListener('keyup', e => {
    let k = e.key.toLowerCase();
    if (keys.hasOwnProperty(k)) keys[k] = false;
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

const player = {
    x: 400,
    y: 400,
    w: 20,
    h: 40,
    vx: 0,
    vy: 0,
    dir: 1,
    grounded: false,
    superJumpTimer: 0,
    stunTimer: 0
};

let platforms = [];
let entities = [];
let goal = null;

// ─── Platform generation: guaranteed reachable, fully random ──────────────────
//
// Physics-derived limits (conservative):
//   BASE_JUMP = -10, GRAVITY = 0.3  →  max jump height ≈ 10²/(2×0.3) ≈ 166 px
//   Safe vertical gap:   MIN_VG ~ 45px,  MAX_VG ~ 135px
//   Air-time at max jump ≈ 67 frames, MOVE_SPEED = 3
//   Safe horizontal gap from platform edge to edge: MAX_HG ~ 170px
//
// Algorithm:
//   Starting from a seed platform (near player spawn), each successive
//   platform is placed at a RANDOM position that satisfies BOTH:
//     1. vertical gap ∈ [MIN_VG, MAX_VG]
//     2. the new platform overlaps the horizontal "landing zone" of the
//        previous platform (i.e. a player can physically reach it)
//   This guarantees a reachable chain from bottom to top.

const PHYS_MAX_V_GAP = 130; // px – max vertical gap player can jump
const PHYS_MAX_H_GAP = 280; // px – max horizontal gap (edge-to-edge) player can cross（已增加）
const PHYS_MIN_V_GAP = 45;  // px – min vertical gap (avoid stacking)

/**
 * Generate `numPlats` random platforms forming a guaranteed-reachable chain.
 * @param {number} numPlats  – number of platforms to generate
 * @param {number} seedY     – Y position of the implicit starting reference (e.g. ground surface)
 * @param {number} seedX     – X center of the starting reference
 * @param {number} pWidth    – platform width
 * @param {number} levelNum  – used to tune gap variability
 * @returns {Array} array of platform objects
 */
function buildGuaranteedPath(numPlats, seedY, seedX, pWidth, levelNum) {
    const list = [];
    // Reference for previous platform (starts at player spawn area)
    let prev = { x: seedX - pWidth / 2, y: seedY, w: pWidth, h: 15 };

    // Difficulty: higher level → gaps lean larger (still within physics limits)
    let vGapMin = PHYS_MIN_V_GAP;
    let vGapMax = Math.min(PHYS_MAX_V_GAP, 70 + levelNum * 10);
    // 大胆增加水平间距！但确保在可跳跃范围内
    let hGapBase = 220 + levelNum * 15;
    
    // 第五关特别设置
    if (levelNum === 5) {
        hGapBase = 280; // 非常开放的布局
        vGapMax = 120; // 稍微增加垂直间距
    }

    for (let i = 0; i < numPlats; i++) {
        // ── 1. Pick a random vertical gap ──────────────────────────────
        const vGap = vGapMin + Math.random() * (vGapMax - vGapMin);
        const newY = prev.y - vGap;

        // ── 2. Determine reachable X range ─────────────────────────────
        // The player can leave from anywhere on prev platform and land on newPlat.
        // Most conservative constraint: new platform's right edge must be reachable
        // from prev platform's left edge (and vice-versa).
        // Reachable zone: prev.left - MAX_HG  …  prev.right + MAX_HG
        // New platform must fit entirely in [0, 800-pWidth], and its range must
        // overlap the reachable zone so at least one landing position exists.
        const reachLeft  = prev.x - hGapBase;              // leftmost valid newPlat.x
        const reachRight = prev.x + prev.w + hGapBase - pWidth; // rightmost valid newPlat.x
        const xMin = Math.max(0, reachLeft);
        const xMax = Math.min(800 - pWidth, reachRight);

        // ── 3. Random X within reachable window ────────────────────────
        let newX;
        if (xMax <= xMin) {
            // Fallback: centre under/above prev (should rarely happen)
            newX = Math.max(0, Math.min(800 - pWidth, prev.x + prev.w / 2 - pWidth / 2));
        } else {
            newX = xMin + Math.random() * (xMax - xMin);
        }

        const newPlat = { x: newX, y: newY, w: pWidth, h: 15, type: 'normal' };
        list.push(newPlat);
        prev = newPlat;
    }
    return list;
}

function initLevel(levelNum) {
    player.vx = 0;
    player.vy = 0;
    player.superJumpTimer = 0;
    player.stunTimer = 0;
    player.x = 400;
    player.y = 490;
    cameraY = 0;
    platforms = [];
    entities = [];
    snowflakes = [];
    hailstones = [];
    lastHailTime = Date.now();

    if (levelNum === 1) {
        lives = 5;
        updateLivesDisplay();
    }

    // Bottom foundation
    platforms.push({ x: 0, y: 550, w: 800, h: 50, type: 'ground' });

    if (levelNum <= 5) {
        // Platform width narrows slightly with level
        let pWidth = Math.max(100, 190 - levelNum * 12);
        // 所有关卡都增加平台数量
        let numPlats = 10 + levelNum * 2;
        
        // 第五关特别设置
        if (levelNum === 5) {
            numPlats = 18; // 更多阶梯需要爬
            pWidth = 110; // 稍微窄一点，更有挑战
        }

        // Seed: player spawns near x=400, y=490; ground surface is y=550
        const chain = buildGuaranteedPath(numPlats, 540, 400, pWidth, levelNum);

        for (let i = 0; i < chain.length; i++) {
            const p = chain[i];
            
            if (levelNum === 1) {
                // 第一关：纯静止阶梯
                p.type = 'normal';
            } else if (levelNum === 2) {
                // 第二关：所有阶梯下降
                p.type = 'descending';
                p.descendSpeed = 0.2;
            } else if (levelNum === 3) {
                // 第三关：移动阶梯（每3个中有1个移动）
                if (i % 3 === 2) {
                    p.type = 'moving';
                    p.originalX = p.x;
                    p.moveRange = 100;
                    p.speed = (Math.random() > 0.5 ? 1 : -1) * 1.2;
                } else {
                    p.type = 'normal';
                }
            } else if (levelNum === 4) {
                // 第四关：正常阶梯 + 天气系统
                p.type = 'normal';
            } else if (levelNum === 5) {
                // 第五关：易碎阶梯
                p.type = 'fragile';
                p.touched = false;
                p.breakTimer = 0;
            }
            
            platforms.push(p);
        }

        // Auto scroll settings
        if (levelNum === 1) {
            autoScrollSpeed = 0; // 第一关无自动滚动
        } else if (levelNum === 2) {
            autoScrollSpeed = 0; // 第二关由阶梯自己下降
        } else {
            autoScrollSpeed = 0.1 + (levelNum * 0.02);
        }

        // Place goal on/above the highest (last) platform in the chain
        const finalPlat = platforms[platforms.length - 1];

        goal = {
            x: finalPlat.x + finalPlat.w / 2 - 25,
            y: finalPlat.y - 55,
            w: 50,
            h: 50,
            itemIndex: levelNum - 1,
            platform: finalPlat  // 保存目标所在的平台引用
        };

        document.getElementById('level-title').textContent = `第${levelNum}关`;
        document.getElementById('score-display').style.display = 'none';

    } else {
        // Endless Mode
        document.getElementById('level-title').textContent = `无尽攀登`;
        document.getElementById('score-display').style.display = 'block';
        goal = null;
        score = 0;
        generateEndlessPlatforms(300, 15);
    }
}

function generateEndlessPlatforms(startY, count) {
    let currentY = startY;
    let diffFactor = Math.min(5, Math.floor(score / 2000));

    for (let i = 0; i < count; i++) {
        let gap = 65 + Math.random() * (30 + diffFactor * 6);
        if (Math.random() > 0.85) {
            gap = 140 + Math.random() * 30;
            entities.push({ x: Math.random() * 700 + 50, y: currentY - gap / 2, type: 'powerup', radius: 15, vy: 0 });
        }
        currentY -= gap;
        let pWidth = Math.max(80, 140 - diffFactor * 8);
        let pX = Math.random() * (800 - pWidth);

        let plat = { x: pX, y: currentY, w: pWidth, h: 15, type: 'normal' };
        if (Math.random() > 0.5) {
            plat.type = 'moving';
            plat.speed = (Math.random() > 0.5 ? 1 : -1) + diffFactor * 0.1;
        }
        platforms.push(plat);
    }
}

function spawnEntities() {
    // 只在无尽模式生成能量道具，不生成炸弹
    if (gameState === 'ENDLESS' && Math.random() < 0.002) {
        entities.push({
            x: Math.random() * 700 + 50,
            y: -cameraY - 50,
            type: 'powerup',
            radius: 15,
            vy: 1.5
        });
    }
}

function updatePhysics() {
    if (gameState !== 'PLAYING' && gameState !== 'ENDLESS') return;

    cameraY += autoScrollSpeed;
    if (gameState === 'ENDLESS') {
        autoScrollSpeed = 1.0 + Math.floor(score / 1500) * 0.2;
    }

    if (player.superJumpTimer > 0) player.superJumpTimer--;
    if (player.stunTimer > 0) player.stunTimer--;

    if (player.stunTimer <= 0) {
        if (keys.a || keys.ArrowLeft) {
            player.vx -= MOVE_SPEED * 0.2;
            player.dir = -1;
        }
        if (keys.d || keys.ArrowRight) {
            player.vx += MOVE_SPEED * 0.2;
            player.dir = 1;
        }
    }

    player.vx *= FRICTION;
    player.vy += GRAVITY;

    if (keys.s || keys.ArrowDown) {
        player.vy += 1.5;
    }

    if (player.vx > MOVE_SPEED) player.vx = MOVE_SPEED;
    if (player.vx < -MOVE_SPEED) player.vx = -MOVE_SPEED;

    if ((keys.w || keys.ArrowUp || keys[' ']) && player.grounded && player.stunTimer <= 0) {
        player.vy = player.superJumpTimer > 0 ? SUPER_JUMP : BASE_JUMP;
        player.grounded = false;
    }

    player.y += player.vy;
    player.grounded = false;

    // Update platform behaviors based on level
    for (let i = platforms.length - 1; i >= 0; i--) {
        let p = platforms[i];
        
        let oldX = p.x;
        let oldY = p.y;
        
        if (currentLevel === 2 && p.type === 'descending') {
            // 第二关：所有阶梯缓慢下降
            p.y += p.descendSpeed;
        }
        
        if (currentLevel === 3 && p.type === 'moving') {
            // 第三关：移动阶梯（±100px范围）
            p.x += p.speed;
            if (p.x < p.originalX - p.moveRange || p.x + p.w > p.originalX + p.w + p.moveRange) {
                p.speed *= -1;
            }
        }
        
        if (currentLevel === 5 && p.type === 'fragile') {
            // 第五关：易碎阶梯
            if (p.touched) {
                p.breakTimer++;
                if (p.breakTimer > 150) { // 2500ms
                    platforms.splice(i, 1);
                    continue;
                }
            }
        }
        
        // 如果目标在这个平台上，同步更新目标位置
        if (goal && goal.platform === p) {
            goal.x += (p.x - oldX);
            goal.y += (p.y - oldY);
        }

        if ((keys.s || keys.ArrowDown) && p.type !== 'ground') continue;

        if (player.vy >= 0 &&
            player.x + player.w > p.x &&
            player.x < p.x + p.w &&
            player.y + player.h >= p.y &&
            player.y + player.h <= p.y + p.h + player.vy + 2) {

            player.y = p.y - player.h;
            player.vy = 0;
            player.grounded = true;

            if (p.type === 'moving') {
                player.x += p.speed;
            }
            
            if (currentLevel === 5 && p.type === 'fragile' && !p.touched) {
                p.touched = true;
            }
        }
    }

    player.x += player.vx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > 800) player.x = 800 - player.w;

    let targetCameraY = 400 - player.y;
    if (targetCameraY > cameraY) {
        cameraY = targetCameraY;
    }

    if (player.y > -cameraY + 620) {
        handleDeath();
        return;
    }

    // Weather system for level 4 & 5
    if (currentLevel === 4 || currentLevel === 5) {
        updateWeather();
    }

    spawnEntities();
    for (let i = entities.length - 1; i >= 0; i--) {
        let e = entities[i];
        e.y += e.vy;

        let cx = e.x;
        let cy = e.y;
        let testX = cx;
        let testY = cy;

        if (cx < player.x) testX = player.x;
        else if (cx > player.x + player.w) testX = player.x + player.w;
        if (cy < player.y) testY = player.y;
        else if (cy > player.y + player.h) testY = player.y + player.h;

        let distX = cx - testX;
        let distY = cy - testY;
        let distance = Math.sqrt((distX * distX) + (distY * distY));

        if (distance <= e.radius) {
            if (e.type === 'powerup') {
                player.superJumpTimer = 300;
                player.vy = SUPER_JUMP;
            }
            entities.splice(i, 1);
            continue;
        }

        if (e.y > -cameraY + 650) {
            entities.splice(i, 1);
        }
    }

    // Goal Check
    if (goal && gameState === 'PLAYING') {
        if (player.x < goal.x + goal.w &&
            player.x + player.w > goal.x &&
            player.y < goal.y + goal.h &&
            player.y + player.h > goal.y) {
            handleLevelComplete();
        }
    }

    if (gameState === 'ENDLESS') {
        score = Math.floor(cameraY);
        document.getElementById('score-display').textContent = `得分: ${score}`;

        let highestPlat = platforms[platforms.length - 1];
        if (highestPlat && highestPlat.y > -cameraY - 800) {
            generateEndlessPlatforms(highestPlat.y, 10);
        }
        platforms = platforms.filter(p => p.y < -cameraY + 800);
    }
}

function updateWeather() {
    // 第四关和第五关下雪
    if (currentLevel === 4 || currentLevel === 5) {
        // Generate snowflakes
        if (snowflakes.length < 50) {
            snowflakes.push({
                x: Math.random() * 800,
                y: -cameraY - 20,
                size: 6 + Math.random() * 8,
                speed: 0.8 + Math.random() * 1.5,
                sway: Math.random() * Math.PI * 2,
                rotation: Math.random() * Math.PI * 2
            });
        }

        // Update snowflakes
        for (let i = snowflakes.length - 1; i >= 0; i--) {
            let s = snowflakes[i];
            s.y += s.speed;
            s.x += Math.sin(s.sway + Date.now() / 500) * 0.5;
            s.sway += 0.02;
            s.rotation += 0.03;
            if (s.y > -cameraY + 650) {
                snowflakes.splice(i, 1);
            }
        }
    }

    // 只有第四关有冰雹
    if (currentLevel === 4) {
        // Generate hailstones every 2 seconds
        if (Date.now() - lastHailTime > 2000) {
            lastHailTime = Date.now();
            for (let i = 0; i < 5; i++) {
                hailstones.push({
                    x: Math.random() * 800,
                    y: -cameraY - 30 - Math.random() * 100,
                    size: 10 + Math.random() * 10,
                    speed: 1.5 + Math.random() * 1,
                    wobble: Math.random() * Math.PI * 2
                });
            }
        }
    }

    // Update hailstones and check collision
    for (let i = hailstones.length - 1; i >= 0; i--) {
        let h = hailstones[i];
        h.y += h.speed;
        h.x += Math.sin(h.wobble + Date.now() / 300) * 0.3; // 左右摆动
        h.wobble += 0.03;

        // Check collision with player
        if (h.x > player.x - h.size && h.x < player.x + player.w + h.size &&
            h.y > player.y - h.size && h.y < player.y + player.h + h.size) {
            hailstones.splice(i, 1);
            lives--;
            updateLivesDisplay();
            player.stunTimer = 30;
            if (lives <= 0) {
                handleDeath();
            }
            continue;
        }

        if (h.y > -cameraY + 650) {
            hailstones.splice(i, 1);
        }
    }
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
    ctx.scale(player.dir, 1);

    let glowColor = '#66ccff';
    if (player.stunTimer > 0) glowColor = '#ff6666';

    let legSwing = player.grounded && Math.abs(player.vx) > 0.5 ? Math.sin(Date.now() / 150) * 3 : 0;
    if (!player.grounded) legSwing = 1.5;

    // 跳跃时的发光效果
    if (!player.grounded) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = glowColor;
    }

    // 身体 - 圆润的大身体（主色调是浅绿色
    const bodyColor = '#7dd87d';
    const bodyLight = '#a8e6a8';
    const outlineColor = '#4a9c4a';

    // 大椭圆身体
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2.5;
    
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 腹部浅色
    ctx.fillStyle = bodyLight;
    ctx.beginPath();
    ctx.ellipse(0, 3, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 可爱的小斑点
    ctx.fillStyle = '#5cb85c';
    const spots = [
        [-12, -3, 3],
        [-5, -6, 2.5],
        [8, -4, 2.5],
        [4, 4, 2],
        [-8, 4, 2]
    ];
    for (let i = 0; i < spots.length; i++) {
        ctx.beginPath();
        ctx.arc(spots[i][0], spots[i][1], spots[i][2], 0, Math.PI * 2);
        ctx.fill();
    }

    // 长长的脖子（马门溪龙标志性的长脖子
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = outlineColor;
    ctx.beginPath();
    ctx.moveTo(10, -5);
    ctx.quadraticCurveTo(18, -18, 14, -25);
    ctx.quadraticCurveTo(10, -22, 12, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 可爱的小脑袋
    ctx.beginPath();
    ctx.ellipse(16, -28, 8, 6, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 萌萌的大眼睛
    // 眼白
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(18, -30, 4, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // 眼珠
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(19, -30, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // 高光
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(20, -31, 1, 0, Math.PI * 2);
    ctx.fill();

    // 微笑的小嘴巴
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(20, -26, 3, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // 腮红，让它更可爱
    ctx.fillStyle = 'rgba(255, 150, 150, 0.5)';
    ctx.beginPath();
    ctx.ellipse(14, -25, 2.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 可爱的小鼻孔
    ctx.fillStyle = outlineColor;
    ctx.beginPath();
    ctx.arc(21, -28, 0.8, 0, Math.PI * 2);
    ctx.arc(22, -27, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // 粗粗的尾巴（马门溪龙尾巴
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = outlineColor;
    ctx.beginPath();
    ctx.moveTo(-16, -2);
    ctx.quadraticCurveTo(-28 - legSwing, -5, -35, 2);
    ctx.quadraticCurveTo(-32 - legSwing, 8, -18, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 四条粗粗的小短腿
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2;

    // 前腿（用普通矩形代替圆角矩形
    ctx.beginPath();
    ctx.rect(5 - legSwing, 5, 6, 11);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(5 + legSwing, 5, 6, 11);
    ctx.fill();
    ctx.stroke();

    // 后腿
    ctx.beginPath();
    ctx.rect(-13 + legSwing, 5, 6, 11);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(-13 - legSwing, 5, 6, 11);
    ctx.fill();
    ctx.stroke();

    // 背上的可爱小三角形刺
    ctx.fillStyle = '#5cb85c';
    for (let i = 0; i < 5; i++) {
        let offset = -10 + i * 5;
        ctx.beginPath();
        ctx.moveTo(offset, -8);
        ctx.lineTo(offset - 2, -13);
        ctx.lineTo(offset + 2, -13);
        ctx.closePath();
        ctx.fill();
    }

    // 跳跃时的额外光环
    if (!player.grounded) {
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(102, 204, 255, ${0.25 + Math.sin(Date.now() / 200) * 0.15})`;
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    ctx.restore();
}

function drawEntities() {
    for (let e of entities) {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        if (e.type === 'powerup') {
            let glow = 5 + Math.sin(Date.now() / 150) * 5;
            ctx.shadowBlur = glow;
            ctx.shadowColor = '#00ffaa';
            ctx.fillStyle = '#00ffaa';
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '16px Arial';
            ctx.fillText('P', e.x, e.y);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(0, cameraY);

    // Draw weather (snowflakes for level 4 & 5, hailstones only for level 4)
    if (currentLevel === 4 || currentLevel === 5) {
        // Draw snowflakes (五角星形状)
        for (let s of snowflakes) {
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.rotation);
            
            // 发光效果
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffffff';
            
            // 绘制五角星
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                let angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                let x = Math.cos(angle) * s.size;
                let y = Math.sin(angle) * s.size;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                // 内凹点
                let innerAngle = angle + Math.PI / 5;
                let innerX = Math.cos(innerAngle) * (s.size * 0.4);
                let innerY = Math.sin(innerAngle) * (s.size * 0.4);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
        
        // Draw hailstones (只在第四关显示)
        if (currentLevel === 4) {
            for (let h of hailstones) {
                ctx.save();
                ctx.translate(h.x, h.y);
                
                // 发光效果
                ctx.shadowBlur = 25;
                ctx.shadowColor = '#88ccff';
                
                // 渐变色彩
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, h.size);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.4, '#aaeeff');
                gradient.addColorStop(0.8, '#66aacc');
                gradient.addColorStop(1, '#4488cc');
                ctx.fillStyle = gradient;
                
                // 绘制圆形
                ctx.beginPath();
                ctx.arc(0, 0, h.size, 0, Math.PI * 2);
                ctx.fill();
                
                // 高亮边缘
                ctx.strokeStyle = '#aaeeff';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // 内部高光
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.beginPath();
                ctx.arc(-h.size * 0.25, -h.size * 0.35, h.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
                
                // 第二层小高光
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.beginPath();
                ctx.arc(h.size * 0.2, h.size * 0.1, h.size * 0.15, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        }
    }

    // Draw platforms
    for (let p of platforms) {
        if (p.type === 'ground') {
            // Ground platform: solid dark style
            ctx.fillStyle = 'rgba(40, 40, 60, 0.75)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        } else if (p.type === 'moving') {
            // Moving platform: warm amber tint
            ctx.fillStyle = 'rgba(212, 175, 55, 0.35)';
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
        } else if (p.type === 'descending') {
            // Descending platform: blue tint
            ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
            ctx.strokeStyle = 'rgba(100, 150, 255, 0.7)';
        } else if (p.type === 'fragile') {
            // Fragile platform - 红色带警告符号
            if (p.touched) {
                let progress = p.breakTimer / 150;
                let alpha = 1 - progress;
                
                // 渐变色彩：从红色→深红
                let r = Math.floor(255);
                let g = Math.floor(80 - progress * 60);
                let b = Math.floor(80 - progress * 60);
                
                // 渐变填充
                const gradient = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
                gradient.addColorStop(0, `rgba(${r}, ${g + 30}, ${b + 30}, ${0.35 * alpha})`);
                gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${0.3 * alpha})`);
                gradient.addColorStop(1, `rgba(${r - 30}, ${g - 30}, ${b - 30}, ${0.25 * alpha})`);
                ctx.fillStyle = gradient;
                
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.85 * alpha})`;
            } else {
                // 未触碰时的红色渐变
                const gradient = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
                gradient.addColorStop(0, 'rgba(255, 120, 120, 0.35)');
                gradient.addColorStop(0.5, 'rgba(230, 80, 80, 0.3)');
                gradient.addColorStop(1, 'rgba(200, 60, 60, 0.25)');
                ctx.fillStyle = gradient;
                
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)';
            }
        } else {
            // Normal platform: cool blue-white glass
            ctx.fillStyle = 'rgba(180, 210, 255, 0.2)';
            ctx.strokeStyle = 'rgba(180, 210, 255, 0.55)';
        }
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 5);
        ctx.fill();
        ctx.stroke();
        
        // 绘制裂纹效果（只有易碎阶梯触碰后才显示）
        if (p.type === 'fragile' && p.touched) {
            let progress = p.breakTimer / 150;
            let crackAlpha = Math.min(1, progress * 2); // 裂纹逐渐加深
            
            ctx.save();
            ctx.strokeStyle = `rgba(0, 0, 0, ${0.6 * crackAlpha})`;
            ctx.lineWidth = 1 + progress * 2;
            ctx.lineCap = 'round';
            
            // 使用平台位置作为随机种子，让裂纹每次都一样
            let seed = Math.floor(p.x + p.y * 100);
            let random = (i) => {
                let x = Math.sin(seed + i) * 10000;
                return x - Math.floor(x);
            };
            
            // 绘制多条裂纹
            let numCracks = Math.floor(3 + progress * 4);
            for (let c = 0; c < numCracks; c++) {
                let startX = p.x + random(c * 10) * p.w;
                let startY = p.y + random(c * 10 + 1) * p.h;
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                
                let segments = Math.floor(3 + progress * 4);
                let x = startX, y = startY;
                for (let s = 0; s < segments; s++) {
                    let angle = random(c * 100 + s) * Math.PI * 2;
                    let len = (random(c * 100 + s + 1) * 0.3 + 0.2) * Math.min(p.w, p.h);
                    x += Math.cos(angle) * len;
                    y += Math.sin(angle) * len;
                    // 限制在平台内
                    x = Math.max(p.x, Math.min(p.x + p.w, x));
                    y = Math.max(p.y, Math.min(p.y + p.h, y));
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            
            ctx.restore();
        }
        
        // 绘制警告符号（只有易碎阶梯显示）
        if (p.type === 'fragile' && !p.touched) {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 14px sans-serif';
            
            // 闪烁效果
            let blink = 0.7 + Math.sin(Date.now() / 300) * 0.3;
            
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff6600';
            ctx.fillStyle = `rgba(255, 150, 0, ${blink})`;
            
            // 绘制警告符号
            const centerX = p.x + p.w / 2;
            const centerY = p.y + p.h / 2;
            ctx.fillText('⚠', centerX, centerY);
            
            ctx.restore();
        }
    }

    // Draw Goal (key image or fallback star)
    if (goal) {
        let bob = Math.sin(Date.now() / 200) * 5;
        const gx = goal.x;
        const gy = goal.y + bob;
        const gw = goal.w;
        const gh = goal.h;

        // Glow halo
        ctx.save();
        ctx.shadowBlur = 20 + Math.sin(Date.now() / 300) * 8;
        ctx.shadowColor = '#d4af37';
        ctx.fillStyle = 'rgba(212, 175, 55, 0.25)';
        ctx.beginPath();
        ctx.ellipse(gx + gw / 2, gy + gh / 2, gw * 0.8, gh * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const keyImg = keyImages[goal.itemIndex];
        if (keyImg && keyImg.complete && keyImg.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(gx, gy, gw, gh, 8);
            ctx.clip();
            ctx.drawImage(keyImg, gx, gy, gw, gh);
            ctx.restore();
            // Gold border
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(gx, gy, gw, gh, 8);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#d4af37';
            ctx.font = '32px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⭐', gx + gw / 2, gy + gh / 2);
        }
    }

    drawEntities();
    drawPlayer();

    // Death zone indicator
    let screenBottom = -cameraY + 600;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
    ctx.fillRect(0, screenBottom - 10, 800, 20);

    ctx.restore();
}

function handleDeath() {
    if (gameState === 'PLAYING') {
        // 关卡模式：摔落后立即重置关卡
        showModal('坠落', '你掉落了！需要重新挑战这一关。', '重新开始', () => {
            initLevel(currentLevel);
            lives = 5;
            updateLivesDisplay();
            gameState = 'PLAYING';
            hideModal();
        });
        gameState = 'GAME_OVER';
    } else if (gameState === 'ENDLESS') {
        // 无尽模式：正常生命逻辑
        if (lives > 0) {
            lives--;
            respawnPlayer();
            updateLivesDisplay();
        } else {
            showModal('游戏结束', `最终得分: ${score}<br>你能攀登得更高吗？`, '再试一次', () => {
                initLevel(6);
                lives = 5;
                updateLivesDisplay();
                gameState = 'ENDLESS';
                hideModal();
            });
            gameState = 'GAME_OVER';
        }
    }
}

function respawnPlayer() {
    // 直接在起始位置重生
    player.x = 400;
    player.y = 490;
    cameraY = 0;

    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    player.stunTimer = 0;
}

function updateLivesDisplay() {
    const livesEl = document.getElementById('lives-display');
    if (livesEl) {
        livesEl.textContent = `生命: ${'❤️'.repeat(lives)}${'🖤'.repeat(5 - lives)}`;
    }
}

// Update inventory slot to show key image
function updateInventorySlot(index) {
    const slot = document.getElementById(`item-${index}`);
    if (!slot) return;
    slot.innerHTML = '';
    const img = document.createElement('img');
    img.src = keyImagePaths[index];
    img.alt = `钥匙 ${index + 1}`;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '6px';
    slot.appendChild(img);
    slot.classList.add('filled');
}

function handleLevelComplete() {
    gameState = 'LEVEL_COMPLETE';

    if (collectedItems < 5) {
        updateInventorySlot(collectedItems);
        collectedItems++;
    }

    if (currentLevel < 5) {
        // 定义每一关的过渡文字
        const transitionTexts = {
            1: {
                title: '第一关 → 第二关',
                content: '山路初静，阶台始沉<br><br>愿成理少年，稳踏前路，从容启程'
            },
            2: {
                title: '第二关 → 第三关',
                content: '山阶游走，步履需准<br><br>步履从容不慌，成理学子自有定力'
            },
            3: {
                title: '第三关 → 第四关',
                content: '山巅起寒，风雪将至<br><br>纵遇风霜漫路，成理人皆迎难而上'
            },
            4: {
                title: '第四关 → 第五关',
                content: '山骨易碎，不可驻足<br><br>前路从不停歇，成理少年一往无前'
            }
        };
        
        const transition = transitionTexts[currentLevel];
        const nextLevel = currentLevel + 1;
        currentLevel++;
        
        showModal(transition.title, transition.content, `开始第${nextLevel}关`, () => {
            initLevel(currentLevel);
            gameState = 'PLAYING';
            hideModal();
        });
    } else {
        // All 5 keys collected — redirect to the target URL
        showModal('集齐所有钥匙！',
            '恭喜！你已经收集了所有5把钥匙并解锁了大门！<br><br>即将跳转到目的地...',
            '进入',
            () => {
                window.location.href = '../art_exhibition/index.html';
            });
    }
}

function showModal(title, text, btnText, callback) {
    document.getElementById('game-modal-container').style.display = 'flex';
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-text').innerHTML = text;

    let actions = document.getElementById('modal-actions');
    actions.innerHTML = '';
    let btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = btnText;
    btn.onclick = function() {
        // 播放背景音乐
        if (bgm.paused) {
            bgm.volume = 0.6;
            bgm.play().catch(err => console.log('Audio play error:', err));
        }
        callback();
    };
    actions.appendChild(btn);
}

function hideModal() {
    document.getElementById('game-modal-container').style.display = 'none';
}

function loop() {
    updatePhysics();
    draw();
    requestAnimationFrame(loop);
}

document.getElementById('start-btn').onclick = () => {
    // 播放背景音乐
    if (bgm.paused) {
        bgm.volume = 0.6;
        bgm.play().catch(err => console.log('Audio play error:', err));
    }
    initLevel(1);
    gameState = 'PLAYING';
    hideModal();
    canvas.focus();
};

// 音乐控制按钮
const musicBtn = document.getElementById('music-btn');
let isMuted = false;

musicBtn.onclick = () => {
    isMuted = !isMuted;
    bgm.muted = isMuted;
    musicBtn.textContent = isMuted ? '🔇' : '🎵';
};

loop();
