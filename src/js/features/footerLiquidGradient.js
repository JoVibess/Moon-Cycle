import * as THREE from "three";

// Couleurs du footer liquid gradient : modifie ces valeurs pour changer le rendu.
const FOOTER_LIQUID_COLORS = {
  base: "#000000",
  coral: "#000000",
  pink: "#ff000d",
  violet: "#670e0e",
  deepPurple: "#ff0000",
  peach: "#654434",
  electricPurple: "#000000",
  touchGlow: "#ffffff",
};

const hexToVector3 = (hex) => {
  const color = new THREE.Color(hex);
  return new THREE.Vector3(color.r, color.g, color.b);
};

const hexToRgbString = (hex) => {
  const color = new THREE.Color(hex);
  return `${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}`;
};

class TouchTexture {
  constructor() {
    this.size = 96;
    this.width = this.size;
    this.height = this.size;
    this.maxAge = 72;
    this.radius = this.size * 0.18;
    this.speed = 1 / this.maxAge;
    this.trail = [];
    this.last = null;
    this.initTexture();
  }

  initTexture() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d");
    this.texture = new THREE.Texture(this.canvas);
    this.clear();
  }

  clear() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  addTouch(point) {
    let force = 0;
    let vx = 0;
    let vy = 0;

    if (this.last) {
      const dx = point.x - this.last.x;
      const dy = point.y - this.last.y;
      const dd = dx * dx + dy * dy;

      if (dd > 0) {
        const distance = Math.sqrt(dd);
        vx = dx / distance;
        vy = dy / distance;
        force = Math.min(dd * 14000, 1.6);
      }
    }

    this.last = { x: point.x, y: point.y };
    this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
  }

  update() {
    this.clear();

    for (let index = this.trail.length - 1; index >= 0; index -= 1) {
      const point = this.trail[index];
      const fade = point.force * this.speed * (1 - point.age / this.maxAge);

      point.x += point.vx * fade;
      point.y += point.vy * fade;
      point.age += 1;

      if (point.age > this.maxAge) {
        this.trail.splice(index, 1);
        continue;
      }

      this.drawPoint(point);
    }

    this.texture.needsUpdate = true;
  }

  drawPoint(point) {
    const position = {
      x: point.x * this.width,
      y: (1 - point.y) * this.height,
    };

    let intensity = 1;
    if (point.age < this.maxAge * 0.3) {
      intensity = Math.sin((point.age / (this.maxAge * 0.3)) * (Math.PI / 2));
    } else {
      const life = 1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7);
      intensity = -life * (life - 2);
    }

    intensity *= Math.max(point.force, 0.35);

    const offset = this.size * 4;
    this.ctx.shadowOffsetX = offset;
    this.ctx.shadowOffsetY = offset;
    this.ctx.shadowBlur = this.radius * 1.25;
    this.ctx.shadowColor = `rgba(${hexToRgbString(FOOTER_LIQUID_COLORS.touchGlow)}, ${0.22 * intensity})`;

    this.ctx.beginPath();
    this.ctx.fillStyle = "rgba(255, 255, 255, 1)";
    this.ctx.arc(position.x - offset, position.y - offset, this.radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

export function initFooterLiquidGradient() {
  const footer = document.querySelector(".panel-footer");
  const canvas = footer?.querySelector(".footer-liquid-canvas");

  if (!footer || !canvas) {
    return;
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearAlpha(0);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const touchTexture = new TouchTexture();

  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uTouchTexture: { value: touchTexture.texture },
    uColor1: { value: hexToVector3(FOOTER_LIQUID_COLORS.coral) },
    uColor2: { value: hexToVector3(FOOTER_LIQUID_COLORS.pink) },
    uColor3: { value: hexToVector3(FOOTER_LIQUID_COLORS.violet) },
    uColor4: { value: hexToVector3(FOOTER_LIQUID_COLORS.deepPurple) },
    uColor5: { value: hexToVector3(FOOTER_LIQUID_COLORS.peach) },
    uColor6: { value: hexToVector3(FOOTER_LIQUID_COLORS.electricPurple) },
    uBase: { value: hexToVector3(FOOTER_LIQUID_COLORS.base) },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform sampler2D uTouchTexture;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform vec3 uColor4;
      uniform vec3 uColor5;
      uniform vec3 uColor6;
      uniform vec3 uBase;

      varying vec2 vUv;

      float grain(vec2 uv) {
        return fract(sin(dot(uv * uResolution.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      vec3 mixGradients(vec2 uv, float time) {
        vec2 center1 = vec2(0.16 + sin(time * 0.23) * 0.10, 0.28 + cos(time * 0.17) * 0.11);
        vec2 center2 = vec2(0.83 + cos(time * 0.18) * 0.10, 0.24 + sin(time * 0.22) * 0.08);
        vec2 center3 = vec2(0.63 + sin(time * 0.20) * 0.14, 0.78 + cos(time * 0.19) * 0.10);
        vec2 center4 = vec2(0.27 + cos(time * 0.15) * 0.12, 0.76 + sin(time * 0.16) * 0.09);
        vec2 center5 = vec2(0.48 + sin(time * 0.14) * 0.09, 0.47 + cos(time * 0.21) * 0.11);
        vec2 center6 = vec2(0.92 + sin(time * 0.24) * 0.08, 0.74 + cos(time * 0.13) * 0.08);

        float inf1 = 1.0 - smoothstep(0.0, 0.52, distance(uv, center1));
        float inf2 = 1.0 - smoothstep(0.0, 0.48, distance(uv, center2));
        float inf3 = 1.0 - smoothstep(0.0, 0.54, distance(uv, center3));
        float inf4 = 1.0 - smoothstep(0.0, 0.46, distance(uv, center4));
        float inf5 = 1.0 - smoothstep(0.0, 0.40, distance(uv, center5));
        float inf6 = 1.0 - smoothstep(0.0, 0.44, distance(uv, center6));

        vec3 color = uBase;
        color += uColor1 * inf1 * 0.95;
        color += uColor2 * inf2 * 0.85;
        color += uColor3 * inf3 * 0.80;
        color += uColor4 * inf4 * 0.78;
        color += uColor5 * inf5 * 0.72;
        color += uColor6 * inf6 * 0.66;

        return color;
      }

      void main() {
        vec2 uv = vUv;
        vec4 touch = texture2D(uTouchTexture, uv);
        float tx = -(touch.r * 2.0 - 1.0);
        float ty = -(touch.g * 2.0 - 1.0);
        float touchStrength = touch.b;

        uv.x += tx * 0.18 * touchStrength;
        uv.y += ty * 0.18 * touchStrength;

        vec2 centered = uv - 0.5;
        float swirl = sin(length(centered) * 12.0 - uTime * 1.5) * 0.012;
        uv += normalize(centered + 0.0001) * swirl;

        vec3 color = mixGradients(uv, uTime);

        float grainValue = grain(uv + uTime * 0.015) - 0.5;
        color += grainValue * 0.08;

        color = clamp(color, vec3(0.0), vec3(1.0));
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  const clock = new THREE.Clock();
  const pointer = { x: 0.5, y: 0.5 };

  const syncSize = () => {
    const rect = footer.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    uniforms.uResolution.value.set(width, height);
    renderer.setSize(width, height, false);
  };

  const updatePointer = (clientX, clientY) => {
    const rect = footer.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    pointer.x = (clientX - rect.left) / rect.width;
    pointer.y = 1 - (clientY - rect.top) / rect.height;

    if (pointer.x < 0 || pointer.x > 1 || pointer.y < 0 || pointer.y > 1) {
      return;
    }

    touchTexture.addTouch(pointer);
  };

  footer.addEventListener("pointermove", (event) => {
    updatePointer(event.clientX, event.clientY);
  });

  footer.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      updatePointer(touch.clientX, touch.clientY);
    },
    { passive: true }
  );

  const resizeObserver = new ResizeObserver(syncSize);
  resizeObserver.observe(footer);
  window.addEventListener("resize", syncSize);
  syncSize();

  const tick = () => {
    uniforms.uTime.value += Math.min(clock.getDelta(), 0.1);
    touchTexture.update();
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
  };

  tick();
}
