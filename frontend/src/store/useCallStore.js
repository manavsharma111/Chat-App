import { create } from 'zustand'
import { getSocket } from '../services/chat.service.js'

export const useCallStore = create((set, get) => ({
  // State
  incomingCall: null,      // { roomId, callType, callerInfo, isGroup }
  activeCall: null,        // { roomId, callType, participants, isGroup }
  callStatus: 'idle',      // 'idle' | 'ringing' | 'calling' | 'active' | 'ended'

  // ── Actions ──────────────────────────────────────────────

  // Start outgoing call
  initiateCall: ({ roomId, callType, receiverIds, callerInfo }) => {
    const socket = getSocket()
    if (!socket) return

    set({
      callStatus: 'calling',
      activeCall: {
        roomId,
        callType,
        participants: receiverIds,
        isGroup: receiverIds.length > 1,
        isInitiator: true,   // <-- caller creates the offer
      }
    })
    socket.emit('call:initiate', { roomId, callType, receiverIds, callerInfo })
  },

  // Accept incoming call
  acceptCall: () => {
    const socket = getSocket()
    const { incomingCall } = get()
    if (!socket || !incomingCall) return

    socket.emit('call:accept', { roomId: incomingCall.roomId, callerId: incomingCall.callerInfo._id })
    set({
      activeCall: {
        roomId: incomingCall.roomId,
        callType: incomingCall.callType,
        participants: [incomingCall.callerInfo._id],
        isGroup: incomingCall.isGroup,
        callerInfo: incomingCall.callerInfo,
        isInitiator: false,  // <-- receiver waits for offer, creates answer
      },
      callStatus: 'active',
      incomingCall: null,
    })
  },

  // Reject incoming call
  rejectCall: () => {
    const socket = getSocket()
    const { incomingCall } = get()
    if (!socket || !incomingCall) return

    socket.emit('call:reject', { roomId: incomingCall.roomId, callerId: incomingCall.callerInfo._id })
    set({ incomingCall: null, callStatus: 'idle' })
  },

  // End active call
  endCall: (participantIds = []) => {
    const socket = getSocket()
    const { activeCall } = get()
    if (socket && activeCall) {
      socket.emit('call:end', { roomId: activeCall.roomId, participantIds })
    }
    set({ activeCall: null, callStatus: 'idle', incomingCall: null })
  },

  // Called by receiver when call is accepted (caller side)
  onCallAccepted: ({ roomId, acceptedBy }) => {
    set((state) => ({
      callStatus: 'active',
      activeCall: state.activeCall
        ? { ...state.activeCall, participants: [...(state.activeCall.participants || []), acceptedBy] }
        : null,
    }))
  },

  // Set incoming call
  setIncomingCall: (callData) => {
    set({ incomingCall: callData, callStatus: 'ringing' })
  },

  // Initialize socket listeners for call events
  initCallListeners: () => {
    const socket = getSocket()
    if (!socket) return

    socket.off('call:incoming')
    socket.off('call:accepted')
    socket.off('call:rejected')
    socket.off('call:ended')
    socket.off('call:busy')
    socket.off('call:missed')

    socket.on('call:incoming', (callData) => {
      get().setIncomingCall(callData)
    })

    socket.on('call:accepted', ({ roomId, acceptedBy }) => {
      get().onCallAccepted({ roomId, acceptedBy })
    })

    socket.on('call:rejected', ({ roomId, rejectedBy }) => {
      set((state) => {
        if (state.activeCall?.roomId === roomId) {
          return { callStatus: 'ended' }
        }
        return {}
      })
      // Auto reset after 2s
      setTimeout(() => set({ callStatus: 'idle', activeCall: null }), 2000)
    })

    socket.on('call:ended', ({ roomId, endedBy }) => {
      set({ activeCall: null, callStatus: 'idle' })
    })

    socket.on('call:busy', ({ receiverId }) => {
      console.log(`User ${receiverId} is busy`)
    })
  },

  cleanup: () => {
    set({ incomingCall: null, activeCall: null, callStatus: 'idle' })
  },
}))
