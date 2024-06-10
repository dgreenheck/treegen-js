import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

import { Tree } from './tree';
import { LeafStyle, LeafType } from './branch';

let clock = new THREE.Clock();
// Instantiate a exporter
const exporter = new GLTFExporter();

const stats = new Stats()
document.body.appendChild(stats.dom)

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

// ---- CAMERA/LIGHTING -------

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight();
sunlight.intensity = 1;
sunlight.position.set(50, 50, 50);
sunlight.castShadow = true;
scene.add(sunlight);

const spotLight = new THREE.SpotLight(0xffffff);
spotLight.intensity = 50000;
spotLight.position.set(40, 80, 40);
spotLight.distance = 150;
spotLight.castShadow = true;
spotLight.shadow.camera.left = -30;
spotLight.shadow.camera.right = 30;
spotLight.shadow.camera.top = 30;
spotLight.shadow.camera.bottom = -30;
spotLight.shadow.mapSize = new THREE.Vector2(2048, 2048);
scene.add(spotLight);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 20, 0);
camera.position.set(50, 10, 0);

// ---- POST-PROCESSING -------

const composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.2, 0, 0.2);
composer.addPass(bloomPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

const pixelRatio = renderer.getPixelRatio();
const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.material.uniforms['resolution'].value.x = 1 / (renderer.domElement.offsetWidth * pixelRatio);
fxaaPass.material.uniforms['resolution'].value.y = 1 / (renderer.domElement.offsetHeight * pixelRatio);
composer.addPass(fxaaPass);

// ----- TREE -----------

const treeParams = {
  seed: 0,
  maturity: 1,
  animateGrowth: false,

  trunk: {
    color: 0xd59d63,       // Color of the tree trunk
    flatShading: false,    // Use face normals for shading instead of vertex normals
    textured: true,        // Apply texture to bark
    length: 20,            // Length of the trunk
    radius: 1.5,           // Starting radius of the trunk
    flare: 1.0             // Multipler for base of trunk
  },

  branch: {
    levels: 4,               // Number of branch recursions ( Keep under 5 )
    start: .6,               // Defines where child branches start forming on the parent branch. A value of 0.6 means the
    // child branches can start forming 60% of the way up the parent branch
    stop: .95,               // Defines where child branches stop forming on the parent branch. A value of 0.9 means the
    // child branches stop forming 90% of the way up the parent branch
    sweepAngle: 2,           // Max sweep of the branches (radians)
    minChildren: 3,          // Minimum number of child branches
    maxChildren: 4,          // Maximum number of child branches
    lengthVariance: 0.2,     // % variance in branch length
    lengthMultiplier: .7,    // Length of child branch relative to parent
    radiusMultiplier: .9,    // Radius of child branch relative to parent
    taper: .7,               // Radius of end of branch relative to the start of the branch
    gnarliness: 0.2,         // Max amplitude of random angle added to each section's orientation
    gnarliness1_R: 0.05,  // Same as above, but inversely proportional to the branch radius
    // The two terms can be used to balance gnarliness of trunk vs. branches
    twist: 0.0,
  },

  geometry: {
    sections: 10,             // Number of sections that make up this branch 
    segments: 12,           // Number of faces around the circumference of the branch
    lengthVariance: 0.1,   // % variance in the nominal section length
    radiusVariance: 0.1,   // % variance in the nominal section radius
    randomization: 0.1,    // Randomization factor applied to vertices
  },

  leaves: {
    style: 1,
    type: 1,
    minCount: 5,
    maxCount: 7,
    size: 2,
    sizeVariance: 0,
    color: 0x6b7f48,
    emissive: 0.02,
    opacity: 1,
    alphaTest: 0.5
  },

  sun: {
    direction: new THREE.Vector3(0, 1, 0),
    strength: 0.02
  }
}

const tree = new Tree(treeParams);
tree.castShadow = true;
tree.receiveShadow = true;
scene.add(tree);

// ---- UI -----

const gui = new GUI();
gui.add(tree.params, 'seed', 0, 65536, 1).name('Seed');
gui.add(tree.params, 'maturity', 0, 1).name('Maturity');
gui.add(tree.params, 'animateGrowth', 0, 1).name('Animate Growth');

const trunkFolder = gui.addFolder('Trunk').close();
trunkFolder.addColor(tree.params.trunk, 'color').name('Color');
trunkFolder.add(tree.params.trunk, 'flatShading').name('Flat Shading');
trunkFolder.add(tree.params.trunk, 'length', 0, 50).name('Length');
trunkFolder.add(tree.params.trunk, 'radius', 0, 5).name('Radius');
trunkFolder.add(tree.params.trunk, 'flare', 0, 5).name('Flare');

const branchFolder = gui.addFolder('Branches').close();
branchFolder.add(tree.params.branch, 'levels', 1, 5, 1).name('Levels');
branchFolder.add(tree.params.branch, 'start', 0, 1).name('Start');
branchFolder.add(tree.params.branch, 'stop', 0, 1).name('Stop');
branchFolder.add(tree.params.branch, 'minChildren', 0, 10, 1).name('Min Children');
branchFolder.add(tree.params.branch, 'maxChildren', 0, 10, 1).name('Max Children');
branchFolder.add(tree.params.branch, 'sweepAngle', 0, Math.PI).name('Sweep Angle');
branchFolder.add(tree.params.branch, 'lengthVariance', 0, 1).name('Length Variance');
branchFolder.add(tree.params.branch, 'lengthMultiplier', 0, 1).name('Length Multiplier');
branchFolder.add(tree.params.branch, 'radiusMultiplier', 0, 1).name('Radius Multiplier');
branchFolder.add(tree.params.branch, 'taper', 0.5, 1).name('Taper');
branchFolder.add(tree.params.branch, 'gnarliness', 0, 0.5).name('Gnarliness (1)');
branchFolder.add(tree.params.branch, 'gnarliness1_R', 0, 0.25).name('Gnarliness (1/R)');
branchFolder.add(tree.params.branch, 'twist', -0.25, 0.25, 0.01).name('Twist Strength');

const geometryFolder = gui.addFolder('Geometry').close();
geometryFolder.add(tree.params.geometry, 'sections', 1, 20, 1).name('Section Count');
geometryFolder.add(tree.params.geometry, 'lengthVariance', 0, 1).name('Section Length Variance');
geometryFolder.add(tree.params.geometry, 'radiusVariance', 0, 1).name('Section Radius Variance');
geometryFolder.add(tree.params.geometry, 'segments', 3, 32, 1).name('Radial Segment Count');
geometryFolder.add(tree.params.geometry, 'randomization', 0, 0.5).name('Vertex Randomization');

const leavesFolder = gui.addFolder('Leaves').close();
leavesFolder.add(tree.params.leaves, 'style', LeafStyle).name('Style');
leavesFolder.add(tree.params.leaves, 'type', LeafType);
leavesFolder.add(tree.params.leaves, 'size', 0, 5).name('Size');
leavesFolder.add(tree.params.leaves, 'sizeVariance', 0, 1).name('Size Variance');
leavesFolder.add(tree.params.leaves, 'minCount', 0, 100, 1).name('Min Count');
leavesFolder.add(tree.params.leaves, 'maxCount', 0, 100, 1).name('Max Count');
leavesFolder.addColor(tree.params.leaves, 'color').name('Color');
leavesFolder.add(tree.params.leaves, 'emissive', 0, 1).name('Emissive');
leavesFolder.add(tree.params.leaves, 'opacity', 0, 1).name('Opacity');
leavesFolder.add(tree.params.leaves, 'alphaTest', 0, 1).name('AlphaTest');

const forceFolder = gui.addFolder('Sun Direction').close();
const directionFolder = forceFolder.addFolder('Sun Direction');
directionFolder.add(tree.params.sun.direction, 'x', -1, 1).name('X');
directionFolder.add(tree.params.sun.direction, 'y', -1, 1).name('Y');
directionFolder.add(tree.params.sun.direction, 'z', -1, 1).name('Z');
forceFolder.add(tree.params.sun, 'strength', -0.1, 0.1).name('Sun Strength');

const postProcessingFolder = gui.addFolder('Post Processing').close();
const bloomFolder = postProcessingFolder.addFolder('Bloom');
bloomFolder.add(bloomPass, 'threshold', 0, 1).name('Threshold');
bloomFolder.add(bloomPass, 'strength', 0, 3).name('Strength');
bloomFolder.add(bloomPass, 'radius', 0, 10).name('Radius');

gui.add({
  export: () => exporter.parse(
    tree,
    (glb) => {
      const blob = new Blob([glb], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.getElementById('downloadLink');
      link.href = url;
      link.download = 'tree.glb';
      link.click();
    },
    (err) => {
      console.error(err);
    },
    { binary: true }
  )
}, 'export').name('Export to GLB');

gui.onChange(() => {
  tree.generate();
  tree.traverse(o => {
    if (o.material) {
      o.material.needsUpdate = true;
    }
  });
});

// --- RENDER LOOP ------

let resetTimeout = null;
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  stats.update();

  if (treeParams.animateGrowth) {
    const dt = clock.getDelta();
    tree.params.maturity = Math.min(1, tree.params.maturity + 0.2 * dt);

    if (tree.params.maturity >= 1 && !resetTimeout) {
      resetTimeout = setTimeout(() => {
        tree.params.seed = Math.random() * 60000;
        tree.params.maturity = 0.1;
        resetTimeout = null;
      }, 3000);
    }

    tree.generate();
  }

  composer.render();
}

// Events
window.addEventListener('resize', () => {
  // Resize camera aspect ratio and renderer size to the new window size
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();