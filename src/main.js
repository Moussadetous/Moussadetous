import * as THREE from 'three';
import './style.css';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#world');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xaac8b3, 0.0065);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.17;
renderer.shadowMap.enabled = false;

const camera = new THREE.PerspectiveCamera(49, window.innerWidth / window.innerHeight, 0.1, 260);
const clock = new THREE.Clock();
const world = new THREE.Group();
scene.add(world);

const hemiLight = new THREE.HemisphereLight(0xe9f5d9, 0x4b5140, 1.75);
scene.add(hemiLight);
const sunLight = new THREE.DirectionalLight(0xffe2ad, 2.35);
sunLight.position.set(-18, 34, -16);
scene.add(sunLight);
const skyFill = new THREE.DirectionalLight(0xb6eadb, 0.65);
skyFill.position.set(15, 15, 25);
scene.add(skyFill);

let seed = 71831;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
function range(min, max) { return min + random() * (max - min); }
function color(hex) { return new THREE.Color(hex); }

function makeBarkTexture() {
  const canvasTex = document.createElement('canvas');
  canvasTex.width = 512;
  canvasTex.height = 512;
  const ctx = canvasTex.getContext('2d');
  const base = ctx.createLinearGradient(0, 0, 512, 0);
  base.addColorStop(0, '#50372b');
  base.addColorStop(.22, '#76523a');
  base.addColorStop(.45, '#4d3529');
  base.addColorStop(.72, '#896344');
  base.addColorStop(1, '#543b2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 680; i++) {
    const x = random() * 512;
    const y = random() * 512;
    const h = range(10, 145);
    const w = range(.4, 3.8);
    const alpha = range(.025, .17);
    ctx.strokeStyle = random() > .52 ? `rgba(29,20,15,${alpha})` : `rgba(218,172,116,${alpha * .9})`;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + range(-10, 10), y + h * .32, x + range(-9, 9), y + h * .71, x + range(-7, 7), y + h);
    ctx.stroke();
  }
  for (let i = 0; i < 24; i++) {
    const x = range(14, 498), y = range(14, 498), rx = range(3, 11), ry = range(8, 22);
    ctx.strokeStyle = `rgba(31,22,17,${range(.15, .31)})`;
    ctx.lineWidth = range(1, 2.6);
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, range(-.25, .25), 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(213,169,115,.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x - 1.5, y - 2, rx * .48, ry * .6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvasTex);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  return texture;
}

function makeMossTexture() {
  const canvasTex = document.createElement('canvas');
  canvasTex.width = canvasTex.height = 256;
  const ctx = canvasTex.getContext('2d');
  ctx.fillStyle = '#65775b';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3200; i++) {
    const hue = random() > .5 ? 93 : 112;
    const light = Math.round(range(31, 56));
    ctx.fillStyle = `hsla(${hue}, ${Math.round(range(18, 37))}%, ${light}%, ${range(.08, .42)})`;
    const r = range(.4, 3.4);
    ctx.beginPath();
    ctx.ellipse(random() * 256, random() * 256, r * 1.6, r, range(0, Math.PI), 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvasTex);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 7);
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
  return texture;
}

function makeGlowTexture() {
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 128;
  const ctx = glowCanvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 1, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,231,1)');
  grad.addColorStop(.12, 'rgba(255,243,182,.95)');
  grad.addColorStop(.35, 'rgba(252,215,120,.42)');
  grad.addColorStop(1, 'rgba(249,206,103,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(glowCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const barkTexture = makeBarkTexture();
const mossTexture = makeMossTexture();
const glowTexture = makeGlowTexture();
const barkMaterial = new THREE.MeshStandardMaterial({ map: barkTexture, roughness: .93, metalness: 0, color: 0xffffff });
const barkDarkMaterial = new THREE.MeshStandardMaterial({ map: barkTexture, roughness: .96, color: 0x8a765f });
const rootMaterial = new THREE.MeshStandardMaterial({ map: barkTexture, roughness: .96, color: 0x9b7954 });
const mossMaterial = new THREE.MeshStandardMaterial({ map: mossTexture, roughness: 1, color: 0xb0aa7f });

function createSky() {
  const geometry = new THREE.SphereGeometry(170, 32, 20);
  const positions = geometry.attributes.position;
  const colors = [];
  const top = color(0x82bcb9);
  const middle = color(0xb5d4c4);
  const horizon = color(0xf0dcad);
  for (let i = 0; i < positions.count; i++) {
    const y = THREE.MathUtils.clamp(positions.getY(i) / 170, -1, 1);
    const t = THREE.MathUtils.smoothstep(y, -.22, .74);
    const c = y < .18
      ? horizon.clone().lerp(middle, THREE.MathUtils.smoothstep(y, -.22, .18))
      : middle.clone().lerp(top, THREE.MathUtils.smoothstep(y, .18, .74));
    const haze = 1 - t;
    c.lerp(horizon, Math.max(0, haze - .44) * .22);
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const sky = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
  scene.add(sky);

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(3.1, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0xffe8b2, fog: false })
  );
  sun.position.set(-27, 31, -54);
  scene.add(sun);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: 0xffdf9a, transparent: true, depthWrite: false, opacity: .45, fog: false }));
  halo.position.copy(sun.position);
  halo.scale.set(25, 25, 1);
  scene.add(halo);
}
createSky();

function createGround() {
  const geometry = new THREE.PlaneGeometry(240, 240, 72, 72);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), z = position.getY(i);
    const hill = Math.sin(x * .041 + .8) * .43 + Math.cos(z * .036 - .4) * .36 + Math.sin((x + z) * .022) * .62;
    position.setZ(i, -2.0 + hill);
  }
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: mossTexture, roughness: 1, color: 0x9bad82 }));
  ground.position.y = 0;
  ground.position.z = 25;
  world.add(ground);
}
createGround();

function createTrunk() {
  const rows = 64, around = 48, height = 29;
  const positions = [], uvs = [], indices = [], colors = [];
  const low = color(0x756046), high = color(0xbaa078);
  for (let iy = 0; iy <= rows; iy++) {
    const t = iy / rows;
    const y = height * t;
    let radius = 1.0 + 2.52 * Math.pow(1 - t, 1.17) + .36 * Math.exp(-y * .63);
    const centerX = .16 * Math.sin(t * 5.4);
    const centerZ = .13 * Math.sin(t * 4.1 + .8);
    for (let j = 0; j <= around; j++) {
      const a = (j / around) * Math.PI * 2;
      const rib = 1 + .025 * Math.sin(a * 9 + t * 7) + .014 * Math.sin(a * 17 - t * 15) + .009 * Math.cos(a * 5 + t * 23);
      const r = radius * rib;
      positions.push(centerX + Math.cos(a) * r, y, centerZ + Math.sin(a) * r);
      uvs.push(j / around, 1 - t);
      const shade = .83 + .11 * Math.sin(a * 6 + t * 8) + .055 * Math.sin(a * 13 - t * 17);
      const c = low.clone().lerp(high, t * .65).multiplyScalar(shade);
      colors.push(c.r, c.g, c.b);
      if (iy < rows && j < around) {
        const a0 = iy * (around + 1) + j;
        const b0 = a0 + around + 1;
        indices.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const trunkMat = new THREE.MeshStandardMaterial({ map: barkTexture, vertexColors: true, roughness: .96, side: THREE.DoubleSide });
  const trunk = new THREE.Mesh(geometry, trunkMat);
  trunk.position.y = 0;
  world.add(trunk);

  // Deep vertical grooves catch the soft morning light and help the trunk read as an enormous, living surface.
  for (let i = 0; i < 13; i++) {
    const angle = (i / 13) * Math.PI * 2 + .12;
    const pts = [];
    for (let j = 0; j <= 14; j++) {
      const t = .08 + j / 14 * .87;
      const y = t * height;
      const r = 1.0 + 2.52 * Math.pow(1 - t, 1.17) + .36 * Math.exp(-y * .63);
      const a = angle + Math.sin(t * 13 + i) * .025;
      pts.push(new THREE.Vector3(Math.cos(a) * r * 1.001, y, Math.sin(a) * r * 1.001));
    }
    const groove = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, i % 3 === 0 ? .027 : .016, 4, false),
      new THREE.MeshStandardMaterial({ color: i % 2 ? 0x3e2d22 : 0xa47b50, roughness: 1, transparent: true, opacity: .48 }));
    world.add(groove);
  }
}
createTrunk();

const navTracks = [];
const leafMeshes = [];
const landmarkPoints = [];
const barkKnots = [];

function makeBranchCurve(points) {
  return new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal', .35);
}

function addBranch({ name, zone, points, radius, walkable = true, material = barkMaterial, detail = true }) {
  const curve = makeBranchCurve(points);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(20, points.length * 12), radius, 10, false), material);
  tube.castShadow = false;
  tube.receiveShadow = false;
  world.add(tube);
  if (detail) {
    const start = curve.getPointAt(.06);
    const end = curve.getPointAt(.88);
    const knotGeo = new THREE.SphereGeometry(1, 10, 8);
    const startKnot = new THREE.Mesh(knotGeo, barkDarkMaterial);
    startKnot.position.copy(start);
    startKnot.scale.setScalar(radius * 1.06);
    world.add(startKnot);
    const endKnot = new THREE.Mesh(knotGeo, barkDarkMaterial);
    endKnot.position.copy(end);
    endKnot.scale.setScalar(radius * .72);
    world.add(endKnot);
  }
  if (walkable) {
    const samples = Math.max(20, points.length * 15);
    let previous = curve.getPointAt(0);
    for (let i = 1; i <= samples; i++) {
      const next = curve.getPointAt(i / samples);
      navTracks.push({
        a: previous.clone(), b: next.clone(), radius, name, zone,
        width: radius * .76 + .12,
      });
      previous = next;
    }
  }
  return curve;
}

// Buttress roots fan out beneath the great trunk; two are wide enough for Miette to follow down into the earth.
addBranch({ name: 'racines', zone: 'roots', points: [[0, 2.7, 1.4], [-1.1, 1.7, 2.8], [-2.7, .62, 4.8], [-4.7, -.42, 6.5]], radius: .72, walkable: false, material: rootMaterial });
addBranch({ name: 'racines', zone: 'roots', points: [[0, 2.2, 1.2], [1.8, 1.3, 2.7], [3.7, .52, 4.3], [5.2, -.5, 5.5]], radius: .8, walkable: false, material: rootMaterial });
addBranch({ name: 'racines', zone: 'roots', points: [[-.4, 1.4, -.7], [-2.1, .7, -1.8], [-4.4, -.45, -2.5]], radius: .63, walkable: false, material: rootMaterial });
addBranch({ name: 'racines', zone: 'roots', points: [[.3, 1.5, -.2], [1.8, .6, -1.7], [4.0, -.42, -2.5]], radius: .65, walkable: false, material: rootMaterial });

// The walkable boughs form a soft, branching trail: down to the roots, out over the canopy, and toward lantern flowers.
addBranch({ name: 'tronc', zone: 'heart', points: [[0, 6.36, .25], [0, 6.48, 1.8], [.12, 6.55, 3.4], [.42, 6.78, 5.1]], radius: .95 });
addBranch({ name: 'rampe racines', zone: 'roots', points: [[.12, 6.48, 2.48], [-.9, 6.05, 2.42], [-1.95, 4.65, 1.45], [-2.65, 2.8, .15], [-3.1, 1.55, 1.1], [-2.7, 1.02, 3.15], [-1.05, .83, 4.55], [.65, .95, 4.4], [1.85, 1.45, 2.65]], radius: .68 });
addBranch({ name: 'mer de feuilles', zone: 'leaves', points: [[.39, 6.78, 5.0], [.25, 7.0, 6.7], [-.5, 7.35, 8.45], [-1.3, 7.8, 10.1], [-.55, 8.3, 11.9], [1.1, 8.86, 13.35]], radius: .77 });
addBranch({ name: 'balcon des fougères', zone: 'leaves', points: [[.38, 6.8, 5.05], [-1.65, 7.18, 6.25], [-3.35, 7.72, 7.75], [-5.0, 8.18, 8.95], [-6.4, 8.0, 10.15]], radius: .67 });
addBranch({ name: 'jardin des lanternes', zone: 'lanterns', points: [[.4, 6.8, 5.08], [2.0, 7.15, 6.1], [3.55, 7.7, 7.52], [4.75, 8.45, 9.15], [6.25, 8.85, 10.6]], radius: .68 });
addBranch({ name: 'balcon haut', zone: 'leaves', points: [[1.05, 8.86, 13.28], [2.15, 9.65, 14.95], [3.8, 10.5, 16.45], [5.55, 11.15, 17.45], [6.8, 11.9, 19.0]], radius: .58 });
addBranch({ name: 'passerelle des feuilles', zone: 'leaves', points: [[3.65, 10.45, 16.35], [2.0, 10.82, 18.0], [.15, 11.15, 19.4], [-1.55, 11.62, 20.9], [-2.35, 12.0, 22.8]], radius: .47 });
addBranch({ name: 'branche des lanternes', zone: 'lanterns', points: [[3.55, 7.68, 7.5], [4.95, 8.1, 6.65], [6.7, 8.5, 6.9], [8.15, 9.05, 8.0]], radius: .49 });

// A crown of quieter, non-walkable branches frames the route like a little cathedral.
[
  [[0, 10.7, 0], [-3, 12.2, -1.8], [-5.2, 13.3, -3.1]],
  [[.2, 12.4, 0], [3, 13.8, -1.8], [5.8, 15.3, -2.3]],
  [[0, 15.3, -.3], [-3.6, 17.1, -1], [-6.5, 18.5, .1]],
  [[.3, 17.5, -.5], [3.9, 19, -1.4], [7.2, 20.1, -.2]],
  [[0, 20.2, -.4], [-2.7, 22.1, 1.2], [-4.8, 23.3, 3.3]],
  [[0, 21.2, -.4], [2.2, 23, 1.8], [4.1, 24.4, 3.7]],
].forEach((points, index) => addBranch({ name: 'cime', zone: 'leaves', points, radius: .54 - index * .025, walkable: false, detail: false }));

function makeLeafGeometry(length, width, baseHex, edgeHex) {
  const rows = 28, columns = 10;
  const positions = [], colors = [], indices = [], uvs = [];
  const base = color(baseHex), edge = color(edgeHex), vein = color(0xa2bc76);
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    const half = Math.pow(Math.sin(Math.PI * t), .78) * width * .5;
    for (let j = 0; j <= columns; j++) {
      const u = (j / columns) * 2 - 1;
      const x = u * half;
      const z = (t - .5) * length;
      const y = .08 + .24 * Math.sin(Math.PI * t) - .2 * Math.pow(Math.abs(u), 1.8) * Math.sin(Math.PI * t);
      positions.push(x, y, z);
      uvs.push(j / columns, t);
      const shade = Math.pow(Math.abs(u), 1.15) * .76;
      const c = base.clone().lerp(edge, shade).lerp(vein, Math.max(0, 1 - Math.abs(u) * 11) * .2);
      const glow = .93 + .08 * Math.sin(t * Math.PI);
      c.multiplyScalar(glow);
      colors.push(c.r, c.g, c.b);
      if (i < rows && j < columns) {
        const a = i * (columns + 1) + j;
        const b = a + columns + 1;
        // Winding faces upward; the material is double-sided for the leaves seen from below.
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addLeaf({ x, y, z, yaw = 0, length = 5, width = 2.3, tint = 0x668f54, edge = 0x315f49, sway = true }) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = yaw;
  const leaf = new THREE.Mesh(makeLeafGeometry(length, width, tint, edge), new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xffffff, roughness: .82, metalness: 0, side: THREE.DoubleSide }));
  group.add(leaf);

  const midPoints = [];
  for (let i = 0; i <= 15; i++) {
    const t = i / 15;
    midPoints.push(new THREE.Vector3(0, .095 + .24 * Math.sin(Math.PI * t), (t - .5) * length));
  }
  const vein = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(midPoints), 26, .021, 5, false), new THREE.MeshStandardMaterial({ color: 0xb5c77e, roughness: .9, transparent: true, opacity: .72 }));
  group.add(vein);
  // Fine side veins, visible as a delicate etched pattern when the camera floats near a leaf.
  const veinPositions = [];
  for (let i = 3; i < 14; i += 2) {
    const t = i / 15;
    const half = Math.pow(Math.sin(Math.PI * t), .78) * width * .43;
    const cz = (t - .5) * length;
    const cy = .1 + .24 * Math.sin(Math.PI * t);
    for (const side of [-1, 1]) {
      veinPositions.push(0, cy, cz, side * half, cy - .055, cz - length * .052);
    }
  }
  const sideGeo = new THREE.BufferGeometry();
  sideGeo.setAttribute('position', new THREE.Float32BufferAttribute(veinPositions, 3));
  group.add(new THREE.LineSegments(sideGeo, new THREE.LineBasicMaterial({ color: 0xb7ca83, transparent: true, opacity: .43 })));
  world.add(group);
  if (sway) leafMeshes.push({ group, base: yaw, phase: random() * Math.PI * 2, amount: range(.009, .02) });
  return group;
}

// Broad overlapping leaves make the boughs feel like a navigable, living canopy.
[
  [.1, 7.12, 2.45, 0, 3.8, 2.75, 0x91a96a, 0x4b734b],
  [-4.5, 8.0, 7.4, -.75, 5.7, 3.0, 0x75975c, 0x385f43],
  [-6.1, 8.35, 10.5, -.25, 5.5, 2.8, 0x638d59, 0x315640],
  [-2.5, 8.1, 10.1, .45, 5.4, 3.0, 0x8ca765, 0x4a7048],
  [1.5, 9.15, 11.2, .55, 5.2, 2.9, 0x779956, 0x3d6547],
  [4.9, 9.0, 9.2, .95, 5.8, 3.2, 0x789858, 0x3e6244],
  [6.2, 9.25, 11.3, .15, 5.1, 2.6, 0x8da768, 0x4c7147],
  [-1.8, 11.55, 15.0, -1.0, 6.2, 3.2, 0x7f9f5e, 0x3d6949],
  [3.7, 12.0, 15.7, .5, 6.4, 3.1, 0x8aa965, 0x3d6845],
  [6.5, 12.8, 17.1, 1.0, 6.0, 3.0, 0x759354, 0x355b3d],
  [-4.8, 13.5, 16.8, -.1, 7.1, 3.5, 0x7da35d, 0x3d6743],
  [-1.1, 14.1, 19.1, .5, 6.3, 3.0, 0x9bb36b, 0x54784a],
  [4.6, 15.2, 20.2, -.5, 7.8, 3.6, 0x83a25d, 0x3a6443],
  [-7.0, 15.2, 19.4, .6, 6.2, 3.0, 0x6e9657, 0x3a6042],
  [1.0, 17.4, 22.4, -.8, 7.4, 3.8, 0x71975d, 0x3a6847],
  [-3.9, 18.2, 23.5, .4, 7.1, 3.6, 0x88a765, 0x456e47],
  [6.1, 18.1, 23.0, -.4, 7.4, 3.7, 0x769758, 0x3b6242],
  [0.2, 20.1, 25.0, .2, 7.8, 4.2, 0x779b58, 0x376043],
].forEach(([x, y, z, yaw, length, width, tint, edge]) => addLeaf({ x, y, z, yaw, length, width, tint, edge }));

function addCanopyCluster(x, y, z, scale, palette = [0x4e7950, 0x628653, 0x73945a, 0x829d60]) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const count = 5 + Math.floor(random() * 4);
  for (let i = 0; i < count; i++) {
    const r = range(.68, 1.2) * scale;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 9), new THREE.MeshStandardMaterial({ color: palette[Math.floor(random() * palette.length)], roughness: .95, flatShading: true }));
    mesh.position.set(range(-1.15, 1.15) * scale, range(-.25, 1.45) * scale, range(-1.1, 1.1) * scale);
    mesh.scale.set(r * range(1.05, 1.6), r * range(.7, 1.05), r * range(.85, 1.25));
    group.add(mesh);
  }
  world.add(group);
  return group;
}

// The old tree's crown surrounds the player without hiding the open windows onto the forest.
[
  [-5, 12.7, -1.5, 2.5], [4.8, 14.2, -1.4, 2.8], [-7, 17.2, 3.5, 2.5], [7.2, 17.9, 4.8, 2.7],
  [-4.8, 20.0, 5.6, 3.1], [3.9, 21.0, 6.4, 3.0], [.2, 23.6, 4.1, 3.4], [-8.1, 13.7, 12.7, 2.7], [8.3, 15.3, 13.8, 2.7],
  [-8.8, 18.1, 20.6, 2.7], [9.0, 19.0, 21.7, 3.0], [0, 24.6, 16, 3.3],
].forEach(([x, y, z, s]) => addCanopyCluster(x, y, z, s));

function addMushroom(x, y, z, scale = 1, capColor = 0xd99063, glow = false) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.095 * scale, .15 * scale, .75 * scale, 8), new THREE.MeshStandardMaterial({ color: 0xe9ddbd, roughness: .83 }));
  stem.position.y = .36 * scale;
  group.add(stem);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.34 * scale, 12, 8, 0, Math.PI * 2, 0, Math.PI * .58), new THREE.MeshStandardMaterial({ color: capColor, roughness: .61, emissive: glow ? capColor : 0x000000, emissiveIntensity: glow ? .24 : 0, side: THREE.DoubleSide }));
  cap.scale.set(1.3, .8, 1.05);
  cap.position.y = .7 * scale;
  group.add(cap);
  const underside = new THREE.Mesh(new THREE.CircleGeometry(.31 * scale, 12), new THREE.MeshStandardMaterial({ color: 0xf3d6ad, side: THREE.DoubleSide, roughness: 1 }));
  underside.rotation.x = -Math.PI / 2;
  underside.position.y = .65 * scale;
  group.add(underside);
  if (glow) {
    const lamp = new THREE.PointLight(0xffca82, .7, 3.3);
    lamp.position.y = .95 * scale;
    group.add(lamp);
  }
  world.add(group);
  return group;
}

function addPebble(x, y, z, scale, tint = 0x818977) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: tint, roughness: .97, flatShading: true }));
  rock.position.set(x, y, z);
  rock.scale.set(scale * 1.2, scale * .55, scale);
  rock.rotation.set(random() * .3, random() * 6, random() * .25);
  world.add(rock);
}

function createFarTree(x, z, scale, shade) {
  const group = new THREE.Group();
  group.position.set(x, -1.8, z);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.36 * scale, .63 * scale, 11.5 * scale, 7), new THREE.MeshStandardMaterial({ color: shade > .5 ? 0x66503a : 0x51483b, roughness: 1 }));
  trunk.position.y = 5.6 * scale;
  group.add(trunk);
  const colors = shade > .5 ? [0x4d7250, 0x5b8053, 0x678958] : [0x536e51, 0x5b7855, 0x6b8157];
  const crown = new THREE.Group();
  crown.position.y = 10 * scale;
  for (let i = 0; i < 6; i++) {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 1, flatShading: true }));
    puff.position.set(range(-1.5, 1.5) * scale, range(-.8, 2.2) * scale, range(-1.4, 1.4) * scale);
    const s = range(2.7, 4.5) * scale;
    puff.scale.set(s * 1.05, s * .72, s);
    crown.add(puff);
  }
  group.add(crown);
  world.add(group);
}

// A hazy, layered forest keeps the tree embedded in an immense world.
for (let i = 0; i < 32; i++) {
  const angle = (i / 32) * Math.PI * 2 + range(-.1, .1);
  const radius = range(30, 82);
  createFarTree(Math.cos(angle) * radius, Math.sin(angle) * radius + 15, range(1.25, 2.7), random());
}
for (let i = 0; i < 12; i++) {
  const x = range(-24, 24), z = range(-28, 30);
  if (Math.abs(x) < 12 && z > -10 && z < 18) continue;
  createFarTree(x, z, range(.9, 1.55), random());
}

// A handful of oversized leaves and small woodland details give Miette room to pause and look around.
for (let i = 0; i < 13; i++) {
  const x = range(-8.5, 8.5), z = range(-3, 23), y = range(4.5, 16.5);
  if (Math.abs(x) < 1.2 && z < 7) continue;
  addLeaf({ x, y, z, yaw: range(-Math.PI, Math.PI), length: range(2.5, 4.8), width: range(1.1, 2.4), tint: [0x708f55, 0x789a5c, 0x83a162][Math.floor(random() * 3)], edge: 0x3a6244, sway: true });
}
[
  [-4.4, 8.6, 7.4, .8, 0xd8966e, false], [-5.5, 8.65, 9.1, .66, 0xc78264, false],
  [5.25, 9.0, 9.25, .72, 0xd99868, true], [6.0, 9.45, 10.3, .52, 0xe8bb75, true],
  [2.8, 10.8, 15.7, .58, 0xe2aa71, true], [-2.1, 1.0, 4.0, .68, 0xb98762, false], [2.5, 1.6, 2.7, .55, 0xd08c68, false],
].forEach((args) => addMushroom(...args));
for (let i = 0; i < 32; i++) {
  const x = range(-8, 8), z = range(-4, 18);
  if (Math.abs(x) < 2 && z < 5) continue;
  const branchY = z > 12 ? range(8.2, 12.0) : z > 5 ? range(7.4, 9.8) : range(1.0, 6.0);
  if (random() > .45) addPebble(x, branchY, z, range(.09, .24), random() > .5 ? 0x84907a : 0x9b8666);
}

// Fine root-vines spiral around the trunk and disappear into the moss.
for (let i = 0; i < 7; i++) {
  const a = (i / 7) * Math.PI * 2;
  const pts = [];
  for (let j = 0; j <= 16; j++) {
    const t = j / 16;
    const y = .6 + t * 13.2;
    const r = (3.15 - t * 1.8) + .13 * Math.sin(t * 23 + i);
    const angle = a + t * 1.8;
    pts.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
  }
  const vine = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, .035, 5, false), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x435a39 : 0x6f7950, roughness: 1 }));
  world.add(vine);
}

// Golden light slips between the upper leaves.
const rayCanvas = document.createElement('canvas');
rayCanvas.width = 64; rayCanvas.height = 256;
const rayCtx = rayCanvas.getContext('2d');
const rayGrad = rayCtx.createLinearGradient(0, 0, 64, 0);
rayGrad.addColorStop(0, 'rgba(255,225,164,0)');
rayGrad.addColorStop(.5, 'rgba(255,233,190,.8)');
rayGrad.addColorStop(1, 'rgba(255,225,164,0)');
rayCtx.fillStyle = rayGrad;
rayCtx.fillRect(0, 0, 64, 256);
const rayTexture = new THREE.CanvasTexture(rayCanvas);
for (let i = 0; i < 5; i++) {
  const ray = new THREE.Mesh(new THREE.PlaneGeometry(range(3.5, 7), range(11, 18)), new THREE.MeshBasicMaterial({ map: rayTexture, transparent: true, opacity: range(.08, .17), color: 0xffe5ae, depthWrite: false, side: THREE.DoubleSide }));
  ray.position.set(range(-9, 9), range(13, 20), range(2, 21));
  ray.rotation.y = range(-.8, .8);
  ray.rotation.z = range(-.12, .12);
  world.add(ray);
}

// Scattered dew crystals on a few leaves catch points of sunlight.
for (let i = 0; i < 24; i++) {
  const bead = new THREE.Mesh(new THREE.SphereGeometry(range(.045, .085), 8, 6), new THREE.MeshStandardMaterial({ color: 0xd9f1d7, roughness: .12, metalness: .04, transparent: true, opacity: .8 }));
  bead.position.set(range(-7, 7), range(8.2, 17), range(5, 22));
  world.add(bead);
}

function addGlow(position, id, hue = 0xffd783) {
  const group = new THREE.Group();
  group.position.set(...position);
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(.16, 1), new THREE.MeshBasicMaterial({ color: hue }));
  group.add(orb);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.27, .012, 6, 28), new THREE.MeshBasicMaterial({ color: 0xfff0bd, transparent: true, opacity: .83 }));
  ring.rotation.x = Math.PI * .5;
  group.add(ring);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: hue, transparent: true, depthWrite: false, opacity: .82 }));
  halo.scale.set(2.0, 2.0, 1);
  group.add(halo);
  const light = new THREE.PointLight(hue, 1.0, 4.8, 2);
  group.add(light);
  world.add(group);
  return { group, orb, ring, halo, light, id, base: new THREE.Vector3(...position), phase: random() * Math.PI * 2, collected: false };
}

const collectedSaveKey = 'miette-arbre-lumieres-v1';
let savedCollectibles = [];
try { savedCollectibles = JSON.parse(localStorage.getItem(collectedSaveKey) || '[]'); } catch { savedCollectibles = []; }
const collectibles = [
  addGlow([.35, 8.42, 8.0], 'luciole-ambre', 0xffd37d),
  addGlow([-4.7, 9.05, 8.45], 'pollen-dore', 0xffe49b),
  addGlow([5.45, 9.72, 9.8], 'graine-de-lune', 0xffc979),
];
for (const item of collectibles) {
  if (savedCollectibles.includes(item.id)) {
    item.collected = true;
    item.group.visible = false;
  }
}

// A few firefly points drift slowly around the trunk and along the boughs.
const fireflyCount = 76;
const fireflyPositions = new Float32Array(fireflyCount * 3);
const fireflyColors = new Float32Array(fireflyCount * 3);
const fireflySeeds = [];
for (let i = 0; i < fireflyCount; i++) {
  const x = range(-14, 14), y = range(1.0, 22), z = range(-7, 27);
  fireflyPositions[i * 3] = x;
  fireflyPositions[i * 3 + 1] = y;
  fireflyPositions[i * 3 + 2] = z;
  const c = random() > .73 ? color(0x8fe0c4) : color(0xffd37e);
  fireflyColors[i * 3] = c.r; fireflyColors[i * 3 + 1] = c.g; fireflyColors[i * 3 + 2] = c.b;
  fireflySeeds.push({ x, y, z, phase: random() * Math.PI * 2, speed: range(.35, 1.1), radius: range(.12, .65) });
}
const fireflyGeometry = new THREE.BufferGeometry();
fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));
fireflyGeometry.setAttribute('color', new THREE.BufferAttribute(fireflyColors, 3));
const fireflyMaterial = new THREE.PointsMaterial({ map: glowTexture, size: .48, sizeAttenuation: true, transparent: true, opacity: .78, vertexColors: true, depthWrite: false, blending: THREE.AdditiveBlending });
const fireflies = new THREE.Points(fireflyGeometry, fireflyMaterial);
world.add(fireflies);

// Miette, a tiny glossy explorer with a gently bobbing antenna and six animated legs.
const ant = new THREE.Group();
const antBody = new THREE.Group();
ant.add(antBody);
const shell = new THREE.MeshStandardMaterial({ color: 0x42291e, roughness: .3, metalness: .08, emissive: 0x210d08, emissiveIntensity: .08 });
const shellLight = new THREE.MeshStandardMaterial({ color: 0x6d3925, roughness: .34, metalness: .05 });
const dark = new THREE.MeshStandardMaterial({ color: 0x241c17, roughness: .25, metalness: .1 });
const eye = new THREE.MeshStandardMaterial({ color: 0x151613, roughness: .14, metalness: .08 });
const eyeSpark = new THREE.MeshBasicMaterial({ color: 0xffe7ae });
const abdomen = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), shell);
abdomen.position.set(0, .3, -.27);
abdomen.scale.set(.27, .22, .34);
antBody.add(abdomen);
const abdomenBand = new THREE.Mesh(new THREE.TorusGeometry(.205, .014, 5, 20), new THREE.MeshStandardMaterial({ color: 0x9a5a32, roughness: .42 }));
abdomenBand.position.set(0, .3, -.27);
abdomenBand.rotation.x = Math.PI / 2;
abdomenBand.scale.set(1, 1, 1.25);
antBody.add(abdomenBand);
const waist = new THREE.Mesh(new THREE.SphereGeometry(.115, 12, 10), shellLight);
waist.position.set(0, .31, .055);
antBody.add(waist);
const thorax = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), shellLight);
thorax.position.set(0, .3, .14);
thorax.scale.set(.19, .17, .2);
antBody.add(thorax);
const head = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), shell);
head.position.set(0, .34, .38);
head.scale.set(.225, .205, .22);
antBody.add(head);
for (const side of [-1, 1]) {
  const eyeMesh = new THREE.Mesh(new THREE.SphereGeometry(.057, 10, 8), eye);
  eyeMesh.position.set(side * .174, .38, .5);
  antBody.add(eyeMesh);
  const glint = new THREE.Mesh(new THREE.SphereGeometry(.018, 7, 6), eyeSpark);
  glint.position.set(side * .187, .407, .541);
  antBody.add(glint);
}

const antennae = [];
for (const side of [-1, 1]) {
  const pivot = new THREE.Group();
  pivot.position.set(side * .075, .5, .49);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(side * .025, .12, .055),
    new THREE.Vector3(side * .095, .2, .08),
    new THREE.Vector3(side * .15, .205, .06),
  ]);
  const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, .014, 5, false), shellLight);
  pivot.add(wire);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(.028, 8, 6), shellLight);
  tip.position.set(side * .15, .205, .06);
  pivot.add(tip);
  antBody.add(pivot);
  antennae.push({ pivot, side });
}

function makeLegSegment(radius) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * .7, radius, 1, 6), shellLight);
  ant.add(mesh);
  return mesh;
}
function positionSegment(mesh, start, end) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = Math.max(.001, direction.length());
  mesh.position.copy(start).addScaledVector(direction, .5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.scale.set(1, length, 1);
}
const legs = [];
for (const side of [-1, 1]) {
  for (let i = 0; i < 3; i++) {
    const z = [-.17, .03, .2][i];
    const hip = new THREE.Vector3(side * .145, .265, z);
    const hipJoint = new THREE.Mesh(new THREE.SphereGeometry(.048, 7, 6), shellLight);
    hipJoint.position.copy(hip);
    ant.add(hipJoint);
    legs.push({ side, i, z, hip, upper: makeLegSegment(.035), lower: makeLegSegment(.027), knee: new THREE.Vector3(), foot: new THREE.Vector3(), hipJoint });
  }
}
const antShadow = new THREE.Mesh(new THREE.CircleGeometry(.43, 18), new THREE.MeshBasicMaterial({ color: 0x17241b, transparent: true, opacity: .22, depthWrite: false }));
antShadow.rotation.x = -Math.PI / 2;
antShadow.scale.set(.7, 1.2, 1);
antShadow.position.y = .035;
ant.add(antShadow);
world.add(ant);

const startSurface = { x: .12, y: 6.48, z: 2.48, radius: .95 };
ant.position.set(startSurface.x, startSurface.y + startSurface.radius * .93, startSurface.z);
let yaw = 0;
let moveSpeed = 0;
const MAX_SPEED = 2.25;

function makeGroundFern(x, y, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x52734a, roughness: .95 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const end = new THREE.Vector3(Math.cos(a) * .85 * scale, .85 * scale, Math.sin(a) * .85 * scale);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(a) * .25 * scale, .33 * scale, Math.sin(a) * .25 * scale), new THREE.Vector3(Math.cos(a) * .6 * scale, .67 * scale, Math.sin(a) * .6 * scale), end]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, .027 * scale, 4, false), stemMaterial));
    for (let j = 1; j <= 5; j++) {
      const t = j / 6;
      const center = curve.getPoint(t);
      const size = (.11 + .08 * Math.sin(t * Math.PI)) * scale;
      for (const dir of [-1, 1]) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 7, 5), new THREE.MeshStandardMaterial({ color: j % 2 ? 0x6d9659 : 0x83a160, roughness: .9 }));
        leaf.position.copy(center).add(new THREE.Vector3(Math.cos(a + dir * .62) * size * .85, .015, Math.sin(a + dir * .62) * size * .85));
        leaf.scale.set(size * 1.2, .045 * scale, size * .52);
        leaf.rotation.y = a + dir * .62;
        group.add(leaf);
      }
    }
  }
  world.add(group);
}
for (let i = 0; i < 23; i++) makeGroundFern(range(-13, 13), -.8, range(-4, 25), range(.55, 1.15));

// Glowing, translucent seed-pods and little moss islands make the route legible without feeling like a marked track.
for (const [x, y, z] of [[-3.7, 7.94, 7.2], [-5.4, 8.35, 9.5], [3.7, 8.05, 7.6], [5.7, 9.05, 10.4], [1.1, 9.1, 13.1]]) {
  const tuft = new THREE.Mesh(new THREE.SphereGeometry(.28, 10, 7), new THREE.MeshStandardMaterial({ color: 0x799353, roughness: .98 }));
  tuft.position.set(x, y, z);
  tuft.scale.set(1.4, .46, .9);
  world.add(tuft);
}

const zoneData = {
  heart: {
    kicker: 'AU CŒUR DU VIEIL ARBRE',
    name: 'Le tronc-cœur',
    subtitle: 'La forêt s’éveille sous tes pattes.',
    message: 'Tout commence par un pas.',
    story: 'Sous tes pattes, les cernes du bois gardent le souvenir de mille pluies.'
  },
  leaves: {
    kicker: 'DANS LA CANOPÉE',
    name: 'La mer de feuilles',
    subtitle: 'Chaque feuille est un continent.',
    message: 'Un océan vert, juste pour toi.',
    story: 'Chaque feuille est un petit ciel vert. Une goutte tremble au bord, sans jamais tomber.'
  },
  roots: {
    kicker: 'SOUS LES PREMIÈRES BRANCHES',
    name: 'Les racines rêveuses',
    subtitle: 'Là-dessous, le bois se souvient.',
    message: 'Écoute : la terre te répond.',
    story: 'Tout en bas, les racines se parlent dans une langue lente que même les pierres comprennent.'
  },
  lanterns: {
    kicker: 'DANS LE JARDIN SUSPENDU',
    name: 'Le jardin des lanternes',
    subtitle: 'Les lucioles ont choisi leur chemin.',
    message: 'Le jour danse dans les corolles.',
    story: 'Les fleurs-lanternes gardent un peu de lumière pour le retour des premières étoiles.'
  }
};
let currentZone = 'heart';
const seenZones = new Set(['heart']);
const zoneElements = new Map();

function markZone(zone) {
  if (!zoneData[zone]) return;
  const changed = currentZone !== zone;
  currentZone = zone;
  const info = zoneData[zone];
  $('#zoneKicker').textContent = info.kicker;
  $('#zoneName').textContent = info.name;
  $('#zoneSubtitle').textContent = info.subtitle;
  $('#journeyMessage').textContent = info.message;
  $('#mapCurrentName').textContent = info.name;
  document.querySelectorAll('.journal-zone').forEach((row) => row.classList.toggle('is-current', row.dataset.zone === zone));
  document.querySelectorAll('.map-node').forEach((node) => node.classList.toggle('is-current', node.dataset.mapZone === zone));
  const mapNode = $(`.map-node[data-map-zone="${zone}"]`);
  if (mapNode) mapNode.classList.add('is-seen');
  if (!seenZones.has(zone)) {
    seenZones.add(zone);
    const row = $(`#journalZones [data-zone="${zone}"]`);
    if (row) row.classList.add('is-seen');
    if (changed) showToast(`Un nouvel endroit pour Miette : ${info.name.toLowerCase()}.`);
  }
}

function projectOnTrack(x, z, track) {
  const dx = track.b.x - track.a.x;
  const dz = track.b.z - track.a.z;
  const lengthSq = dx * dx + dz * dz;
  const t = lengthSq > 1e-7 ? THREE.MathUtils.clamp(((x - track.a.x) * dx + (z - track.a.z) * dz) / lengthSq, 0, 1) : 0;
  const px = THREE.MathUtils.lerp(track.a.x, track.b.x, t);
  const pz = THREE.MathUtils.lerp(track.a.z, track.b.z, t);
  const py = THREE.MathUtils.lerp(track.a.y, track.b.y, t);
  const surfaceY = py + track.radius * .91;
  const lateral = Math.hypot(x - px, z - pz);
  return { track, t, x: px, y: surfaceY, z: pz, lateral };
}

function findSurface(x, z, y, preferredZone = null) {
  let best = null;
  let bestScore = Infinity;
  for (const track of navTracks) {
    const point = projectOnTrack(x, z, track);
    const heightDiff = Math.abs(point.y - y);
    if (heightDiff > 3.2) continue;
    const score = point.lateral + heightDiff * .62 - (preferredZone && track.zone === preferredZone ? .075 : 0);
    if (point.lateral <= track.width + .08 && score < bestScore) {
      best = point;
      bestScore = score;
    }
  }
  return best;
}

const joystick = $('#joystick');
const stickKnob = $('#stickKnob');
let joystickPointer = null;
let joystickValue = { x: 0, y: 0 };
function updateStick(event) {
  const rect = joystick.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const maxRadius = rect.width * .32;
  let dx = event.clientX - centerX;
  let dy = event.clientY - centerY;
  const distance = Math.hypot(dx, dy);
  if (distance > maxRadius) {
    const ratio = maxRadius / distance;
    dx *= ratio;
    dy *= ratio;
  }
  joystickValue = { x: dx / maxRadius, y: dy / maxRadius };
  stickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  joystick.classList.add('is-active');
}
function resetStick() {
  joystickPointer = null;
  joystickValue = { x: 0, y: 0 };
  stickKnob.style.transform = 'translate(-50%, -50%)';
  joystick.classList.remove('is-active');
}
joystick.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  if (joystickPointer !== null) return;
  joystickPointer = event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  updateStick(event);
  $('#guideChip').classList.add('is-hidden');
});
joystick.addEventListener('pointermove', (event) => {
  if (event.pointerId === joystickPointer) {
    event.preventDefault();
    updateStick(event);
  }
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  joystick.addEventListener(type, (event) => {
    if (joystickPointer === null || event.pointerId === joystickPointer || type === 'lostpointercapture') resetStick();
  });
}
joystick.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowleft', 'a'].includes(key)) joystickValue.x = -1;
  if (['arrowright', 'd'].includes(key)) joystickValue.x = 1;
  if (['arrowdown', 's'].includes(key)) joystickValue.y = -1;
  if (['arrowup', 'w'].includes(key)) joystickValue.y = 1;
});
joystick.addEventListener('keyup', () => { joystickValue = { x: 0, y: 0 }; });

const heldKeys = new Set();
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
  heldKeys.add(key);
  if (key === 'm') toggleModal('journal');
  if (key === 'escape') {
    if ($('#journalModal').classList.contains('is-open')) closeModal('journal');
    else toggleModal('pause');
  }
  if (key === ' ' && !event.repeat) observe();
});
window.addEventListener('keyup', (event) => heldKeys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => { heldKeys.clear(); resetStick(); });

function readInput() {
  let x = joystickValue.x;
  let y = joystickValue.y;
  if (heldKeys.has('arrowleft') || heldKeys.has('a')) x -= 1;
  if (heldKeys.has('arrowright') || heldKeys.has('d')) x += 1;
  if (heldKeys.has('arrowup') || heldKeys.has('w')) y += 1;
  if (heldKeys.has('arrowdown') || heldKeys.has('s')) y -= 1;
  const length = Math.hypot(x, y);
  if (length > 1) { x /= length; y /= length; }
  if (Math.abs(x) < .045) x = 0;
  if (Math.abs(y) < .045) y = 0;
  return { x, y };
}

let paused = false;
let observingUntil = 0;
let toastTimer = 0;
let whisperTimer = 0;
function showToast(text, duration = 2600) {
  const toast = $('#toast');
  toast.textContent = text;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), duration);
}
function showWhisper(text, duration = 5300) {
  $('#whisperText').textContent = text;
  $('#whisper').classList.add('is-visible');
  window.clearTimeout(whisperTimer);
  whisperTimer = window.setTimeout(() => $('#whisper').classList.remove('is-visible'), duration);
}

function observe() {
  if (paused) return;
  const story = zoneData[currentZone]?.story || zoneData.heart.story;
  observingUntil = clock.elapsedTime + 2.0;
  showWhisper(story, 5500);
  $('#guideChip').classList.add('is-hidden');
}

function updateDiscoveryUI() {
  const found = collectibles.filter((item) => item.collected).length;
  $('#sparkCount').textContent = String(found);
  $('#journalProgress').textContent = `${found} sur 3`;
  $('#journalProgressBar').style.width = `${(found / 3) * 100}%`;
}
updateDiscoveryUI();

function checkCollectibles(time) {
  for (const item of collectibles) {
    if (item.collected) continue;
    item.group.position.y = item.base.y + Math.sin(time * 1.6 + item.phase) * .12;
    item.group.rotation.y = time * .55 + item.phase;
    item.ring.rotation.z = time * .8 + item.phase;
    const pulse = .92 + Math.sin(time * 2.4 + item.phase) * .1;
    item.halo.scale.set(2 * pulse, 2 * pulse, 1);
    const dx = ant.position.x - item.group.position.x;
    const dy = ant.position.y + .38 - item.group.position.y;
    const dz = ant.position.z - item.group.position.z;
    if (dx * dx + dy * dy + dz * dz < 1.05 * 1.05) {
      item.collected = true;
      item.group.visible = false;
      savedCollectibles = collectibles.filter((entry) => entry.collected).map((entry) => entry.id);
      try { localStorage.setItem(collectedSaveKey, JSON.stringify(savedCollectibles)); } catch { /* Private browsing can disable storage; the adventure still works. */ }
      updateDiscoveryUI();
      const count = collectibles.filter((entry) => entry.collected).length;
      const line = count === 3
        ? 'Les trois lueurs se répondent. La canopée s’ouvre devant Miette.'
        : 'Une lueur se pose dans le carnet de Miette. Le bois en garde le souvenir.';
      showToast(line, 3400);
      showWhisper(count === 3 ? 'L’arbre te connaît maintenant.' : 'La lumière aime les petites pattes.', 4300);
      const pill = $('#discoveryPill');
      pill.classList.remove('is-celebrating');
      void pill.offsetWidth;
      pill.classList.add('is-celebrating');
    }
  }
}

const observeLandmarks = [
  { zone: 'heart', point: new THREE.Vector3(0, 8, .2), text: zoneData.heart.story },
  { zone: 'roots', point: new THREE.Vector3(-2.7, 3.1, 0), text: zoneData.roots.story },
  { zone: 'leaves', point: new THREE.Vector3(-1.2, 9.4, 11.5), text: 'Les feuilles se chevauchent comme les pages d’un livre que le vent feuillette.' },
  { zone: 'lanterns', point: new THREE.Vector3(5.2, 9.5, 9.6), text: zoneData.lanterns.story },
];
function getObservation() {
  let nearest = null, distance = Infinity;
  for (const landmark of observeLandmarks) {
    const d = ant.position.distanceTo(landmark.point);
    if (d < distance) { distance = d; nearest = landmark; }
  }
  return distance < 5.5 ? nearest.text : zoneData[currentZone].story;
}
$('#observeButton').addEventListener('click', () => {
  if (paused) return;
  observingUntil = clock.elapsedTime + 2.0;
  showWhisper(getObservation(), 5600);
  $('#guideChip').classList.add('is-hidden');
});

function openModal(name) {
  const modal = name === 'journal' ? $('#journalModal') : $('#pauseModal');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  paused = true;
  resetStick();
  if (name === 'pause') $('#pauseButton').setAttribute('aria-label', 'Reprendre la balade');
}
function closeModal(name) {
  const modal = name === 'journal' ? $('#journalModal') : $('#pauseModal');
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  if (!$('#journalModal').classList.contains('is-open') && !$('#pauseModal').classList.contains('is-open')) paused = false;
  if (name === 'pause') $('#pauseButton').setAttribute('aria-label', 'Mettre le jeu en pause');
}
function toggleModal(name) {
  const modal = name === 'journal' ? $('#journalModal') : $('#pauseModal');
  if (modal.classList.contains('is-open')) closeModal(name);
  else openModal(name);
}
$('#mapButton').addEventListener('click', () => toggleModal('journal'));
$('#pauseButton').addEventListener('click', () => toggleModal('pause'));
$('#resumeButton').addEventListener('click', () => closeModal('pause'));
document.querySelectorAll('[data-close="journal"]').forEach((el) => el.addEventListener('click', () => closeModal('journal')));
document.querySelectorAll('[data-close="pause"]').forEach((el) => el.addEventListener('click', () => closeModal('pause')));
$('#dismissGuide').addEventListener('click', () => $('#guideChip').classList.add('is-hidden'));

function updateAntAnimation(time, speed) {
  const stride = Math.min(1, Math.abs(speed) / MAX_SPEED);
  const cycle = time * (5.2 + stride * 7.2);
  antBody.position.y = .015 + Math.abs(Math.sin(cycle)) * .055 * stride;
  antBody.rotation.z = Math.sin(cycle * .5) * .025 * stride;
  abdomen.rotation.y = Math.sin(cycle * .38) * .04;
  antennae.forEach(({ pivot, side }) => {
    pivot.rotation.z = side * (.045 + Math.sin(time * 3.4 + side) * .12) - side * stride * .1;
    pivot.rotation.x = Math.sin(time * 2.6 + side) * .035;
  });
  for (const leg of legs) {
    const phase = cycle + leg.i * Math.PI + (leg.side < 0 ? Math.PI : 0);
    const strideZ = Math.sin(phase) * .13 * stride;
    const lift = Math.max(0, Math.cos(phase)) * .13 * stride;
    leg.knee.set(leg.side * .29, .18 + lift * .45, leg.z + strideZ * .48 + (leg.i - 1) * .025);
    leg.foot.set(leg.side * (.34 + lift * .2), .025 + lift, leg.z + strideZ);
    positionSegment(leg.upper, leg.hip, leg.knee);
    positionSegment(leg.lower, leg.knee, leg.foot);
  }
}

const cameraForward = new THREE.Vector3();
const cameraSide = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const desiredCamera = new THREE.Vector3();
function updateCamera(dt, time) {
  cameraForward.set(Math.sin(yaw), 0, Math.cos(yaw));
  cameraSide.set(Math.cos(yaw), 0, -Math.sin(yaw));
  const observing = time < observingUntil;
  const distance = observing ? 5.9 : 7.25;
  const lift = observing ? 3.25 : 3.75;
  desiredCamera.copy(ant.position)
    .addScaledVector(cameraForward, -distance)
    .addScaledVector(cameraSide, 1.12)
    .add(new THREE.Vector3(0, lift, 0));
  camera.position.lerp(desiredCamera, 1 - Math.exp(-dt * (observing ? 3.0 : 4.2)));
  cameraTarget.copy(ant.position).addScaledVector(cameraForward, observing ? 2.2 : 3.5).add(new THREE.Vector3(0, observing ? .75 : 1.0, 0));
  camera.lookAt(cameraTarget);
}

function updateNavigation(dt) {
  const input = paused ? { x: 0, y: 0 } : readInput();
  const turnRate = 1.75;
  yaw += input.x * turnRate * dt;
  const targetSpeed = paused ? 0 : input.y * MAX_SPEED;
  moveSpeed += (targetSpeed - moveSpeed) * (1 - Math.exp(-dt * 13));

  if (Math.abs(moveSpeed) > .005) {
    const step = moveSpeed * dt;
    const nextX = ant.position.x + Math.sin(yaw) * step;
    const nextZ = ant.position.z + Math.cos(yaw) * step;
    const surface = findSurface(nextX, nextZ, ant.position.y, currentZone);
    if (surface) {
      ant.position.x = nextX;
      ant.position.z = nextZ;
      ant.position.y += (surface.y - ant.position.y) * (1 - Math.exp(-dt * 13));
      if (surface.track.zone !== currentZone && surface.lateral < surface.track.width * .6) markZone(surface.track.zone);
    } else {
      // Miette never falls. At the edge of a branch, she simply pauses until the path is under her feet again.
      moveSpeed *= .12;
    }
  }
  const standing = findSurface(ant.position.x, ant.position.z, ant.position.y, currentZone);
  if (standing) {
    ant.position.y += (standing.y - ant.position.y) * (1 - Math.exp(-dt * 8));
    if (standing.track.zone !== currentZone && standing.lateral < standing.track.width * .42) markZone(standing.track.zone);
  }
  ant.rotation.y = yaw;
  updateAntAnimation(clock.elapsedTime, moveSpeed);
}

function updateWorld(dt, time) {
  for (const leaf of leafMeshes) {
    leaf.group.rotation.y = leaf.base + Math.sin(time * .38 + leaf.phase) * leaf.amount;
    leaf.group.rotation.z = Math.sin(time * .54 + leaf.phase) * leaf.amount * .72;
  }
  const position = fireflyGeometry.attributes.position;
  for (let i = 0; i < fireflyCount; i++) {
    const f = fireflySeeds[i];
    const phase = time * f.speed + f.phase;
    position.setXYZ(i, f.x + Math.sin(phase) * f.radius, f.y + Math.sin(phase * .67) * .34, f.z + Math.cos(phase * .76) * f.radius);
  }
  position.needsUpdate = true;
  fireflyMaterial.opacity = .64 + Math.sin(time * 1.7) * .12;
  checkCollectibles(time);
}

let frameId = 0;
function animate() {
  frameId = requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .045);
  const time = clock.elapsedTime;
  updateNavigation(dt);
  updateWorld(dt, time);
  updateCamera(dt, time);
  renderer.render(scene, camera);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.fov = width / height < .58 ? 52 : 49;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize, { passive: true });
window.addEventListener('orientationchange', resize, { passive: true });

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // The game remains playable even when the browser blocks offline installation.
    });
  }, { once: true });
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    moveSpeed = 0;
    resetStick();
  }
});

// A quiet greeting gives the player an invitation without hiding the 3D world.
window.setTimeout(() => {
  if (!paused && collectibles.filter((item) => !item.collected).length === 3) {
    showWhisper('Une minuscule fourmi. Un arbre sans fin.', 4200);
  }
}, 1100);

animate();
