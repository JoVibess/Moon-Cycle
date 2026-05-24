import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const MOON_ORDER = [3, 4, 5, 6, 7, 8, 1, 2];
const ORBIT_INSET_RATIO = 0.12;
const ORBIT_ANGLES = {
  1: Math.PI,
  2: (5 * Math.PI) / 4,
  3: (3 * Math.PI) / 2,
  4: (7 * Math.PI) / 4,
  5: 0,
  6: Math.PI / 4,
  7: Math.PI / 2,
  8: (3 * Math.PI) / 4,
};

const getOrbitPosition = (diagram, moonIndex) => {
  const size = diagram.getBoundingClientRect().width;
  const center = size / 2;
  const radius = size * (0.5 - ORBIT_INSET_RATIO);
  const angle = ORBIT_ANGLES[moonIndex];

  return {
    left: center + Math.cos(angle) * radius,
    top: center + Math.sin(angle) * radius,
  };
};

const getMoonIndex = (moon) => {
  const moonClass = Array.from(moon.classList).find((className) =>
    className.startsWith("moon-cycle-diagram__moon--")
  );

  return Number(moonClass?.replace("moon-cycle-diagram__moon--", ""));
};

export function initMoonCycleDiagram() {
  const diagram = document.querySelector(".moon-cycle-diagram");

  if (!diagram) {
    return;
  }

  const moons = MOON_ORDER
    .map((index) => diagram.querySelector(`.moon-cycle-diagram__moon--${index}`))
    .filter(Boolean);

  const centerLoop = diagram.querySelector(".moon-cycle-diagram__center");

  if (!moons.length || !centerLoop) {
    return;
  }

  let timeline = null;
  let hasPlayed = false;

  const resetDiagram = () => {
    const stackPosition = getOrbitPosition(diagram, 1);

    moons.forEach((moon) => {
      gsap.set(moon, {
        left: stackPosition.left,
        top: stackPosition.top,
        opacity: 1,
        scale: 1,
        zIndex: moon.classList.contains("moon-cycle-diagram__moon--1") ? 3 : 2,
      });
    });

    gsap.set(centerLoop, {
      opacity: 0,
      scale: 0.82,
      rotation: -18,
      transformOrigin: "50% 50%",
    });
  };

  const buildTimeline = () => {
    timeline?.kill();
    resetDiagram();

    timeline = gsap.timeline({
      paused: true,
      defaults: { ease: "power3.out" },
    });

    moons.forEach((moon, index) => {
      const moonIndex = getMoonIndex(moon);
      const position = getOrbitPosition(diagram, moonIndex);

      timeline.to(
        moon,
        {
          zIndex: 4,
          left: position.left,
          top: position.top,
          scale: 1,
          duration: 0.62,
        },
        index * 0.12
      );
    });

    timeline.to(
      centerLoop,
      {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 1.05,
        ease: "power2.out",
      },
      0.28
    );

    if (hasPlayed) {
      timeline.progress(1);
    }
  };

  buildTimeline();

  const resizeObserver = new ResizeObserver(buildTimeline);
  resizeObserver.observe(diagram);

  const playAnimationOnce = () => {
    if (hasPlayed || !timeline) {
      return;
    }

    hasPlayed = true;
    timeline.play(0);
  };

  const horizontalScroll = ScrollTrigger.getById("horizontal-scroll");

  ScrollTrigger.create({
    trigger: "#section-2",
    start: horizontalScroll ? "left 15%" : "top 65%",
    end: horizontalScroll ? "right 85%" : "bottom 35%",
    containerAnimation: horizontalScroll?.animation,
    onEnter: playAnimationOnce,
    onEnterBack: playAnimationOnce,
  });
}
