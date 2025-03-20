/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure for Turbopack compatibility
  turbo: {
    // Add any Turbopack-specific rules here if needed
  },

  // We'll avoid using webpack config since we're using Turbopack
  // Instead, we'll handle Monaco workers in the component itself
};

export default nextConfig;
