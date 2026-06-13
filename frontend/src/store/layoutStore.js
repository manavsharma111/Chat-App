import {create} from 'zustand'
import { persist } from 'zustand/middleware'

const useLayoutStore = create(
    persist(
        (set) => ({
    activeTab:'chats',
    selectedContact:null,
    clickPosition: null,
    pageClickPosition: null,
    setSelectedContact: (contact) => set({ selectedContact: contact }),
    setClickPosition: (pos) => set({ clickPosition: pos }),
    setPageClickPosition: (pos) => set({ pageClickPosition: pos }),
    setActiveTab: (tab) => set({ activeTab: tab }),
}),{
    name:'layout-store',
    getStorage: () => localStorage,
  }
))

export default useLayoutStore