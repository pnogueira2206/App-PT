import type { NextConfig } from "next";

/**
 * TV mode runs on the gym's old Chromebox (Chrome 76). The app's JavaScript
 * breaks there and wipes the server-rendered page, leaving it blank. TV pages
 * work with plain links and form posts, so block all scripts on them.
 */
const noScripts = [{ key: "Content-Security-Policy", value: "script-src 'none'" }];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/tv", headers: noScripts },
      { source: "/tv/:path*", headers: noScripts },
    ];
  },
};

export default nextConfig;
