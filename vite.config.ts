import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' 로 두면 GitHub Pages 하위 경로(/dokkaebi/)에서도 그대로 동작합니다.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // 도술·스타일·물품 아이콘(100개 넘음)은 JS 에 넣지 않고 따로 두어, 화면에 보일 때만 내려받게 함
    assetsInlineLimit: (file) => (/[\\/]assets[\\/](skills|styles|items)[\\/]/.test(file) ? false : undefined),
  },
});
