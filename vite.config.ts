import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Esto permite que tu código existente (process.env.API_KEY) funcione
      // leyendo la variable VITE_API_KEY que configurarás en Vercel
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY)
    }
  };
});