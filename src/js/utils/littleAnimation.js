// Ajuste la largeur de .line à 1.8× la largeur du titre dans chaque .phase-title-wrap
const syncPhaseTitleLines = () => {
    document.querySelectorAll(".phase-title-wrap").forEach((wrap) => {
      const title = wrap.querySelector(".phase-title");
      const line  = wrap.querySelector(".line");
      if (title && line) {
        line.style.width = `${title.offsetWidth * 1.2}px`;
      }
    });
  };
  
  syncPhaseTitleLines();


// Navigation via les boutons .phase-pagination-prev / .phase-pagination-next
const wrap   = document.querySelector(".horizontal-wrap");
const track  = document.querySelector(".horizontal-track");
const panels = Array.from(document.querySelectorAll(".horizontal-track .panel"));

const scrollToPanel = (target) => {
    if (target === "footer") {
      document.querySelector("#section-4")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const panelIndex = parseInt(target, 10);
    if (isNaN(panelIndex) || !wrap || !track) return;
    const totalDistance = Math.max(0, track.scrollWidth - window.innerWidth);
    const ratio = panels.length > 1 ? panelIndex / (panels.length - 1) : 0;
    const targetY = wrap.getBoundingClientRect().top + window.scrollY + ratio * totalDistance;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  document.querySelectorAll(".phase-pagination-prev, .phase-pagination-next").forEach((btn) => {
    btn.addEventListener("click", () => scrollToPanel(btn.dataset.panel));
  });

  document.querySelector(".footer-arrow")?.addEventListener("click", () => {
    scrollToPanel("2");
  });
  
