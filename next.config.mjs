/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Google extended component library ships Lit-based ESM web components;
  // let Next transpile it so it bundles cleanly.
  transpilePackages: ['@googlemaps/extended-component-library'],
};

export default nextConfig;
