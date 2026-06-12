import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, Video } from 'lucide-react'
import { useCallStore } from '../../store/useCallStore'
import { useNavigate } from 'react-router-dom'

const IncomingCallModal = () => {
  const { incomingCall, callStatus, acceptCall, rejectCall } = useCallStore()
  const navigate = useNavigate()
  const audioRef = useRef(null)

  // Play ringtone
  useEffect(() => {
    if (incomingCall && callStatus === 'ringing') {
      // Use the browser's built-in oscillator as a ringtone fallback
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      let oscillator = null
      let interval = null

      const ring = () => {
        oscillator = ctx.createOscillator()
        const gain = ctx.createGain()
        oscillator.connect(gain)
        gain.connect(ctx.destination)
        oscillator.frequency.value = 440
        oscillator.type = 'sine'
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.8)
      }

      ring()
      interval = setInterval(ring, 1500)

      return () => {
        clearInterval(interval)
        ctx.close()
      }
    }
  }, [incomingCall, callStatus])

  const handleAccept = () => {
    acceptCall()
    navigate(`/call/${incomingCall.roomId}`)
  }

  const handleReject = () => {
    rejectCall()
  }

  if (!incomingCall) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -80, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -80, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] w-[340px]"
      >
        {/* Glass card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          {/* Animated ring background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{ scale: [1, 2.5], opacity: [0.12, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
              className="w-24 h-24 rounded-full bg-green-400"
            />
          </div>

          <div className="relative z-10 p-6 flex flex-col items-center gap-4">
            {/* Call type badge */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
              {incomingCall.callType === 'video' ? (
                <Video size={14} className="text-blue-400" />
              ) : (
                <Phone size={14} className="text-green-400" />
              )}
              <span className="text-white/80 text-xs font-medium">
                Incoming {incomingCall.callType === 'video' ? 'Video' : 'Audio'} Call
              </span>
            </div>

            {/* Caller avatar */}
            <div className="relative">
              {incomingCall.callerInfo?.profilePicture ? (
                <img
                  src={incomingCall.callerInfo.profilePicture}
                  alt={incomingCall.callerInfo.username}
                  className="w-20 h-20 rounded-full object-cover border-2 border-white/20 shadow-xl"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                  {incomingCall.callerInfo?.username?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              {/* Pulsing ring around avatar */}
              <motion.div
                animate={{ scale: [1, 1.25], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full border-2 border-green-400"
              />
            </div>

            {/* Caller name */}
            <div className="text-center">
              <h3 className="text-white text-xl font-bold tracking-tight">
                {incomingCall.callerInfo?.username || 'Unknown'}
              </h3>
              <p className="text-white/50 text-sm mt-0.5">
                {incomingCall.isGroup ? 'Group Call' : `${incomingCall.callType === 'video' ? 'Video' : 'Audio'} Call`}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-8 mt-2">
              {/* Reject */}
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleReject}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/40 transition-colors"
                >
                  <PhoneOff size={26} className="text-white" />
                </motion.button>
                <span className="text-white/60 text-xs">Decline</span>
              </div>

              {/* Accept */}
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAccept}
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg shadow-green-500/40 transition-colors"
                >
                  {incomingCall.callType === 'video' ? (
                    <Video size={26} className="text-white" />
                  ) : (
                    <Phone size={26} className="text-white" />
                  )}
                </motion.button>
                <span className="text-white/60 text-xs">Accept</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

export default IncomingCallModal
