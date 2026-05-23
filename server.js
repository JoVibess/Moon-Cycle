import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleAstronomyRequest, sendJson } from "./astronomyProxy.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");
const indexPath = path.join(distDir, "index.html");
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const astronomyApiKey = process.env.IPGEOLOCATION_API_KEY;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

async function serveFile(filePath, response) {
  const extension = path.extname(filePath);
  const contentType = MIME_TYPES[extension] || "application/octet-stream";

  response.writeHead(200, {
    "Content-Type": contentType,
  });

  createReadStream(filePath).pipe(response);
}

function getRequestOrigin(request) {
  const forwardedProto = request.headers["x-forwarded-proto"];
  const protocol = typeof forwardedProto === "string" && forwardedProto.length > 0
    ? forwardedProto.split(",")[0].trim()
    : "http";
  const hostHeader = request.headers.host || `localhost:${port}`;

  return `${protocol}://${hostHeader}`;
}

async function serveIndex(request, response) {
  if (!existsSync(indexPath)) {
    response.writeHead(503, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Production build not found. Run `npm run build` first.");
    return;
  }

  const requestOrigin = getRequestOrigin(request);
  const html = (await readFile(indexPath, "utf8")).replaceAll("https://mooncycle.local", requestOrigin);
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
  });
  response.end(html);
}

const server = createServer(async (request, response) => {
  const method = request.method || "GET";
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(requestUrl.pathname);

  if (method !== "GET" && method !== "HEAD") {
    response.writeHead(405, {
      Allow: "GET, HEAD",
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Method Not Allowed");
    return;
  }

  if (pathname === "/api/astronomy") {
    await handleAstronomyRequest(request, response, astronomyApiKey);
    return;
  }

  if (pathname === "/health") {
    await sendJson(response, 200, { ok: true });
    return;
  }

  const safeRelativePath = pathname.replace(/^\/+/, "");
  const filePath = path.join(distDir, safeRelativePath);

  if (safeRelativePath && existsSync(filePath)) {
    await serveFile(filePath, response);
    return;
  }

  if (pathname === "/" || pathname === "/en" || pathname === "/fr") {
    await serveIndex(request, response);
    return;
  }

  await serveIndex(request, response);
});

server.listen(port, host, () => {
  console.log(`Moon Cycle server listening on http://${host}:${port}`);
});
