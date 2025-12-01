import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno del sistema y de archivos .env
  // Usamos casting a 'any' en process para evitar errores de tipo en algunos entornos
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Extraemos las variables críticas
  const apiKey = env.VITE_API_KEY || process.env.API_KEY || '';
  const supabaseUrl = env.VITE_SUPABASE_URL || '';
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Polyfill de process.env para que esté disponible globalmente en el navegador
      'process.env': {
        API_KEY: apiKey,
        VITE_SUPABASE_URL: supabaseUrl,
        VITE_SUPABASE_ANON_KEY: supabaseKey
      }
    }
  };
});