import type { NextConfig } from "next";

console.log("[next.config] process.argv:", process.argv);
console.log("[next.config] process.env.PORT:", process.env.PORT);

// Ensure dev and start servers run on port 3001 and reject port 3000

const isDevOrStart = process.argv.some((arg) => arg === "dev" || arg === "start");

if (isDevOrStart) {
  const getRequestedPort = (): number => {
    // Check CLI arguments for -p or --port
    for (let i = 0; i < process.argv.length; i++) {
      const arg = process.argv[i];
      if (arg === "-p" || arg === "--port") {
        const nextArg = process.argv[i + 1];
        if (nextArg) return parseInt(nextArg, 10);
      }
      if (arg.startsWith("--port=")) {
        return parseInt(arg.split("=")[1], 10);
      }
    }
    // Check environment variable
    if (process.env.PORT) {
      return parseInt(process.env.PORT, 10);
    }
    // Default port used by Next.js if none specified
    return 3000;
  };

  const port = getRequestedPort();
  if (port === 3000) {
    console.error("\n\x1b[1m\x1b[31m[PORT ERROR] Bridges backend cannot be started on port 3000.\x1b[0m");
    console.error("\x1b[33mThe backend server is designated to run on port 3001.\x1b[0m");
    console.error("Please start the server with:\n  \x1b[36mnpm run dev\x1b[0m (or pass \x1b[36m-p 3001\x1b[0m)\n");
    throw new Error("Invalid port: 3000. Bridges backend must run on port 3001.");
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

