import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import copyCloudfunctions from './plugins/copy-cloudfunctions'

export default defineConfig({
  plugins: [
    uni(),
    copyCloudfunctions(),
  ],
})
