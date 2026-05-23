export function initFooterLocalTime() {
  const timeElement = document.querySelector("[data-local-time]");

  if (!timeElement) {
    return;
  }

  const timeFormatter = new Intl.DateTimeFormat(navigator.language || "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const updateTime = () => {
    timeElement.textContent = timeFormatter.format(new Date());
  };

  updateTime();
  window.setInterval(updateTime, 1000);
}
