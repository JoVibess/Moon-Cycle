import "../css/style.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import SunCalc from "suncalc";
import { initHeroMoonData } from "./features/heroMoonData.js";
import { initFooterLiquidGradient } from "./features/footerLiquidGradient.js";
import { initFooterLocalTime } from "./features/footerLocalTime.js";
import { initLanguageSwitcher } from "./features/languageSwitcher.js";
import { initMoonCycleDiagram } from "./features/moonCycleDiagram.js";
import { initSiteCursor } from "./features/siteCursor.js";

gsap.registerPlugin(ScrollTrigger);

const activeLanguage = initLanguageSwitcher({
  onLanguageChange: initHeroMoonData,
});

// Scroll horizontal : convertit le scroll vertical en déplacement horizontal du track
const wrap = document.querySelector(".horizontal-wrap");
const track = document.querySelector(".horizontal-track");
const spacer = document.querySelector(".horizontal-after-spacer");
const panels = gsap.utils.toArray(".horizontal-track .panel");

if (wrap && track && spacer && panels.length > 1) {
  const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

  const syncSpacerHeight = () => {
    spacer.style.height = `${distance()}px`;
  };

  syncSpacerHeight();

  gsap.to(track, {
    x: () => -distance(),
    ease: "none",
    scrollTrigger: {
      id: "horizontal-scroll",
      trigger: wrap,
      start: "top top",
      end: () => `+=${distance()}`,
      scrub: 1,
      invalidateOnRefresh: true,
      snap: {
        snapTo: 1 / (panels.length - 1),
        duration: { min: 0.2, max: 0.45 },
        delay: 0.05,
        directional: true,
        ease: "power2.out",
      },
    },
  });

  window.addEventListener("resize", () => {
    syncSpacerHeight();
    ScrollTrigger.refresh();
  });

  ScrollTrigger.addEventListener("refreshInit", syncSpacerHeight);
  ScrollTrigger.refresh();
}

// Scène Three.js : rendu 3D du modèle lunaire
const moonCanvas = document.querySelector(".hero-moon-canvas");
const moonContainer = document.querySelector(".hero-moon-wrap");

if (moonCanvas && moonContainer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 3.2);
  scene.add(camera);

  // Lumière ambiante très faible pour rendre le côté sombre légèrement visible
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.08);
  scene.add(ambientLight);

  // Lumière directionnelle positionnée selon la phase lunaire du jour (SunCalc)
  // angle = (0.5 - phase) * 2π : phase 0 → lumière derrière, phase 0.5 → lumière face caméra
  const light = new THREE.DirectionalLight(0xffffff, 6);
  const moonPhase = SunCalc.getMoonIllumination(new Date()).phase;
  const lightAngle = (0.5 - moonPhase) * 2 * Math.PI;
  light.position.set(Math.sin(lightAngle) * 5, 0, Math.cos(lightAngle) * 5);
  scene.add(light);

  const renderer = new THREE.WebGLRenderer({
    canvas: moonCanvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearAlpha(0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const loader = new GLTFLoader();
  const moonModelUrl = new URL("../assets/models/moon.glb", import.meta.url).href;

  let moonModel = null;

  // Centre et redimensionne le modèle GLB pour qu'il remplisse le canvas
  const fitMoonModel = () => {
    if (!moonModel) {
      return;
    }

    const box = new THREE.Box3().setFromObject(moonModel);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;

    moonModel.position.sub(center);
    moonModel.scale.setScalar(2.5 / maxAxis);
  };

  const resizeMoon = () => {
    const rect = moonContainer.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  loader.load(
    moonModelUrl,
    (gltf) => {
      moonModel = gltf.scene;
      scene.add(moonModel);
      fitMoonModel();
      resizeMoon();
    },
    undefined,
    (error) => {
      console.error("Moon GLB load error:", error);
    }
  );

  const resizeObserver = new ResizeObserver(() => {
    resizeMoon();
  });
  resizeObserver.observe(moonContainer);
  window.addEventListener("resize", resizeMoon);
  resizeMoon();

  // Boucle de rendu : rotation lente de la lune sur l'axe Y
  const tick = () => {
    if (moonModel) {
      moonModel.rotation.y += 0.0025;
    }
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
  };
  tick();
}

// Récupère les données lunaires depuis l'API et met à jour le DOM
initHeroMoonData(activeLanguage);
initFooterLiquidGradient();
initFooterLocalTime();
initMoonCycleDiagram();
initSiteCursor();
