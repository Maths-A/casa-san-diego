import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The site is served from https://<user>.github.io/<repo>/ on GitHub Pages,
// so assets need the repo name as a base path. Override with BASE_PATH if the
// repo is renamed or moved to a custom domain (where BASE_PATH should be "/").
const base = process.env.BASE_PATH ?? '/casa-san-diego/'

export default defineConfig({
  base,
  plugins: [react()],
})
