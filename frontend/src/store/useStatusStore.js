import { create } from "zustand"
import axiosInstance from "../services/url.service.js"
import { getSocket } from "../services/chat.service.js"

export const useStatusStore = create((set, get) => ({
  statuses: [],
  loading: false,
  error: null,

  initSocketListeners: () => {
    const socket = getSocket()
    if (!socket) return

    socket.off("new_status")
    socket.off("status_viewed")
    socket.off("status_delated") // using 'delated' as it was spelled in backend
    socket.off("status_liked")

    socket.on("new_status", (newStatus) => {
      set((state) => ({
        statuses: [newStatus, ...state.statuses]
      }))
    })

    socket.on("status_viewed", ({ statusId, viewers }) => {
      set((state) => ({
        statuses: state.statuses.map((status) => 
          status._id === statusId ? { ...status, viewers } : status
        )
      }))
    })

    socket.on("status_delated", (statusId) => {
      set((state) => ({
        statuses: state.statuses.filter((status) => status._id !== statusId)
      }))
    })

    socket.on("status_liked", ({ statusId, likes }) => {
      set((state) => ({
        statuses: state.statuses.map((status) => 
          status._id === statusId ? { ...status, likes } : status
        )
      }))
    })
  },

  fetchStatuses: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await axiosInstance.get("/status/get-status")
      set({ statuses: data.data || data, loading: false })
      get().initSocketListeners()
    } catch (error) {
      console.error("Error fetching statuses:", error)
      set({ error: error?.response?.data?.message || "Failed to fetch statuses", loading: false })
    }
  },

  createStatus: async (formData) => {
    set({ loading: true, error: null })
    try {
      const { data } = await axiosInstance.post("/status/create-status", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      const newStatus = data.data || data
      set((state) => ({
        statuses: [newStatus, ...state.statuses],
        loading: false
      }))
      return newStatus
    } catch (error) {
      console.error("Error creating status:", error)
      set({ error: error?.response?.data?.message || "Failed to create status", loading: false })
      throw error
    }
  },

  viewStatus: async (statusId) => {
    try {
      await axiosInstance.put(`/status/${statusId}/view`)
      // Optimistically update viewers list is hard without current user ID, 
      // but it will be handled by the response or next fetch.
    } catch (error) {
      console.error("Error viewing status:", error)
    }
  },

  toggleLikeStatus: async (statusId) => {
    try {
      const { data } = await axiosInstance.put(`/status/${statusId}/like`)
      // Server returns the updated likes array in data.data or data
      const updatedLikes = data.data || data
      set((state) => ({
        statuses: state.statuses.map((status) => 
          status._id === statusId ? { ...status, likes: updatedLikes } : status
        )
      }))
    } catch (error) {
      console.error("Error toggling like on status:", error)
    }
  },

  deleteStatus: async (statusId) => {
    set({ loading: true, error: null })
    try {
      await axiosInstance.delete(`/status/${statusId}/delete`)
      set((state) => ({
        statuses: state.statuses.filter((status) => status._id !== statusId),
        loading: false
      }))
    } catch (error) {
      console.error("Error deleting status:", error)
      set({ error: error?.response?.data?.message || "Failed to delete status", loading: false })
      throw error
    }
  },

  cleanup: () => {
    set({
      statuses: [],
      error: null
    })
  }
}))
