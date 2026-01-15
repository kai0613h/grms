import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

const isRunningInDocker = (): boolean => {
  try {
    return fs.existsSync('/.dockerenv');
  } catch {
    return false;
  }
};

const isLocalhostTarget = (target: string): boolean => {
  try {
    const url = new URL(target);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const runningInDocker = isRunningInDocker();
  const defaultTarget = runningInDocker ? 'http://backend:8000' : 'http://localhost:8000';
  let proxyTarget = env.VITE_PROXY_TARGET?.trim() || defaultTarget;
  if (runningInDocker && isLocalhostTarget(proxyTarget)) {
    // Inside docker, localhost points to the frontend container, not the backend.
    proxyTarget = 'http://backend:8000';
  }
  return {
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    server: {
      host: true,
      port: 5173,
      watch: {
        usePolling: true
      },
      allowedHosts: ['.trycloudflare.com'],
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    }
  };
});
