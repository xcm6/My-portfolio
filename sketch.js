let maze;
let rows = 20;
let cols = 20;
let cellSize = 20;
let player = { x: 1.5, y: 1.5, angle: 0, health: 100, sanity: 100 };
let weaponImage, reloadGif, enemyImage, bossImage, advancedEnemyImage;
let shootSound, hitSound, deathSound, whisperSound, backgroundMusic;

let maxAmmo = 7;
let currentAmmo = maxAmmo;
let reloading = false;
let showReloadGif = false;
let enemies = [];
let lastShotTime = 0;
let shotInterval = 300;
let shakeAmount = 0; // 控制画面晃动
let canDash = true; // 是否可以闪避
let dashDistance = 1; // 闪避距离
let redFlash = 0; // 控制红色闪烁效果
let sanityIncreaseRate = 0.5; // 快速恢复精神值
let hallucinationLevel = 0; // 幻觉效果级别

let bigBrotherMessages = [
  "BIG BROTHER IS WATCHING",
  "OBEY",
  "SUBMIT",
  "NO ESCAPE",
  "CONFORM",
  "SURVEILLANCE IS SAFETY",
  "TRUST US"
];

let gameState = "start"; // 游戏状态：start, playing, gameOver, nextLevel
let level = 1; // 当前关卡
let maxLevels = 10; // 最大关卡数
let killTarget = 5; // 第一关的击杀目标
let killCount = 0; // 当前击杀数量
let spawnEnemyCount = 50; // 第一关的敌人数量

// 过渡效果计时器
let transitionTimer = 0;
let transitionDuration = 2000; // 2秒
let nextLevelTextTimer = 0;
let showNextText = true;

// 狂暴模式相关变量
let berserkActive = false;
let berserkTimer = 0;
let berserkDuration = 5000; // 5秒
let berserkCooldown = 0;
let berserkCooldownDuration = 10000; // 10秒

function preload() {
  weaponImage = loadImage('weapon.png'); // 玩家武器图片
  reloadGif = loadImage('reload.gif'); // 换弹 GIF 动画
  enemyImage = loadImage('enemy.png'); // 敌人图片
  bossImage = loadImage('boss.png'); // Boss敌人图片
  advancedEnemyImage = loadImage('advanced_enemy.png'); // 高级敌人图片

  shootSound = loadSound('shoot.mp3'); // 射击声音
  hitSound = loadSound('hit.mp3'); // 敌人受伤声音
  deathSound = loadSound('death.mp3'); // 敌人死亡声音
  whisperSound = loadSound('whisper.mp3'); // 幻觉低语声音
  backgroundMusic = loadSound('backgroundMusic.mp3'); // 背景音乐
}

function setup() {
  createCanvas(800, 600);
  textFont('Impact'); // 使用 Impact 字体
  textAlign(CENTER, CENTER);
  textSize(20);
 
  if (backgroundMusic && backgroundMusic.isLoaded()) {
    backgroundMusic.setLoop(true);
    backgroundMusic.setVolume(0.5);
  }
}

function draw() {
  if (gameState === "start") {
    drawStartScreen();
  } else if (gameState === "playing") {
    gameLoop();
  } else if (gameState === "gameOver") {
    drawGameOverScreen();
  } else if (gameState === "nextLevel") {
    drawNextLevelScreen();
  }
}

function drawStartScreen() {
  background(0);
  fill(255);

  // 游戏标题
  textSize(60);
  text("GUN GAME", width / 2, height / 4);

  // 控制说明
  textSize(30);
  fill(200);
  let instructions = [
    "Controls:",
    "ENTER - Start Game",
    "SPACE - Shoot",
    "Arrow Keys - Move",
    "R - Reload",
    "SHIFT - Dash",
    "1 - Berserk Mode",
    "E - Execute Enemy"
  ];

  let startY = height / 2;
  instructions.forEach((instr, index) => {
    text(instr, width / 2, startY + index * 40);
  });
}

function drawGameOverScreen() {
  background(0);
  fill(255, 0, 0);

  // 游戏结束标题
  textSize(80);
  text("GAME OVER", width / 2, height / 2 - 50);

  // 重启提示
  fill(255);
  textSize(30);
  text("Press ENTER to Restart", width / 2, height / 2 + 50);
}

function drawNextLevelScreen() {
  applyVisualHallucinations();
  nextLevelTextTimer += deltaTime;
  if (nextLevelTextTimer > 500) {
    showNextText = !showNextText;
    nextLevelTextTimer = 0;
  }
  textSize(80);
  fill(showNextText ? 255 : 255, 0, 0);
  if (showNextText) {
    text("NEXT", width / 2, height / 2);
  } else {
    text("LEVEL", width / 2, height / 2);
  }
  transitionTimer += deltaTime;
  if (transitionTimer >= transitionDuration) {
    initializeLevel();
    gameState = "playing";
    transitionTimer = 0;
    showNextText = true;
  }
}

function keyPressed() {
  if (gameState === "start" && keyCode === ENTER) {
    startGame();
  } else if (gameState === "gameOver" && keyCode === ENTER) {
    restartGame();
  } else if (gameState === "playing") {
    if (key === 'r' || key === 'R') {
      reload(); // 按下 R 键触发换弹
    }
    if (key === '1') {
      activateBerserkMode(); // 按下 1 键激活狂暴模式
    }
    if (key === 'e' || key === 'E') {
      executeEnemy(); // 按下 E 键执行敌人
    }
    if (keyCode === SHIFT && canDash) {
      dash(); // 按下 Shift 键触发闪避
    }
    if (whisperSound && whisperSound.isLoaded() && !whisperSound.isPlaying()) {
      whisperSound.loop();
    }
  }
}

function mousePressed() {
  if (gameState === "playing") {
    if (whisperSound && whisperSound.isLoaded() && !whisperSound.isPlaying()) {
      whisperSound.loop();
    }
  }
}

function startGame() {
  gameState = "playing";
  level = 1;
  killTarget = 5; // 第一关击杀目标设为5
  killCount = 0;
  spawnEnemyCount = 50; // 第一关敌人数量设为50
  initializeLevel();
  // 开始播放背景音乐
  if (backgroundMusic && backgroundMusic.isLoaded()) {
    backgroundMusic.loop();
  }
}

function restartGame() {
  gameState = "playing";
  level = 1;
  killTarget = 5; // 第一关击杀目标设为5
  killCount = 0;
  spawnEnemyCount = 50; // 第一关敌人数量设为50
  player.health = 100;
  player.sanity = 100;
  berserkActive = false;
  berserkTimer = 0;
  berserkCooldown = 0;
  initializeLevel();
  // 重新播放背景音乐
  if (backgroundMusic && backgroundMusic.isLoaded()) {
    backgroundMusic.stop();
    backgroundMusic.loop();
  }
}

function initializeLevel() {
  // 每关增加迷宫大小和敌人数量
  rows = 20 + (level - 1) * 5;
  cols = 20 + (level - 1) * 5;

  // 根据关卡数选择不同的地图生成函数
  if (level === 3) {
    // 第三关是广场区域
    maze = generatePlaza(rows, cols);
  } else if (level === 4) {
    // 第四关是竞技场
    maze = generateArena(rows, cols);
  } else if (level === 5) {
    // 第五关是多层建筑
    maze = generateBuilding(rows, cols);
  } else {
    // 其他关卡生成迷宫
    maze = generateMaze(rows, cols);
  }
  console.log(`Maze for level ${level}:`);
  console.table(maze);

  player.x = 1.5;
  player.y = 1.5;
  player.angle = 0;
  player.health = 100;
  player.sanity = 100;
  enemies = [];
  spawnEnemies(spawnEnemyCount); // 根据当前关卡的敌人数量生成敌人
}

function gameLoop() {
  player.sanity = min(100, player.sanity + sanityIncreaseRate);
  hallucinationLevel = map(player.sanity, 100, 0, 0, 1);
  if (whisperSound && whisperSound.isLoaded()) {
    whisperSound.setVolume(hallucinationLevel * 0.5);
  }
  let bgColor = 100 + redFlash * 155;
  let distortion = random(-hallucinationLevel * 50, hallucinationLevel * 50);
  background(
    bgColor + distortion,
    100 - redFlash * 100 + distortion,
    100 - redFlash * 100 + distortion
  );
  redFlash = max(0, redFlash - 0.05); // 

  translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
  shakeAmount = max(0, shakeAmount - 0.1); 

  handleMovement(); // 移动
  handleShooting(); // 射击
  updateEnemies(); // 更新敌人状态
  handleBerserkMode(); 

  applyFilterBasedOnState(); 

  render3DView(); // 3D视角
  renderMiniMap(); // 小地图
  renderEnemies(); // 敌人
  drawWeaponOrReload(); // 显示武器或换弹动画
  displayAmmo(); // 显示子弹数
  displayPlayerHealth(); // 显示玩家血条
  displaySanity(); // 显示精神值
  displayKillCount(); // 显示剩余击杀目标
  displayLevel(); // 显示当前关卡数
  displayCooldownBar(); // 显示能力冷却条

  if (hallucinationLevel > 0.3) {
    applyVisualHallucinations();
  }

  // 检查游戏结束
  if (player.health <= 0) {
    gameState = "gameOver";
    // 停止背景音乐
    if (backgroundMusic && backgroundMusic.isPlaying()) {
      backgroundMusic.stop();
    }
  }

  // 检查关卡完成
  if (killCount >= killTarget) {
    if (level < maxLevels) {
      gameState = "nextLevel";
      level++;
      killTarget += 5; // 每关增加5个击杀目标
      spawnEnemyCount += 10; // 每关增加10个敌人
      // 不停止背景音乐，保持持续播放
    } else {
      // 游戏完成，显示游戏结束
      gameState = "gameOver";
      // 停止背景音乐
      if (backgroundMusic && backgroundMusic.isPlaying()) {
        backgroundMusic.stop();
      }
    }
  }
}

function dash() {
  canDash = false; // 禁止连续闪避
  let direction = keyIsDown(UP_ARROW)
    ? 1
    : keyIsDown(DOWN_ARROW)
    ? -1
    : 1;
  let dashX = player.x + cos(player.angle) * dashDistance * direction;
  let dashY = player.y + sin(player.angle) * dashDistance * direction;

  // 检查闪避目标位置是否在迷宫内且无墙壁阻挡
  if (
    dashX >= 0 &&
    dashX < cols &&
    dashY >= 0 &&
    dashY < rows &&
    maze[floor(dashY)][floor(dashX)] === 0
  ) {
    player.x = dashX;
    player.y = dashY;
  }

  shakeAmount = 2; // 机械感闪避轻微晃动
  setTimeout(() => (canDash = true), 1000); // 1秒后允许再次闪避
}

// 处理移动逻辑
function handleMovement() {
  let moveSpeed = berserkActive ? 0.02 : 0.01; // 狂暴模式下速度加倍
  let turnSpeed = berserkActive ? 0.07 : 0.05; // 狂暴模式下转向加快
  if (keyIsDown(UP_ARROW)) {
    let newX = player.x + Math.cos(player.angle) * moveSpeed;
    let newY = player.y + Math.sin(player.angle) * moveSpeed;
    if (
      newX >= 0 &&
      newX < cols &&
      newY >= 0 &&
      newY < rows &&
      maze[floor(newY)][floor(newX)] === 0
    ) {
      player.x = newX;
      player.y = newY;
    }
  }
  if (keyIsDown(DOWN_ARROW)) {
    let newX = player.x - Math.cos(player.angle) * moveSpeed;
    let newY = player.y - Math.sin(player.angle) * moveSpeed;
    if (
      newX >= 0 &&
      newX < cols &&
      newY >= 0 &&
      newY < rows &&
      maze[floor(newY)][floor(newX)] === 0
    ) {
      player.x = newX;
      player.y = newY;
    }
  }
  if (keyIsDown(LEFT_ARROW)) {
    player.angle -= turnSpeed;
  }
  if (keyIsDown(RIGHT_ARROW)) {
    player.angle += turnSpeed;
  }
}

// 处理射击逻辑
function handleShooting() {
  if (keyIsDown(32) && millis() - lastShotTime > shotInterval) {
    // 空格键射击
    if (currentAmmo > 0) {
      shoot();
      lastShotTime = millis(); // 记录射击时间
    } else if (!reloading) {
      reload(); // 自动换弹
    }
  }
}

function updateEnemies() {
  enemies.forEach((enemy, index) => {
    let dx = player.x - enemy.x;
    let dy = player.y - enemy.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0.5 && distance < 5) {
      let angleToPlayer = atan2(dy, dx);
      let enemyMoveSpeed = enemy.speed; 
      let newEnemyX = enemy.x + cos(angleToPlayer) * enemyMoveSpeed;
      let newEnemyY = enemy.y + sin(angleToPlayer) * enemyMoveSpeed;
      if (level === 4 || level === 5) {
      }

      if (
        newEnemyX >= 0 &&
        newEnemyX < cols &&
        newEnemyY >= 0 &&
        newEnemyY < rows &&
        maze[floor(newEnemyY)][floor(newEnemyX)] === 0
      ) {
        enemy.x = newEnemyX;
        enemy.y = newEnemyY;
      }
    }
    if (
      distance < 0.5 &&
      !isPathBlocked(player.x, player.y, enemy.x, enemy.y)
    ) {
      player.health -= enemy.attackDamage;
      shakeAmount = 5; 
      redFlash = 1; 
      player.sanity = max(0, player.sanity - enemy.sanityDamage); 
    }
  });
}

function render3DView() {
  for (let i = 0; i < width; i++) {
    let angle = player.angle - PI / 4 + (i / width) * (PI / 2);
    let distance = castRay(angle);
    let lineHeight = map(distance, 0, 5, height, 0);
    stroke(0);
    line(
      i,
      height / 2 - lineHeight / 2,
      i,
      height / 2 + lineHeight / 2
    );
  }
}

function renderMiniMap() {
  let mapSize = cellSize * 0.5;
  push();
  translate(width - cols * mapSize - 10, 10);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      fill(maze[y][x] === 1 ? 50 : 200);
      rect(x * mapSize, y * mapSize, mapSize, mapSize);
    }
  }
  fill(255, 0, 0);
  ellipse(player.x * mapSize, player.y * mapSize, mapSize * 0.5);
  pop();
}

// 渲染敌人
function renderEnemies() {
  enemies.forEach((enemy) => {
    if (!isPathBlocked(player.x, player.y, enemy.x, enemy.y)) {
      let dx = enemy.x - player.x;
      let dy = enemy.y - player.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      let angleToEnemy = atan2(dy, dx) - player.angle;
      if (distance < 5 && abs(angleToEnemy) < PI / 4) {
        let size = map(distance, 0, 5, 150, 50); 
        let enemyX = width / 2 + tan(angleToEnemy) * width / 2;
        let enemyY = height / 2 + size / 2; 
        push();
        translate(enemyX, enemyY);
        rotate(random(-hallucinationLevel * 0.1, hallucinationLevel * 0.1));
        scale(1 + random(-hallucinationLevel * 0.2, hallucinationLevel * 0.2));

        // 绘制敌人图像
        if (enemy.type === 'boss') {
          image(bossImage, 0, 0, size, size);
        } else if (enemy.type === 'advanced') {
          image(advancedEnemyImage, 0, 0, size, size);
        } else {
          image(enemyImage, 0, 0, size, size);
        }

        pop();

        // 绘制血条
        let healthBarWidth = size * 0.8;
        let healthBarX = enemyX - healthBarWidth / 2;
        let healthBarY = enemyY - size * 0.6; 
        let healthBarHeight = 8;

        fill(255, 0, 0);
        rect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        fill(0, 255, 0);
        rect(
          healthBarX,
          healthBarY,
          healthBarWidth * (enemy.health / enemy.maxHealth),
          healthBarHeight
        );

        // 绘制锁定框和距离
        drawLockOnFrame(enemyX, enemyY, distance);
      }
    }
  });
}

function drawLockOnFrame(enemyX, enemyY, distance) {
  push();
  translate(enemyX, enemyY);

  let blinkSpeed = 10; 
  let alphaValue = map(sin(frameCount / blinkSpeed), -1, 1, 100, 255);

  stroke(0, 255, 0, alphaValue); 
  strokeWeight(2);
  noFill();

  let frameSize = 50; // 取景框的尺寸
  let cornerLength = 10; // 角标的长度

  line(-frameSize / 2, -frameSize / 2, -frameSize / 2 + cornerLength, -frameSize / 2);
  line(-frameSize / 2, -frameSize / 2, -frameSize / 2, -frameSize / 2 + cornerLength);

  line(frameSize / 2, -frameSize / 2, frameSize / 2 - cornerLength, -frameSize / 2);
  line(frameSize / 2, -frameSize / 2, frameSize / 2, -frameSize / 2 + cornerLength);

  line(-frameSize / 2, frameSize / 2, -frameSize / 2 + cornerLength, frameSize / 2);
  line(-frameSize / 2, frameSize / 2, -frameSize / 2, frameSize / 2 - cornerLength);

  line(frameSize / 2, frameSize / 2, frameSize / 2 - cornerLength, frameSize / 2);
  line(frameSize / 2, frameSize / 2, frameSize / 2, frameSize / 2 - cornerLength);

  stroke(0, 255, 0, alphaValue / 2); 
  line(0, -frameSize / 2, 0, frameSize / 2); 
  line(-frameSize / 2, 0, frameSize / 2, 0);
  // 绘制距离文本在取景框右侧
  noStroke();
  fill(255);
  textSize(14);
  textAlign(LEFT, CENTER);
  text(`${distance.toFixed(1)}m`, frameSize / 2 + 15, 0); 

  pop();
}
function spawnEnemies(count) {
  let attempts = 0;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = floor(random(1, cols - 1));
      y = floor(random(1, rows - 1));
      attempts++;
    } while (
      maze[y][x] !== 0 ||
      isInSafeZone(x + 0.5, y + 0.5, player.x, player.y, 3) || 
      attempts > count * 10
    );
    if (
      maze[y][x] === 0 &&
      !isInSafeZone(x + 0.5, y + 0.5, player.x, player.y, 3)
    ) {
      // Determine enemy type based on level and special conditions
      let enemyType = 'normal';
      if (isBossLevel(level)) {
        enemyType = 'boss';
      } else if (level > 4 && floor(random(0, 5)) === 0) { // 20% chance to spawn advanced enemy after level 4
        enemyType = 'advanced';
      }

      // Set enemy properties based on type
      let enemy = { x: x + 0.5, y: y + 0.5, health: 3, type: enemyType };
      if (enemyType === 'boss') {
        enemy.maxHealth = 10;
        enemy.health = enemy.maxHealth;
        enemy.speed = 0.005;
        enemy.attackDamage = 0.5;
        enemy.sanityDamage = 2;
      } else if (enemyType === 'advanced') {
        enemy.maxHealth = 3;
        enemy.speed = 0.015; // Faster than normal
        enemy.attackDamage = 0.2;
        enemy.sanityDamage = 1;
      } else {
        enemy.maxHealth = 3;
        enemy.speed = 0.007;
        enemy.attackDamage = 0.1;
        enemy.sanityDamage = 1;
      }

      enemies.push(enemy);
    }
  }
}

// 判断当前关卡是否为Boss关卡（每三个关卡一个Boss关）
function isBossLevel(currentLevel) {
  return currentLevel % 3 === 0;
}

// 判断敌人是否在安全区内
function isInSafeZone(ex, ey, px, py, radius) {
  let d = dist(ex, ey, px, py);
  return d < radius;
}

// 控制武器或换弹动画的显示
function drawWeaponOrReload() {
  let weaponWidth = weaponImage.width * 0.5;
  let weaponHeight = weaponImage.height * 0.5;
  imageMode(CENTER);

  if (showReloadGif) {
    image(
      reloadGif,
      width / 2,
      height - weaponHeight / 2,
      weaponWidth,
      weaponHeight
    );
  } else {
    push();
    translate(width / 2, height - weaponHeight / 2);
    rotate(random(-hallucinationLevel * 0.1, hallucinationLevel * 0.1));
    scale(1 + random(-hallucinationLevel * 0.2, hallucinationLevel * 0.2));
    image(weaponImage, 0, 0, weaponWidth, weaponHeight);
    pop();
  }
}

function displayAmmo() {
  fill(255);
  textSize(20);
  textFont('Impact'); // 使用 Impact 字体
  textAlign(LEFT, TOP);
  text(`Ammo: ${currentAmmo} / ∞`, 20, height - 20);
}

function displayPlayerHealth() {
  fill(255, 0, 0);
  rect(width - 120, height - 30, 100, 20);
  fill(0, 255, 0);
  rect(width - 120, height - 30, player.health, 20);
}

function displaySanity() {
  fill(255);
  textSize(20);
  textFont('Impact'); // 使用 Impact 字体
  textAlign(LEFT, TOP);
  text(`Sanity: ${floor(player.sanity)}%`, 20, height - 50);
}

function displayKillCount() {
  fill(255);
  textSize(20);
  textFont('Impact'); // 使用 Impact 字体
  textAlign(RIGHT, TOP);
  text(`Kills: ${killCount} / ${killTarget}`, width - 20, height - 80);
}

function displayLevel() {
  fill(255);
  textSize(24);
  textFont('Impact'); // 使用 Impact 字体
  textAlign(LEFT, TOP);
  text(`Level: ${level}`, 20, 20);
}
function applyVisualHallucinations() {
  let numGlitches = floor(hallucinationLevel * 10);
  for (let i = 0; i < numGlitches; i++) {
    let x = random(width);
    let y = random(height);
    let w = random(10, 50);
    let h = random(10, 50);
    copy(
      x,
      y,
      w,
      h,
      x + random(-20, 20),
      y + random(-20, 20),
      w,
      h
    );
  }
  let messageIndex = floor(random(bigBrotherMessages.length));
  let message = bigBrotherMessages[messageIndex];
  fill(255, 0, 0, hallucinationLevel * 255); 
  textSize(80);
  textFont('Impact'); // 使用 Impact 字体
  textAlign(CENTER, CENTER);
  text(
    message,
    width / 2 + random(-hallucinationLevel * 10, hallucinationLevel * 10),
    height / 2 + random(-hallucinationLevel * 10, hallucinationLevel * 10)
  );
}

function castRay(angle) {
  let sinVal = Math.sin(angle);
  let cosVal = Math.cos(angle);
  for (let dist = 0; dist < 5; dist += 0.1) {
    let x = player.x + cosVal * dist;
    let y = player.y + sinVal * dist;

    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      if (maze[floor(y)][floor(x)] === 1) return dist;
    } else {
      return dist;
    }
  }
  return 5;
}

function isPathBlocked(x1, y1, x2, y2) {
  let dx = x2 - x1;
  let dy = y2 - y1;
  let steps = max(abs(dx), abs(dy)) * 10;
  for (let i = 0; i <= steps; i++) {
    let x = x1 + (dx * i) / steps;
    let y = y1 + (dy * i) / steps;

    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      if (maze[floor(y)][floor(x)] === 1) return true;
    }
  }
  return false;
}

// 射击并检查敌人死亡
function shoot() {
  currentAmmo--;
  if (shootSound && shootSound.isLoaded()) {
    shootSound.play();
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    if (
      !isPathBlocked(player.x, player.y, enemy.x, enemy.y) &&
      dist(player.x, player.y, enemy.x, enemy.y) < 3
    ) {
      enemy.health--;
      if (hitSound && hitSound.isLoaded()) {
        hitSound.play();
      }
      if (enemy.health <= 0) {
        if (deathSound && deathSound.isLoaded()) {
          deathSound.play(); // 播放敌人死亡声音
        }
        enemies.splice(i, 1); // 删除敌人
        killCount++; // 增加击杀数量
      }
    }
  }
  if (currentAmmo <= 0) {
    reload();
  }
}

function reload() {
  if (!reloading) {
    reloading = true;
    showReloadGif = true; // 显示换弹 GIF 动画

    setTimeout(() => {
      currentAmmo = maxAmmo; // 重置弹药
      reloading = false;
      showReloadGif = false; // 停止显示 GIF 动画
    }, 1000); 
  }
}

// 激活狂暴模式
function activateBerserkMode() {
  if (!berserkActive && berserkCooldown <= 0) {
    berserkActive = true;
    berserkTimer = berserkDuration;
    berserkCooldown = berserkCooldownDuration;
    // 可选：播放狂暴模式启动音效
    // playBerserkSound();
  }
}

// 处理狂暴模式状态
function handleBerserkMode() {
  if (berserkActive) {
    berserkTimer -= deltaTime;
    if (berserkTimer <= 0) {
      berserkActive = false;
      berserkTimer = 0;
    }
  }

  if (berserkCooldown > 0) {
    berserkCooldown -= deltaTime;
    if (berserkCooldown < 0) berserkCooldown = 0;
  }
}

// 执行敌人（按 E 键）
function executeEnemy() {
  // 查找所有靠近的敌人
  let executeRadius = 1; // 执行距离
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    let d = dist(player.x, player.y, enemy.x, enemy.y);
    if (d < executeRadius) {
      // 撕碎敌人
      killCount++;
      enemies.splice(i, 1);
      if (deathSound && deathSound.isLoaded()) {
        deathSound.play(); // 播放敌人死亡声音
      }
    }
  }
}

// 显示能力冷却条
function displayCooldownBar() {
  let barWidth = 20;
  let barHeight = 100;
  let x = 30;
  let y = 100;

  // 背景条
  fill(50);
  rect(x, y, barWidth, barHeight);

  // 冷却条高度
  let cooldownHeight = map(berserkCooldown, 0, berserkCooldownDuration, barHeight, 0);
  fill(0, 0, 255); // 蓝色冷却条
  rect(x, y, barWidth, cooldownHeight);

  // 边框
  noFill();
  stroke(255);
  rect(x, y, barWidth, barHeight);
  noStroke();

  // 标签
  fill(255);
  textSize(12);
  textAlign(CENTER, TOP);
  text("Berserk", x + barWidth / 2, y + barHeight + 10);
}

// 切换滤镜（根据狂暴模式）
function applyFilterBasedOnState() {
  if (berserkActive) {
    filter(POSTERIZE, 3);
    noStroke();
    fill(255, 0, 0, 50); // 半透明红色
    rect(0, 0, width, height);
  } else {
  }
}

// 生成迷宫函数
function generateMaze(rows, cols) {
  // 初始化迷宫，1 表示墙，0 表示路径
  let maze = Array(rows)
    .fill()
    .map(() => Array(cols).fill(1));

  // 递归函数
  function carve(x, y) {
    const directions = shuffle([
      [0, -2],
      [0, 2],
      [-2, 0],
      [2, 0]
    ]);

    for (let [dx, dy] of directions) {
      let nx = x + dx;
      let ny = y + dy;

      if (
        nx > 0 &&
        nx < cols &&
        ny > 0 &&
        ny < rows &&
        maze[ny][nx] === 1
      ) {
        maze[y + dy / 2][x + dx / 2] = 0; // 开凿墙壁
        maze[ny][nx] = 0; // 开凿路径
        carve(nx, ny); // 递归
      }
    }
  }

  // 从起点开始开凿
  maze[1][1] = 0;
  carve(1, 1);

  return maze;
}

// 生成广场区域的地图
function generatePlaza(rows, cols) {
  // 初始化广场，1 表示墙，0 表示路径
  let maze = Array(rows)
    .fill()
    .map(() => Array(cols).fill(0)); // 广场区域大部分为开放空间

  // 创建外围墙
  for (let y = 0; y < rows; y++) {
    maze[y][0] = 1;
    maze[y][cols - 1] = 1;
  }
  for (let x = 0; x < cols; x++) {
    maze[0][x] = 1;
    maze[rows - 1][x] = 1;
  }

  let centerX = floor(cols / 2);
  let centerY = floor(rows / 2);
  maze[centerY][centerX] = 1; 

  let statueOffset = floor(min(rows, cols) / 4);
  maze[statueOffset][statueOffset] = 1;
  maze[statueOffset][cols - 1 - statueOffset] = 1;
  maze[rows - 1 - statueOffset][statueOffset] = 1;
  maze[rows - 1 - statueOffset][cols - 1 - statueOffset] = 1;

  return maze;
}


function generateArena(rows, cols) {
  let maze = Array(rows)
    .fill()
    .map(() => Array(cols).fill(0)); // 大部分为开放空间

  for (let y = 0; y < rows; y++) {
    maze[y][0] = 1;
    maze[y][cols - 1] = 1;
  }
  for (let x = 0; x < cols; x++) {
    maze[0][x] = 1;
    maze[rows - 1][x] = 1;
  }

  let midX = floor(cols / 2);
  let midY = floor(rows / 2);
  maze[midY][midX] = 1;

  for (let i = 1; i < rows - 1; i++) {
    maze[i][midX] = 1;
    maze[midY][i] = 1;
  }
 for (let i = 0; i < floor(rows * cols * 0.1); i++) { // 10% 的障碍物
    let x = floor(random(1, cols - 1));
    let y = floor(random(1, rows - 1));
    maze[y][x] = 1;
  }

  return maze;
}

// 生成多层建筑的地图
function generateBuilding(rows, cols) {
  // 初始化多层建筑，1 表示墙，0 表示路径
  let maze = Array(rows)
    .fill()
    .map(() => Array(cols).fill(1)); // 默认全为墙壁

  // 定义多个楼层的入口和出口
  let numFloors = 3;
  let floorHeight = floor(rows / numFloors);

  for (let floor = 0; floor < numFloors; floor++) {
    let yStart = floor * floorHeight + 1;
    let yEnd = (floor + 1) * floorHeight - 1;

    // 开放每层的部分区域
    for (let y = yStart; y <= yEnd; y++) {
      for (let x = 1; x < cols - 1; x++) {
        // 随机开凿通道
        if (random(1) > 0.7) {
          maze[y][x] = 0;
        }
      }
    }

    // 创建楼层间的楼梯（垂直通道）
    let stairX = floor(cols / 2);
    for (let y = yStart; y <= yEnd; y++) {
      maze[y][stairX] = 0;
    }
  }

  return maze;
}
