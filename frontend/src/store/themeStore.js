import {create} from 'zustand'
import { persist } from 'zustand/middleware'

const useThemeStore = create(
    persist(
        (set) => ({
    theme: 'light', // 'light' or 'dark'
    chatBackground: 'default', // 'default', color hex, gradient, or base64 data URL
    primaryColor: '#b04f91', // default primary chat color
    setTheme: (theme) => set({ theme }),
    setChatBackground: (chatBackground) => set({ chatBackground }),
    setPrimaryColor: (primaryColor) => set({ primaryColor }),
}),{
    name:'theme-store',
    getStorage: () => localStorage,
  }
))

export default useThemeStore 