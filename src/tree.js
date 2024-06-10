import * as THREE from 'three';
import RNG from './rng';
import { Branch } from './branch';

const loader = new THREE.TextureLoader();

function loadTexture(path) {
  return loader.load(path, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
  });
}
const barkTexture = loadTexture(`textures/bark/bark.png`);

const leafTextures = [
  loadTexture(`textures/leaves/ash.png`),
  loadTexture(`textures/leaves/aspen.png`),
  loadTexture(`textures/leaves/oak.png`)
];

export class Tree extends THREE.Group {

  constructor(params) {
    super();
    this.name = 'Tree';
    this.params = params;
    this.rng = new RNG(this.params.seed);

    this.branchMaterial = new THREE.MeshLambertMaterial({
      name: 'branches',
      flatShading: this.params.trunk.flatShading,
      color: this.params.trunk.color
    });

    if (this.params.trunk.textured) {
      this.branchMaterial.map = barkTexture;
    }

    this.leafMaterial = new THREE.MeshLambertMaterial({
      name: 'leaves',
      color: this.params.leaves.color,
      emissive: this.params.leaves.color,
      emissiveIntensity: this.params.leaves.emissive,
      side: THREE.DoubleSide,
      map: leafTextures[this.params.leaves.type],
      transparent: true,
      opacity: this.params.leaves.opacity,
      alphaTest: this.params.leaves.alphaTest
    });

    this.generate();

    document.getElementById('model-info').innerText = `Vertex Count: ${this.vertexCount} | Triangle Count: ${this.triangleCount}`;
  }

  generate() {
    this.rng = new RNG(this.params.seed);

    // Clean up the old tree
    this.children.forEach(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    });

    this.children = [];

    this.trunk = new Branch(this.params, this.branchMaterial, this.leafMaterial);
    this.trunk.generate(
      this.rng,
      new THREE.Vector3(),
      new THREE.Euler(),
      this.params.trunk.length,
      this.params.trunk.radius
    );
    this.add(this.trunk);
  }

  get vertexCount() {
    return this.trunk.vertexCount()
  };
  get triangleCount() {
    return this.trunk.triangleCount()
  };
}