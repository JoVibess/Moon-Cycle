import { defineConfig, loadEnv } from "vite";
import { handleAstronomyRequest } from "./astronomyProxy.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const astronomyApiKey = env.IPGEOLOCATION_API_KEY;

  return {
    root: "src",
    envDir: "..",
    publicDir: "../public",
    plugins: [
      {
        name: "astronomy-api-dev-proxy",
        configureServer(server) {
          server.middlewares.use("/api/astronomy", async (request, response) => {
            await handleAstronomyRequest(request, response, astronomyApiKey);
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use("/api/astronomy", async (request, response) => {
            await handleAstronomyRequest(request, response, astronomyApiKey);
          });
        },
      },
    ],
    build: {
      outDir: "../dist",
      emptyOutDir: true,
    },
  };
});
