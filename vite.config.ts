import { defineConfig } from 'vite'
import nodeResolve from '@rollup/plugin-node-resolve' // Helps in resolving the 'crypto-browserify'
import commonjs from '@rollup/plugin-commonjs' // Convert CommonJS modules to ES6
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true
      }
    }),
    nodeResolve({
      browser: true,
      preferBuiltins: true
    }),
    commonjs()
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      buffer: 'buffer/'
    }
  }
})
