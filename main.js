import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js";
import { GUI } from "./libs/lil-gui.module.min.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js";
import { SVGLoader } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/SVGLoader.js";
let renderer, scene, camera, gui, guiData;
init();
function init() {
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.set(100, 150, 110);
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("canvas"),
    antialias: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  //

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener("change", render);
  controls.screenSpacePanning = true;
  controls.maxPolarAngle = Math.PI / 2;
  controls.minDistance = 50;
  controls.maxDistance = 400;

  window.addEventListener("resize", onWindowResize);
  guiData = {
    currentURL: "assets/road.svg",
    drawFillShapes: true,
    drawStrokes: true,
    fillShapesWireframe: false,
    strokesWireframe: false,
  };

  loadSVG(guiData.currentURL);

  createGUI();
}

function createGUI() {
  if (gui) gui.destroy();
  gui = new GUI();
  gui
    .add(guiData, "currentURL", {
      Road: "assets/road.svg",
    })
    .name("SVG File")
    .onChange(update);

  gui.add(guiData, "drawStrokes").name("Draw strokes").onChange(update);

  gui.add(guiData, "drawFillShapes").name("Draw fill shapes").onChange(update);

  gui
    .add(guiData, "strokesWireframe")
    .name("Wireframe strokes")
    .onChange(update);

  gui
    .add(guiData, "fillShapesWireframe")
    .name("Wireframe fill shapes")
    .onChange(update);
  gui.hide();
  function update() {
    loadSVG(guiData.currentURL);
  }
}

function loadSVG(url) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb0b0b0);
  scene.fog = new THREE.Fog(0xb0b0b0, 1, 2000);
  //

  const loader = new SVGLoader();

  loader.load(url, function (data) {
    const paths = data.paths;
    const group = new THREE.Group();
    group.scale.multiplyScalar(0.25);
    group.position.x = -540;
    group.position.y = -50;
    group.position.z = -540;
    group.rotateX(Math.PI / 2);
    group.scale.set(0.8, 0.8, 0.8);
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];

      const fillColor = path.userData.style.fill;
      if (
        guiData.drawFillShapes &&
        fillColor !== undefined &&
        fillColor !== "none"
      ) {
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setStyle(fillColor).convertSRGBToLinear(),
          opacity: path.userData.style.fillOpacity,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          wireframe: guiData.fillShapesWireframe,
        });

        const shapes = SVGLoader.createShapes(path);

        for (let j = 0; j < shapes.length; j++) {
          const shape = shapes[j];

          const geometry = new THREE.ShapeGeometry(shape);
          const mesh = new THREE.Mesh(geometry, material);
          group.add(mesh);
        }
      }
      const strokeColor = path.userData.style.stroke;
      if (
        guiData.drawStrokes &&
        strokeColor !== undefined &&
        strokeColor !== "none"
      ) {
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setStyle(strokeColor).convertSRGBToLinear(),
          opacity: path.userData.style.strokeOpacity,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          wireframe: guiData.strokesWireframe,
        });

        for (let j = 0, jl = path.subPaths.length; j < jl; j++) {
          const subPath = path.subPaths[j];

          const geometry = SVGLoader.pointsToStroke(
            subPath.getPoints(),
            path.userData.style
          );

          if (geometry) {
            const mesh = new THREE.Mesh(geometry, material);

            group.add(mesh);
          }
        }
      }
    }

    scene.add(group);

    render();
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  loadSVG(guiData.currentURL);
}

function render() {
  renderer.render(scene, camera);
}
