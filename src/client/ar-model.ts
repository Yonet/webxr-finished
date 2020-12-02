import {
	HemisphereLight,
	LoadingManager,
	Mesh,
	MeshBasicMaterial,
	MeshPhongMaterial,
	Object3D,
	PerspectiveCamera,
	RingBufferGeometry,
	Scene,
	SphereBufferGeometry,
	WebGLRenderer,
	XRHitTestSource,
} from "/build/three.module.js";
import { OrbitControls } from "/jsm/controls/OrbitControls";
import { GUI } from "/jsm/libs/dat.gui.module";
import Stats from "/jsm/libs/stats.module";
import { ARButton } from "/jsm/webxr/ARButton";
import { GLTFLoader } from "/jsm/loaders/GLTFLoader";
import { RGBELoader } from "/jsm/loaders/RGBELoader";

//Scene
const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const camera: PerspectiveCamera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
const scene: Scene = new Scene();
const stats = Stats();

//renderer
const renderer: WebGLRenderer = new WebGLRenderer({
	antialias: true,
	canvas: canvas,
});
const controls = new OrbitControls(camera, renderer.domElement);

//geometry
const geometry = new SphereBufferGeometry(0.1, 0.1, 0.1, 32).translate(0, 0.1, 0);
const material: MeshBasicMaterial = new MeshBasicMaterial({ color: 0x00ff00 });
const phongMaterial = new MeshPhongMaterial({
	color: 0x00ffff * Math.random(),
});
const earth: Mesh = new Mesh(geometry, phongMaterial);

//Model loader
const manager = new LoadingManager();
const loader = new GLTFLoader(manager).setPath("/assets/models/AyaSofia/");
let modelLoaded = false;

//Hit test
let reticle: Object3D, controller: Object3D;
let hitTestSource: XRHitTestSource | null = null;
let hitTestSourceRequested = false;

init();
animate();

function init() {
	//light
	const light = new HemisphereLight(0xffffff, 0xbbbbff, 1);
	light.position.set(0.5, 1, 0.25);
	scene.add(light);

	//renderer
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.xr.enabled = true;

	//overlays:AR button
	document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] }));

	controller = renderer.xr.getController(0);
	controller.addEventListener("select", onSelect);
	scene.add(controller);

	//Hit-test indicator
	reticle = new Mesh(new RingBufferGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2), new MeshBasicMaterial());
	reticle.matrixAutoUpdate = false;
	reticle.visible = false;
	scene.add(reticle);

	scene.add(earth);
	earth.position.z = -2;
	earth.visible = true;
	console.log("renderer  xr", renderer.xr);

	window.addEventListener("resize", onWindowResize, false);
}

function onSelect() {
	// if (reticle.visible) {
	// 	const mesh = new Mesh(geometry, phongMaterial);
	// 	mesh.position.setFromMatrixPosition(reticle.matrix);
	// 	mesh.scale.y = Math.random() * 2 + 1;
	// 	scene.add(mesh);
	// }
	if (reticle.visible && !modelLoaded) {
		loader.load(
			"GM_poly.gltf",
			function (gltf) {
				gltf.scene.children[0].position.setFromMatrixPosition(reticle.matrix);
				console.log("gltf obj ds", gltf);
				scene.add(gltf.scene);
				modelLoaded = true;
			},
			undefined,
			function (error) {
				console.error(error);
			}
		);
	}
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

manager.onStart = function (url, itemsLoaded, itemsTotal) {
	console.log("Started loading file: " + url + ".\nLoaded " + itemsLoaded + " of " + itemsTotal + " files.");
};

manager.onLoad = function () {
	console.log("Loading complete!");
};

manager.onProgress = function (url, itemsLoaded, itemsTotal) {
	console.log("Loading file: " + url + ".\nLoaded " + itemsLoaded + " of " + itemsTotal + " files.");
};

manager.onError = function (url) {
	console.log("There was an error loading " + url);
};

function animate() {
	renderer.setAnimationLoop(render);
}

function render(timestamp: number, frame: any) {
	if (frame) {
		earth.visible = false;
		const referenceSpace = renderer.xr.getReferenceSpace();
		const session = renderer.xr.getSession();
		if (hitTestSourceRequested === false) {
			session.requestReferenceSpace("viewer").then((referenceSpace) => {
				session.requestHitTestSource({ space: referenceSpace }).then((source) => {
					hitTestSource = source;
				});
			});

			session.addEventListener("end", () => {
				hitTestSourceRequested = false;
				hitTestSource = null;
			});
			hitTestSourceRequested = true;
		}
		if (hitTestSource) {
			const hitTestResults = frame.getHitTestResults(hitTestSource);
			if (hitTestResults.length) {
				const hit = hitTestResults[0];
				reticle.visible = true;
				reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
			} else {
				reticle.visible = false;
			}
		}
	}
	// console.log("isPresenting outside of the frame", renderer.xr.isPresenting);
	controls.update();
	stats.update();
	renderer.render(scene, camera);
}
