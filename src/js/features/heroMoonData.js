import SunCalc from "suncalc";
import {
  fetchAstronomyByLocation,
  getAstronomyApiKey,
} from "../services/ipGeolocationAstronomy.js";

function getUserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Traduction des 8 phases lunaires en français
const PHASE_LABELS_FR = {
  NEW_MOON: "Nouvelle lune",
  WAXING_CRESCENT: "Premier croissant",
  FIRST_QUARTER: "Premier quartier",
  WAXING_GIBBOUS: "Gibbeuse croissante",
  FULL_MOON: "Pleine lune",
  WANING_GIBBOUS: "Gibbeuse décroissante",
  LAST_QUARTER: "Dernier quartier",
  WANING_CRESCENT: "Dernier croissant",
};

function formatPhaseName(phase) {
  if (!phase) return "—";
  return PHASE_LABELS_FR[phase.toUpperCase()] ?? phase;
}

// Cherche la prochaine pleine lune par pas de 6h sur 35 jours (SunCalc, phase ≈ 0.5)
function estimateNextFullMoon(referenceDate) {
  const STEP_HOURS = 6;
  const SEARCH_DAYS = 35;
  let bestDate = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let step = 1; step <= (SEARCH_DAYS * 24) / STEP_HOURS; step += 1) {
    const candidate = new Date(referenceDate.getTime() + step * STEP_HOURS * 60 * 60 * 1000);
    const phase = SunCalc.getMoonIllumination(candidate).phase;
    const score = Math.abs(phase - 0.5);

    if (score < bestScore) {
      bestScore = score;
      bestDate = candidate;
    }
  }

  return bestDate;
}

function getDaysUntil(targetDate, referenceDate) {
  const diff = targetDate.getTime() - referenceDate.getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

// Normalise la réponse brute de l'API en données prêtes pour le DOM
function normalizeAstronomyData(apiData, locale, timeZone) {
  const astronomy = apiData.astronomy ?? apiData;
  const currentTime = astronomy.current_time?.slice(0, 5) ?? "--:--";
  const referenceDate = astronomy.date
    ? new Date(`${astronomy.date}T${currentTime}:00`)
    : new Date();
  const nextFullMoon = estimateNextFullMoon(referenceDate);
  const illumination = Math.abs(Number(astronomy.moon_illumination_percentage ?? 0));
  const distance = Number(astronomy.moon_distance ?? 0);

  // Phase 0–1 (SunCalc) utilisée pour positionner le marqueur "Today" sur la timeline
  const phase = SunCalc.getMoonIllumination(referenceDate).phase;

  return {
    dateLabel: new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone,
    }).format(referenceDate),
    timeLabel: currentTime,
    illuminationLabel: `${illumination.toFixed(1)} %`,
    distanceLabel: `${Math.round(distance).toLocaleString(locale)} km`,
    nextFullMoonLabel: nextFullMoon
      ? `${getDaysUntil(nextFullMoon, referenceDate)} days`
      : "--",
    phaseLabel: formatPhaseName(astronomy.moon_phase),
    todayPercent: phase * 100,
  };
}

// Injecte les données dans les éléments DOM ciblés par data-attributes
function updateMoonHeroDom(data) {
  const fields = {
    date: document.querySelector("[data-moon-date]"),
    time: document.querySelector("[data-moon-time]"),
    illumination: document.querySelector("[data-moon-illumination]"),
    nextFullMoon: document.querySelector("[data-moon-next-full]"),
    distance: document.querySelector("[data-moon-distance]"),
    phase: document.querySelector("[data-moon-phase]"),
  };

  if (fields.date) fields.date.textContent = data.dateLabel;
  if (fields.time) fields.time.textContent = data.timeLabel;
  if (fields.illumination) fields.illumination.textContent = data.illuminationLabel;
  if (fields.nextFullMoon) fields.nextFullMoon.textContent = data.nextFullMoonLabel;
  if (fields.distance) fields.distance.textContent = data.distanceLabel;
  if (fields.phase) fields.phase.textContent = data.phaseLabel;

  // Positionne les marqueurs de la timeline selon la phase du cycle lunaire (0–100%)
  const todayEl = document.querySelector("[data-timeline-today]");
  const fullEl = document.querySelector("[data-timeline-full]");
  if (todayEl) todayEl.style.left = `${data.todayPercent.toFixed(1)}%`;
  if (fullEl) fullEl.style.left = "50%";
}

export async function initHeroMoonData() {
  if (!getAstronomyApiKey()) {
    console.warn("Missing VITE_IPGEOLOCATION_API_KEY. Moon data remains static.");
    return;
  }

  const locale = navigator.language || "en-US";
  const timeZone = getUserTimeZone();

  try {
    const apiData = await fetchAstronomyByLocation();
    if (!apiData?.astronomy && !apiData?.moon_phase) {
      console.warn("Astronomy API returned an unexpected payload:", apiData);
      return;
    }
    const normalized = normalizeAstronomyData(apiData, locale, timeZone);
    updateMoonHeroDom(normalized);
  } catch (error) {
    console.error("Unable to load moon data:", error);
  }
}
