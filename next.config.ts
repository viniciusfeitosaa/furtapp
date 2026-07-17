import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Oculta o badge das Dev Tools (ícone Next.js) no modo desenvolvimento
  // Em produção (npm run build + start) esse badge já não aparece
  devIndicators: false,
  // standalone apenas no build do Docker; no Netlify o runtime cuida disso
  ...(process.env.DOCKER_BUILD ? { output: "standalone" as const } : {}),
};

export default nextConfig;
