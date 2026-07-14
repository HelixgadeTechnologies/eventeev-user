import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";
// @ts-expect-error - next-pwa does not have type definitions
import withPWAInit from "next-pwa";

const withNextIntl = createNextIntlPlugin();

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  images: {
    qualities: [25, 50, 75, 90, 100],
  },
};

export default withPWA(withNextIntl(nextConfig));
