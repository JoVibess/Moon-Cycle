export async function fetchAstronomyByLocation() {
  const response = await fetch("/api/astronomy", {
    headers: {
      Accept: "application/json",
    },
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || "Unable to load astronomy data");
  }

  return payload;
}
