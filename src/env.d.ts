/// <reference types="@dcloudio/types" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare namespace UniApp {
  interface Uni {
    cloud: {
      init: (options: { env: string; traceUser?: boolean }) => void
      callFunction: (options: { name: string; data?: any }) => Promise<any>
      database: () => any
    }
  }
}
