import { OrbitControls } from "/jsm/controls/OrbitControls";
import {
	HemisphereLight,
	Mesh,
	MeshPhongMaterial,
	PerspectiveCamera,
	Scene,
	SphereGeometry,
	TextureLoader,
	WebGLRenderer,
} from "/build/three.module.js";

// Scene
const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const camera: PerspectiveCamera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const scene: Scene = new Scene();

// Renderer
const renderer: WebGLRenderer = new WebGLRenderer({
	antialias: true,
	canvas: canvas,
});
let controls: OrbitControls;

//light
const light = new HemisphereLight(0xffffff, 0xbbbbff, 1);
light.position.set(0.5, 1, 0.25);
scene.add(light);

// Material
const texture = new TextureLoader().load("assets/images/globe/earthmap4k.jpg");
const bumpMap = new TextureLoader().load("assets/images/globe/earthbump4k.jpg");
const material = new MeshPhongMaterial({
	// color: 0xffff00 * Math.random(),
	specular: 0x222222,
	shininess: 25,
	bumpMap: bumpMap,
	bumpScale: 10,
	map: texture,
});

// Geometry radius, width segment, height segment
const geometry = new SphereGeometry(0.5, 32, 32).translate(0, 0.1, 0);

// Mesh
const earth: Mesh = new Mesh(geometry, material);

init();
animate();

function init() {
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	controls = new OrbitControls(camera, renderer.domElement);
	controls.autoRotate = true;
	window.addEventListener("resize", onWindowResize, false);
	earth.position.z = -2;
	scene.add(earth);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);

	render();
}

function animate(): void {
	requestAnimationFrame(animate);
	// renderer.setAnimationLoop(animate);
	earth.rotation.y += 0.01;
	controls.update();
	render();
}

function render(): void {
	renderer.render(scene, camera);
}
