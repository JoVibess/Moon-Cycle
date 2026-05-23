import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const MOON_ORDER = [3, 4, 5, 6, 7, 8, 1, 2];
const STACK_POSITION = { left: "13%", top: "50%" };

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

  const finalPositions = new Map(
    moons.map((moon) => [
      moon,
      {
        left: window.getComputedStyle(moon).getPropertyValue("--moon-left").trim(),
        top: window.getComputedStyle(moon).getPropertyValue("--moon-top").trim(),
      },
    ])
  );

  const resetDiagram = () => {
    moons.forEach((moon) => {
      gsap.set(moon, {
        left: STACK_POSITION.left,
        top: STACK_POSITION.top,
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

  resetDiagram();

  const timeline = gsap.timeline({
    paused: true,
    defaults: { ease: "power3.out" },
  });

  moons.forEach((moon, index) => {
    const position = finalPositions.get(moon);

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

  let hasPlayed = false;

  const playAnimationOnce = () => {
    if (hasPlayed) {
      return;
    }

    hasPlayed = true;
    timeline.play(0);
  };

  ScrollTrigger.create({
    trigger: "#section-2",
    start: "left 15%",
    end: "right 85%",
    containerAnimation: ScrollTrigger.getById("horizontal-scroll")?.animation,
    onEnter: playAnimationOnce,
    onEnterBack: playAnimationOnce,
  });
}
