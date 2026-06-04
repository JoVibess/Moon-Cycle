import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import SunCalc from "suncalc";

import { initFooterLiquidGradient } from "./footerLiquidGradient.js";

THREE.Cache.enabled = true;

const loaderOverlay = document.querySelector("[data-loader-overlay]");
const loaderProgress = document.querySelector("[data-loader-progress]");

const nextFrame = () =>
  new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

const setLoaderProgress = (value) => {
  if (!loaderProgress) {
    return;
  }

  const boundedValue = Math.max(0, Math.min(100, Math.round(value)));
  loaderProgress.textContent = `${boundedValue}%`;
};

const hideLoaderOverlay = () => {
  document.body.classList.remove("is-loading");
  loaderOverlay?.classList.add("loader-overlay--hidden");
};

function scheduleFooterGradientInit() {
  const footer = document.querySelector(".panel-footer");

  if (!footer) {
    return;
  }

  let hasStarted = false;

  const startGradient = () => {
    if (hasStarted) {
      return;
    }

    hasStarted = true;
    initFooterLiquidGradient();
  };

  if (!("IntersectionObserver" in window)) {
    startGradient();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        startGradient();
      }
    },
    {
      rootMargin: "240px 0px",
    }
  );

  observer.observe(footer);
}

async function initHeroMoonScene(onProgress) {
  const moonCanvas = document.querySelector(".hero-moon-canvas");
  const moonContainer = document.querySelector(".hero-moon-wrap");

  if (!moonCanvas || !moonContainer) {
    onProgress?.(100);
    return;
  }

  const isMobileDevice = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 3.2);
  scene.add(camera);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.08);
  scene.add(ambientLight);

  const light = new THREE.DirectionalLight(0xffffff, 6);
  const moonPhase = SunCalc.getMoonIllumination(new Date()).phase;
  const lightAngle = (0.5 - moonPhase) * 2 * Math.PI;
  light.position.set(Math.sin(lightAngle) * 5, 0, Math.cos(lightAngle) * 5);
  scene.add(light);

  const renderer = new THREE.WebGLRenderer({
    canvas: moonCanvas,
    antialias: !isMobileDevice,
    alpha: true,
    powerPreference: isMobileDevice ? "default" : "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileDevice ? 1.25 : 2));
  renderer.setClearAlpha(0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const loadingManager = new THREE.LoadingManager();
  const loader = new GLTFLoader(loadingManager);
  const moonModelUrl = new URL("../../assets/models/moon.glb", import.meta.url).href;

  let moonModel = null;

  loadingManager.onProgress = (_url, itemsLoaded, itemsTotal) => {
    if (!itemsTotal) {
      return;
    }

    onProgress?.((itemsLoaded / itemsTotal) * 100);
  };

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

  const gltf = await new Promise((resolve, reject) => {
    loader.load(
      moonModelUrl,
      resolve,
      (event) => {
        if (!event.total) {
          return;
        }

        onProgress?.((event.loaded / event.total) * 100);
      },
      reject
    );
  });

  moonModel = gltf.scene;
  scene.add(moonModel);
  fitMoonModel();
  resizeMoon();
  renderer.render(scene, camera);
  moonContainer.classList.add("is-ready");

  const resizeObserver = new ResizeObserver(() => {
    resizeMoon();
    renderer.render(scene, camera);
  });
  resizeObserver.observe(moonContainer);
  window.addEventListener("resize", resizeMoon);

  const tick = () => {
    if (!document.hidden && moonModel) {
      moonModel.rotation.y += isMobileDevice ? 0.0017 : 0.0025;
      renderer.render(scene, camera);
    }

    window.requestAnimationFrame(tick);
  };

  tick();
  onProgress?.(100);
}

export async function initLoadingPage({
  activeLanguage,
  initHeroMoonData,
  initFooterLocalTime,
  initHorizontalScroll,
  initSiteCursor,
  initLittleAnimation,
}) {
  setLoaderProgress(6);
  initSiteCursor();
  initHeroMoonData(activeLanguage);
  initFooterLocalTime();
  initHorizontalScroll();
  setLoaderProgress(14);

  try {
    await nextFrame();
    await initHeroMoonScene((progressValue) => {
      setLoaderProgress(14 + progressValue * 0.8);
    });
    setLoaderProgress(96);
  } catch (error) {
    console.error("Moon GLB load error:", error);
    setLoaderProgress(100);
    hideLoaderOverlay();
    return;
  }

  await nextFrame();
  setLoaderProgress(100);
  hideLoaderOverlay();

  const scheduleEnhancements = window.requestIdleCallback ?? ((callback) => window.setTimeout(callback, 120));
  scheduleEnhancements(() => {
    initLittleAnimation();
    scheduleFooterGradientInit();
  });
}
