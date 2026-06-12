import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import SimplePeer from 'simple-peer'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Monitor, Users, Volume2, VolumeX, Maximize2, Minimize2
} from 'lucide-react'
import { getSocket } from '../../services/chat.service.js'
import { useCallStore } from '../../store/useCallStore.js'
import useUserStore from '../../store/useUserStore.js'

// ── Remote Video / Audio Tile ─────────────────────────────────
const RemoteVideo = ({ stream, userInfo, isMuted }) => {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      // Force play to satisfy browser autoplay policies
      videoRef.current.play().catch(() => {})
    }
  }, [stream])

  // Sync mute state with prop
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted
    }
  }, [isMuted])

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gray-800 flex items-center justify-center min-h-[200px]">
      {/* Video element — handles both video and audio tracks */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Avatar fallback when no video stream */}
      {!stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
            {userInfo?.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <p className="text-white/60 text-sm">{userInfo?.username || 'Connecting...'}</p>
        </div>
      )}

      {/* Name badge */}
      <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
        <span className="text-white text-xs font-medium">{userInfo?.username || 'Remote'}</span>
        {isMuted && <VolumeX size={10} className="text-red-400" />}
      </div>
    </div>
  )
}

// ── Main CallRoom ─────────────────────────────────────────────
const CallRoom = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const socket = getSocket()
  const { user } = useUserStore()
  const { activeCall, endCall } = useCallStore()

  const [peers, setPeers] = useState({})        // { userId: { peer, stream, userInfo } }
  const [localStream, setLocalStream] = useState(null)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(activeCall?.callType === 'video')
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')

  const localVideoRef = useRef(null)
  const peersRef = useRef({})
  const localStreamRef = useRef(null)
  const controlsTimeoutRef = useRef(null)

  const callType = activeCall?.callType || 'audio'
  const isVideo = callType === 'video'
  const isInitiator = activeCall?.isInitiator === true

  const formatDuration = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // ── Create SimplePeer ────────────────────────────────────────
  const createPeer = useCallback((targetUserId, initiator, stream) => {
    console.log(`Creating peer for ${targetUserId}, initiator=${initiator}`)

    const peer = new SimplePeer({
      initiator,
      trickle: true,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
        ]
      }
    })

    peer.on('signal', (signal) => {
      socket?.emit('call:signal', { roomId, targetUserId, signal })
    })

    peer.on('stream', (remoteStream) => {
      console.log(`Got stream from ${targetUserId}`, remoteStream.getTracks())
      setConnectionStatus('Connected')
      setPeers(prev => ({
        ...prev,
        [targetUserId]: { ...prev[targetUserId], stream: remoteStream }
      }))
    })

    peer.on('connect', () => {
      console.log(`Peer connected with ${targetUserId}`)
      setConnectionStatus('Connected')
    })

    peer.on('error', (err) => {
      console.error(`Peer error with ${targetUserId}:`, err.message)
    })

    peer.on('close', () => {
      setPeers(prev => {
        const updated = { ...prev }
        delete updated[targetUserId]
        return updated
      })
      delete peersRef.current[targetUserId]
    })

    return peer
  }, [roomId, socket])

  // ── Main Setup ───────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !socket || !user) return

    const pendingSignals = [] // queue signals that arrive before stream is ready

    const setupCall = async () => {
      let stream = null

      // Try video+audio → fallback audio-only → fail gracefully
      if (isVideo) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        } catch {
          console.warn('Camera busy/denied, trying audio-only')
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            setIsCamOn(false)
          } catch (e) {
            alert(`Cannot access microphone: ${e.message}`)
            navigate(-1)
            return
          }
        }
      } else {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        } catch (e) {
          alert(`Cannot access microphone: ${e.message}`)
          navigate(-1)
          return
        }
      }

      localStreamRef.current = stream
      setLocalStream(stream)

      if (localVideoRef.current && stream.getVideoTracks().length > 0) {
        localVideoRef.current.srcObject = stream
      }

      // ── RECEIVER: tell all participants "I'm ready" ──────────
      // Caller will create the WebRTC peer AFTER receiving this
      if (!isInitiator && activeCall?.participants?.length > 0) {
        activeCall.participants.forEach(callerId => {
          socket.emit('call:ready', { roomId, targetUserId: callerId })
        })
      }

      // ── CALLER: if receiver is already ready (race), drain pending ─
      pendingSignals.forEach(({ fromUserId, signal }) => {
        if (!peersRef.current[fromUserId]) {
          const peer = createPeer(fromUserId, false, stream)
          peersRef.current[fromUserId] = peer
          setPeers(prev => ({
            ...prev,
            [fromUserId]: { peer, stream: null, userInfo: { username: fromUserId } }
          }))
        }
        try { peersRef.current[fromUserId]?.signal(signal) } catch (e) {}
      })
      pendingSignals.length = 0
    }

    setupCall()

    // ── Timer ─────────────────────────────────────────────────
    const timer = setInterval(() => setCallDuration(d => d + 1), 1000)

    // ── Socket Events ─────────────────────────────────────────

    // Receiver says "I'm ready" → Caller NOW creates initiator peer
    const handleReady = ({ fromUserId }) => {
      if (!isInitiator) return
      if (!localStreamRef.current) {
        // Our stream isn't ready yet — will be handled after setupCall completes
        return
      }
      if (peersRef.current[fromUserId]) return // already created

      console.log(`Receiver ${fromUserId} is ready — creating initiator peer`)
      const peer = createPeer(fromUserId, true, localStreamRef.current)
      peersRef.current[fromUserId] = peer
      setPeers(prev => ({
        ...prev,
        [fromUserId]: { peer, stream: null, userInfo: { username: fromUserId } }
      }))
    }

    // Relay SDP signals between peers
    const handleSignal = ({ fromUserId, signal }) => {
      if (!localStreamRef.current) {
        pendingSignals.push({ fromUserId, signal })
        return
      }

      if (peersRef.current[fromUserId]) {
        try { peersRef.current[fromUserId].signal(signal) } catch (e) {
          console.warn('Signal error:', e.message)
        }
      } else {
        // Non-initiator receiving the first offer from a new peer
        const peer = createPeer(fromUserId, false, localStreamRef.current)
        peersRef.current[fromUserId] = peer
        setPeers(prev => ({
          ...prev,
          [fromUserId]: { peer, stream: null, userInfo: { username: fromUserId } }
        }))
        try { peer.signal(signal) } catch (e) {
          console.warn('Signal error:', e.message)
        }
      }
    }

    const handleCallEnded = () => handleEndCall(false)

    socket.on('call:ready', handleReady)
    socket.on('call:signal', handleSignal)
    socket.on('call:ended', handleCallEnded)

    // Auto-hide controls
    const resetControlsTimer = () => {
      setShowControls(true)
      clearTimeout(controlsTimeoutRef.current)
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000)
    }
    document.addEventListener('mousemove', resetControlsTimer)
    document.addEventListener('touchstart', resetControlsTimer)

    return () => {
      clearInterval(timer)
      clearTimeout(controlsTimeoutRef.current)
      socket.off('call:ready', handleReady)
      socket.off('call:signal', handleSignal)
      socket.off('call:ended', handleCallEnded)
      document.removeEventListener('mousemove', resetControlsTimer)
      document.removeEventListener('touchstart', resetControlsTimer)
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      Object.values(peersRef.current).forEach(p => { try { p.destroy() } catch (e) {} })
    }
  }, [roomId, socket, user])

  // ── Controls ──────────────────────────────────────────────
  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (track) { track.enabled = !track.enabled; setIsMicOn(track.enabled) }
  }

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (track) { track.enabled = !track.enabled; setIsCamOn(track.enabled) }
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        const newTrack = camStream.getVideoTracks()[0]
        Object.values(peersRef.current).forEach(p => {
          const sender = p._pc?.getSenders?.().find(s => s.track?.kind === 'video')
          if (sender) sender.replaceTrack(newTrack)
        })
        localStreamRef.current?.getVideoTracks().forEach(t => t.stop())
        if (localVideoRef.current) localVideoRef.current.srcObject = camStream
        localStreamRef.current = camStream
        setLocalStream(camStream)
        setIsScreenSharing(false)
      } catch (e) { console.error(e) }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const screenTrack = screenStream.getVideoTracks()[0]
        Object.values(peersRef.current).forEach(p => {
          const sender = p._pc?.getSenders?.().find(s => s.track?.kind === 'video')
          if (sender) sender.replaceTrack(screenTrack)
        })
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream
        screenTrack.onended = toggleScreenShare
        setIsScreenSharing(true)
      } catch (e) { console.error(e) }
    }
  }

  const handleEndCall = (emitEvent = true) => {
    if (emitEvent) endCall(activeCall?.participants || [])
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    Object.values(peersRef.current).forEach(p => { try { p.destroy() } catch (e) {} })
    navigate(-1)
  }

  const participantCount = Object.keys(peers).length
  const totalTiles = participantCount + 1

  return (
    <div
      className="fixed inset-0 z-[998] bg-gray-950 flex flex-col"
      onClick={() => { setShowControls(true) }}
    >
      {/* ── Video Grid ──────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {participantCount > 0 ? (
          // Connected: show video grid
          <div
            className={`w-full h-full grid gap-2 p-2 ${
              totalTiles === 2 ? 'grid-cols-1 grid-rows-2 sm:grid-cols-2 sm:grid-rows-1' :
              totalTiles <= 4 ? 'grid-cols-2 grid-rows-2' :
              'grid-cols-3 grid-rows-2'
            }`}
          >
            {Object.entries(peers).map(([uid, { stream: remoteStream, userInfo }]) => (
              <RemoteVideo
                key={uid}
                stream={remoteStream}
                userInfo={userInfo}
                isMuted={!isSpeakerOn}
              />
            ))}

            {/* Local tile */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-800">
              {isVideo && localStream ? (
                <video ref={localVideoRef} autoPlay muted playsInline
                  className="w-full h-full object-cover scale-x-[-1]" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 min-h-[180px]">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-white/50 text-xs">You</p>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                <span className="text-white text-xs font-medium">You</span>
              </div>
              {!isMicOn && (
                <div className="absolute top-2 right-2 bg-red-500/80 p-1 rounded-full">
                  <MicOff size={12} className="text-white" />
                </div>
              )}
            </div>
          </div>
        ) : (
          // Waiting state
          <div className="w-full h-full relative">
            <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center gap-5">
              <div className="relative">
                {activeCall?.callerInfo?.profilePicture ? (
                  <img src={activeCall.callerInfo.profilePicture}
                    className="w-28 h-28 rounded-full border-4 border-white/20 object-cover" />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-5xl font-bold">
                    {activeCall?.callerInfo?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <motion.div
                  animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                  className="absolute inset-0 rounded-full border-2 border-green-400"
                />
              </div>
              <div className="text-center">
                <p className="text-white text-xl font-semibold">
                  {activeCall?.callerInfo?.username || 'Calling...'}
                </p>
                <motion.p
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-white/50 text-sm mt-1"
                >
                  {connectionStatus}
                </motion.p>
              </div>
            </div>

            {/* PiP local video while waiting */}
            {isVideo && localStream && (
              <div className="absolute top-4 right-4 w-32 h-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-800">
                <video ref={localVideoRef} autoPlay muted playsInline
                  className="w-full h-full object-cover scale-x-[-1]" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Top HUD ─────────────────────────────────────── */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between pointer-events-none"
          >
            <div>
              <p className="text-white font-semibold">{activeCall?.callerInfo?.username || roomId}</p>
              <p className="text-white/60 text-sm">{formatDuration(callDuration)}</p>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Users size={14} />
              <span>{totalTiles}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Controls Bar ────────────────────────────────── */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className="absolute bottom-0 left-0 right-0 p-6 pb-10 bg-gradient-to-t from-black/80 to-transparent"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-center gap-4">
              {/* Mic */}
              <motion.button whileTap={{ scale: 0.9 }} onClick={toggleMic}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isMicOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'}`}>
                {isMicOn ? <Mic size={22} className="text-white" /> : <MicOff size={22} className="text-white" />}
              </motion.button>

              {/* Camera */}
              {isVideo && (
                <motion.button whileTap={{ scale: 0.9 }} onClick={toggleCamera}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isCamOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'}`}>
                  {isCamOn ? <Video size={22} className="text-white" /> : <VideoOff size={22} className="text-white" />}
                </motion.button>
              )}

              {/* Screen Share */}
              {isVideo && (
                <motion.button whileTap={{ scale: 0.9 }} onClick={toggleScreenShare}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isScreenSharing ? 'bg-blue-500' : 'bg-white/20 hover:bg-white/30'}`}>
                  <Monitor size={22} className="text-white" />
                </motion.button>
              )}

              {/* Speaker */}
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isSpeakerOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'}`}>
                {isSpeakerOn ? <Volume2 size={22} className="text-white" /> : <VolumeX size={22} className="text-white" />}
              </motion.button>

              {/* End Call */}
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleEndCall(true)}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-600/50 transition-colors">
                <PhoneOff size={26} className="text-white" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CallRoom
