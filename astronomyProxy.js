export function getClientIp(request) {
  const forwardedFor = request.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  const remoteAddress = request.socket.remoteAddress;

  if (!remoteAddress) {
    return null;
  }

  if (remoteAddress.startsWith("::ffff:")) {
    return remoteAddress.slice(7);
  }

  return remoteAddress;
}

function isPublicIp(ipAddress) {
  if (!ipAddress) {
    return false;
  }

  const normalizedIp = ipAddress.toLowerCase();
  const ipv4Match = normalizedIp.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);

  if (ipv4Match) {
    const firstOctet = Number(ipv4Match[1]);
    const secondOctet = Number(ipv4Match[2]);

    if (firstOctet === 10 || firstOctet === 127) {
      return false;
    }

    if (firstOctet === 192 && secondOctet === 168) {
      return false;
    }

    if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) {
      return false;
    }
  }

  return !(
    normalizedIp === "::1" ||
    normalizedIp.startsWith("fc") ||
    normalizedIp.startsWith("fd")
  );
}

export function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

export async function handleAstronomyRequest(request, response, astronomyApiKey) {
  if (!astronomyApiKey) {
    return sendJson(response, 503, {
      error: "IPGEOLOCATION_API_KEY is not configured on the server",
    });
  }

  const upstreamUrl = new URL("https://api.ipgeolocation.io/v3/astronomy");
  upstreamUrl.searchParams.set("apiKey", astronomyApiKey);

  const clientIp = getClientIp(request);
  if (isPublicIp(clientIp)) {
    upstreamUrl.searchParams.set("ip", clientIp);
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    const rawBody = await upstreamResponse.text();
    let payload = null;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = null;
    }

    if (!upstreamResponse.ok) {
      return sendJson(response, upstreamResponse.status, {
        error:
          payload?.message ||
          payload?.error_message ||
          "Astronomy provider request failed",
      });
    }

    return sendJson(response, 200, payload);
  } catch (error) {
    return sendJson(response, 502, {
      error: error instanceof Error ? error.message : "Astronomy provider request failed",
    });
  }
}
