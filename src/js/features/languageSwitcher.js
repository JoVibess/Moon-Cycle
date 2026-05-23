import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, siteContent } from "../data/siteContent.js";

const getValueByPath = (source, path) =>
  path.split(".").reduce((value, key) => value?.[key], source);

const getBrowserLanguage = () => {
  const browserLanguage = navigator.languages?.[0] || navigator.language || DEFAULT_LANGUAGE;
  return browserLanguage.toLowerCase().startsWith("fr") ? "fr" : DEFAULT_LANGUAGE;
};

const getLanguageFromPath = () => {
  const firstPathPart = window.location.pathname.split("/").filter(Boolean)[0];
  return SUPPORTED_LANGUAGES.includes(firstPathPart) ? firstPathPart : null;
};

const getLocalizedPath = (language) =>
  language ? `/${language}${window.location.search}${window.location.hash}` : `/${window.location.search}${window.location.hash}`;

const getCanonicalPath = (language) => (language ? `/${language}` : "/");

const updateMetaTag = (selector, attribute, value) => {
  const tag = document.querySelector(selector);
  if (tag) {
    tag.setAttribute(attribute, value);
  }
};

const syncPhaseTitleLines = () => {
  document.querySelectorAll(".phase-title-wrap").forEach((wrap) => {
    const title = wrap.querySelector(".phase-title");
    const line = wrap.querySelector(".line");
    if (title && line) {
      line.style.width = `${title.offsetWidth * 1.2}px`;
    }
  });
};

const applySiteLanguage = (language) => {
  const content = siteContent[language] || siteContent[DEFAULT_LANGUAGE];
  const nextLanguage = language === "fr" ? "en" : "fr";
  const currentPathLanguage = getLanguageFromPath();
  const canonicalUrl = `${window.location.origin}${getCanonicalPath(currentPathLanguage)}`;
  const defaultUrl = `${window.location.origin}/`;
  const alternateEnUrl = `${window.location.origin}/en`;
  const alternateFrUrl = `${window.location.origin}/fr`;

  document.documentElement.lang = language;
  document.title = content.seo.title;

  updateMetaTag('meta[name="description"]', "content", content.seo.description);
  updateMetaTag('meta[property="og:title"]', "content", content.seo.title);
  updateMetaTag('meta[property="og:description"]', "content", content.seo.description);
  updateMetaTag('meta[property="og:url"]', "content", canonicalUrl);
  updateMetaTag('meta[property="og:locale"]', "content", content.seo.locale);
  updateMetaTag('meta[name="twitter:title"]', "content", content.seo.title);
  updateMetaTag('meta[name="twitter:description"]', "content", content.seo.description);
  updateMetaTag('link[rel="canonical"]', "href", canonicalUrl);
  updateMetaTag('link[rel="alternate"][hreflang="en"]', "href", alternateEnUrl);
  updateMetaTag('link[rel="alternate"][hreflang="fr"]', "href", alternateFrUrl);
  updateMetaTag('link[rel="alternate"][hreflang="x-default"]', "href", defaultUrl);

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = getValueByPath(content, element.dataset.i18n);
    if (value) {
      element.textContent = value;
    }
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    const value = getValueByPath(content, element.dataset.i18nAriaLabel);
    if (value) {
      element.setAttribute("aria-label", value);
    }
  });

  document.querySelectorAll("[data-language-switch]").forEach((link) => {
    link.href = getLocalizedPath(nextLanguage);
    link.hreflang = nextLanguage;
  });

  window.requestAnimationFrame(syncPhaseTitleLines);
};

export const initLanguageSwitcher = ({ onLanguageChange } = {}) => {
  let activeLanguage = getLanguageFromPath() || getBrowserLanguage();

  applySiteLanguage(activeLanguage);

  document.querySelectorAll("[data-language-switch]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const targetLanguage = link.getAttribute("hreflang");
      if (!SUPPORTED_LANGUAGES.includes(targetLanguage)) {
        return;
      }

      window.history.pushState(null, "", getLocalizedPath(targetLanguage));
      activeLanguage = targetLanguage;
      applySiteLanguage(targetLanguage);
      onLanguageChange?.(targetLanguage);
    });
  });

  window.addEventListener("popstate", () => {
    activeLanguage = getLanguageFromPath() || getBrowserLanguage();
    applySiteLanguage(activeLanguage);
    onLanguageChange?.(activeLanguage);
  });

  return activeLanguage;
};
