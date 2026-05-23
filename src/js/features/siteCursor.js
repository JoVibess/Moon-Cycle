export function initSiteCursor() {
  const cursor = document.querySelector("[data-site-cursor]");

  if (!cursor || window.matchMedia("(pointer: coarse)").matches) {
    cursor?.remove();
    return;
  }

  let currentX = window.innerWidth / 2;
  let currentY = window.innerHeight / 2;
  let targetX = currentX;
  let targetY = currentY;

  const moveCursor = () => {
    currentX += (targetX - currentX) * 0.22;
    currentY += (targetY - currentY) * 0.22;

    cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    window.requestAnimationFrame(moveCursor);
  };

  window.addEventListener("pointermove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    cursor.classList.add("is-visible");
  });

  document.addEventListener("pointerleave", () => {
    cursor.classList.remove("is-visible");
  });

  document.addEventListener("pointerenter", () => {
    cursor.classList.add("is-visible");
  });

  moveCursor();
}
