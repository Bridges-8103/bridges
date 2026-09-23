import type { NextConfig } from "next";

// Bridges backend is designated to run on port 3001.
// Explicitly disallow running on port 3000 to prevent port collisions and mistaken expectations.
if (process.env.PORT === "3000") {
  console.error(
    "\n\x1b[1m\x1b[31m[PORT ERROR] Bridges backend cannot be started on port 3000.\x1b[0m\n" +
    "\x1b[33mThe backend server is designated to run on port 3001.\x1b[0m\n" +
    "Please start the server with:\n  \x1b[36mnpm run dev\x1b[0m (or pass \x1b[36m-p 3001\x1b[0m)\n"
  );
  throw new Error("Invalid port: 3000. Bridges backend must run on port 3001.");
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
