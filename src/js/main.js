import "../css/style.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initLoadingPage } from "./features/loadingPage.js";
import { initHeroMoonData } from "./features/heroMoonData.js";
import { initFooterLocalTime } from "./features/footerLocalTime.js";
import { initLanguageSwitcher } from "./features/languageSwitcher.js";
import { initSiteCursor } from "./features/siteCursor.js";
import { initLittleAnimation } from "./utils/littleAnimation.js";

gsap.registerPlugin(ScrollTrigger);

const activeLanguage = initLanguageSwitcher({
  onLanguageChange: initHeroMoonData,
});

function initHorizontalScroll() {
  const wrap = document.querySelector(".horizontal-wrap");
  const track = document.querySelector(".horizontal-track");
  const spacer = document.querySelector(".horizontal-after-spacer");
  const panels = gsap.utils.toArray(".horizontal-track .panel");

  if (!wrap || !track || !spacer || panels.length <= 1) {
    return;
  }

  const horizontalScrollMedia = gsap.matchMedia();

  horizontalScrollMedia.add("(min-width: 768px)", () => {
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

    const syncSpacerHeight = () => {
      spacer.style.height = `${distance()}px`;
    };

    syncSpacerHeight();

    const horizontalTween = gsap.to(track, {
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

    const handleResize = () => {
      syncSpacerHeight();
      ScrollTrigger.refresh();
    };

    window.addEventListener("resize", handleResize);
    ScrollTrigger.addEventListener("refreshInit", syncSpacerHeight);
    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener("resize", handleResize);
      ScrollTrigger.removeEventListener("refreshInit", syncSpacerHeight);
      horizontalTween.kill();
      spacer.style.height = "0px";
      gsap.set(track, { clearProps: "transform" });
      ScrollTrigger.refresh();
    };
  });
}

initLoadingPage({
  activeLanguage,
  initHeroMoonData,
  initFooterLocalTime,
  initHorizontalScroll,
  initSiteCursor,
  initLittleAnimation,
});
