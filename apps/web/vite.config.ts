import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for a lightweight React + TypeScript frontend.
// 軽量な React + TypeScript フロントエンド向けの Vite 設定。
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
});
