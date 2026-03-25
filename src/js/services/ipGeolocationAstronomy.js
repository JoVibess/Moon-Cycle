const API_KEY = import.meta.env.VITE_IPGEOLOCATION_API_KEY;
const SDK_URL = "https://static.ipgeolocation.io/astronomy-api-plugin.js";

let sdkPromise = null;

// Charge le SDK ipgeolocation dynamiquement (une seule fois via sdkPromise)
function loadAstronomySdk() {
  if (window.AstronomyAPI) {
    return Promise.resolve(window.AstronomyAPI);
  }

  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => {
      if (window.AstronomyAPI) {
        resolve(window.AstronomyAPI);
        return;
      }

      reject(new Error("AstronomyAPI SDK loaded but window.AstronomyAPI is unavailable"));
    };
    script.onerror = () => reject(new Error("Unable to load AstronomyAPI SDK"));
    document.head.appendChild(script);
  });

  return sdkPromise;
}

export function getAstronomyApiKey() {
  return API_KEY;
}

// Appelle l'API astronomy avec la clé injectée par Vite (.env)
// La localisation est déterminée automatiquement par l'IP
export async function fetchAstronomyByLocation() {
  if (!API_KEY) {
    throw new Error("Missing VITE_IPGEOLOCATION_API_KEY");
  }

  const AstronomyAPI = await loadAstronomySdk();

  const client = new AstronomyAPI({ apiKey: API_KEY });

  const result = await client.getAstronomy();

  if (result?.error_message) {
    throw new Error(result.error_message);
  }

  return result;
}
