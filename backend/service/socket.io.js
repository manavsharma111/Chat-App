const { Server } = require('socket.io')
const User = require('../models/User')
const Message = require('../models/Message')
const Conversation = require('../models/Conversation')
const Status = require('../models/Status')

// map to store online user -> userId, socketId
const onlineUsers = new Map()
// map to track typing status -> userId -> [conversation]: boolean
const typingUsers = new Map()
// map to track active calls -> roomId -> Set(participantUserIds)
const activeCallRooms = new Map()

const initializeSocketIO = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        },
        pingTimeout: 60000,
    })

    io.on("connection", (socket) => {
        console.log(`User Is connected ${socket.id}`)
        let userId = null

        // ── User Online ────────────────────────────────────────
        socket.on("user:online", async (connectingUserId) => {
            try {
                userId = connectingUserId
                onlineUsers.set(userId, socket.id)
                socket.join(userId)
                await User.findOneAndUpdate({ _id: userId }, { isOnline: true, lastSeen: new Date() })
                io.emit("user_status", { userId, isOnline: true })
            } catch (e) {
                console.error(e)
            }
        })

        // ── Get User Status ────────────────────────────────────
        socket.on("get_user_status", (requestedUserId, callback) => {
            const isOnline = onlineUsers.has(requestedUserId)
            callback({ userId: requestedUserId, isOnline, lastSeen: isOnline ? new Date() : null })
        })

        // ── Send Message ───────────────────────────────────────
        socket.on("send_message", async (message) => {
            try {
                const receiverSocketId = onlineUsers.get(message.receiverId)
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receive_message", message)
                }
            } catch (e) {
                console.error(e)
                socket.emit("error", e.message)
            }
        })

        // ── Message Read ───────────────────────────────────────
        socket.on("message_read", async (message) => {
            try {
                await Message.updateMany(
                    { _id: { $in: message.messageIds } },
                    { $set: { messageStatus: 'read' } }
                )
                const senderSocketId = onlineUsers.get(message.senderId)
                if (senderSocketId) {
                    message.messageIds.forEach((messageId) => {
                        io.to(senderSocketId).emit("message_read", { messageId, messageStatus: 'read' })
                    })
                }
            } catch (e) {
                console.error(e)
                socket.emit("error", e.message)
            }
        })

        // ── Typing Start ───────────────────────────────────────
        socket.on("typing_start", ({ conversationId, receivedId }) => {
            if (!userId || !conversationId || !receivedId) return
            if (!typingUsers.has(userId)) typingUsers.set(userId, {})
            const userTyping = typingUsers.get(userId)
            userTyping[conversationId] = true
            typingUsers.set(userId, userTyping)
            if (userTyping[`${conversationId}_timeout`]) clearTimeout(userTyping[`${conversationId}_timeout`])
            userTyping[`${conversationId}_timeout`] = setTimeout(() => {
                userTyping[conversationId] = false
                socket.to(receivedId).emit("typing_stop", { userId, conversationId, isTyping: false })
            }, 5000)
            socket.to(receivedId).emit("typing_start", { userId, conversationId, isTyping: true })
        })

        // ── Typing Stop ────────────────────────────────────────
        socket.on("typing_stop", ({ conversationId, receivedId }) => {
            if (!userId || !conversationId || !receivedId) return
            if (!typingUsers.has(userId)) typingUsers.set(userId, {})
            const userTyping = typingUsers.get(userId)
            userTyping[conversationId] = false
            if (userTyping[`${conversationId}_timeout`]) clearTimeout(userTyping[`${conversationId}_timeout`])
            typingUsers.set(userId, userTyping)
            socket.to(receivedId).emit("typing_stop", { userId, conversationId, isTyping: false })
        })

        // ── Reactions ──────────────────────────────────────────
        socket.on("add_reaction", async ({ messageId, emoji, reactionUserId }) => {
            try {
                const message = await Message.findById(messageId)
                if (!message) return
                const existingIndex = message.reactions.findIndex(
                    (r) => r.user && r.user.toString() === reactionUserId.toString()
                )
                if (existingIndex > -1) {
                    if (message.reactions[existingIndex].emoji === emoji) {
                        message.reactions.splice(existingIndex, 1)
                    } else {
                        message.reactions[existingIndex].emoji = emoji
                    }
                } else {
                    message.reactions.push({ user: reactionUserId, emoji })
                }
                await message.save()
                const populateMessage = await Message.findById(message._id)
                    .populate("sender", "username profilePicture")
                    .populate("receiver", "username profilePicture")
                    .populate("reactions.user", "username profilePicture")
                const reactionUpdated = { messageId, reactions: populateMessage.reactions }
                const senderSocketId = onlineUsers.get(populateMessage.sender._id.toString())
                const receiverSocketId = onlineUsers.get(populateMessage.receiver._id.toString())
                if (receiverSocketId) io.to(receiverSocketId).emit("reaction_updated", reactionUpdated)
                if (senderSocketId) io.to(senderSocketId).emit("reaction_updated", reactionUpdated)
            } catch (e) {
                console.error(e)
                socket.emit("error", e.message)
            }
        })

        // ── WebRTC CALL SIGNALING ──────────────────────────────

        // 1. Caller initiates call
        socket.on("call:initiate", ({ roomId, callType, receiverIds, callerInfo }) => {
            if (!userId || !roomId || !receiverIds?.length) return
            if (!activeCallRooms.has(roomId)) activeCallRooms.set(roomId, new Set())
            activeCallRooms.get(roomId).add(userId)

            receiverIds.forEach(receiverId => {
                const receiverSocketId = onlineUsers.get(receiverId)
                if (receiverSocketId) {
                    let isBusy = false
                    activeCallRooms.forEach((participants) => {
                        if (participants.has(receiverId)) isBusy = true
                    })
                    if (isBusy) {
                        socket.emit("call:busy", { receiverId })
                    } else {
                        io.to(receiverSocketId).emit("call:incoming", {
                            roomId, callType, callerInfo, isGroup: receiverIds.length > 1
                        })
                    }
                } else {
                    socket.emit("call:missed", { receiverId })
                }
            })
        })

        // 2. Receiver accepts call
        socket.on("call:accept", ({ roomId, callerId }) => {
            if (!userId || !roomId) return
            if (!activeCallRooms.has(roomId)) activeCallRooms.set(roomId, new Set())
            activeCallRooms.get(roomId).add(userId)
            const callerSocketId = onlineUsers.get(callerId)
            if (callerSocketId) {
                io.to(callerSocketId).emit("call:accepted", { roomId, acceptedBy: userId })
            }
        })

        // 3. Receiver rejects call
        socket.on("call:reject", ({ roomId, callerId }) => {
            if (!userId || !roomId) return
            const callerSocketId = onlineUsers.get(callerId)
            if (callerSocketId) {
                io.to(callerSocketId).emit("call:rejected", { roomId, rejectedBy: userId })
            }
        })

        // 4. WebRTC SDP Signal relay
        socket.on("call:signal", ({ roomId, targetUserId, signal }) => {
            if (!userId || !targetUserId || !signal) return
            const targetSocketId = onlineUsers.get(targetUserId)
            if (targetSocketId) {
                io.to(targetSocketId).emit("call:signal", { roomId, fromUserId: userId, signal })
            }
        })

        // 5. ICE Candidate relay
        socket.on("call:ice-candidate", ({ roomId, targetUserId, candidate }) => {
            if (!userId || !targetUserId) return
            const targetSocketId = onlineUsers.get(targetUserId)
            if (targetSocketId) {
                io.to(targetSocketId).emit("call:ice-candidate", { roomId, fromUserId: userId, candidate })
            }
        })

        // 6. End / Leave call
        socket.on("call:end", ({ roomId, participantIds }) => {
            if (!roomId) return
            if (activeCallRooms.has(roomId)) {
                activeCallRooms.get(roomId).delete(userId)
                if (activeCallRooms.get(roomId).size === 0) activeCallRooms.delete(roomId)
            }
            const targets = participantIds || []
            targets.forEach(pid => {
                if (pid !== userId) {
                    const pSocketId = onlineUsers.get(pid)
                    if (pSocketId) {
                        io.to(pSocketId).emit("call:ended", { roomId, endedBy: userId })
                    }
                }
            })
        })

        // 7. Participant ready — receiver tells caller their stream is ready
        //    so caller can now safely create initiator peer
        socket.on("call:ready", ({ roomId, targetUserId }) => {
            if (!userId || !targetUserId) return
            const targetSocketId = onlineUsers.get(targetUserId)
            if (targetSocketId) {
                io.to(targetSocketId).emit("call:ready", { fromUserId: userId, roomId })
            }
        })

        // ── Disconnect ─────────────────────────────────────────
        const handleDisconnected = async () => {
            if (!userId) return
            try {
                onlineUsers.delete(userId)
                socket.leave(userId)
                if (typingUsers.has(userId)) {
                    const userTyping = typingUsers.get(userId)
                    Object.keys(userTyping).forEach((key) => {
                        if (key.endsWith("_timeout") && userTyping[key]) clearTimeout(userTyping[key])
                    })
                    typingUsers.delete(userId)
                }
                // Clean up active call rooms
                activeCallRooms.forEach((participants, roomId) => {
                    if (participants.has(userId)) {
                        participants.delete(userId)
                        if (participants.size === 0) activeCallRooms.delete(roomId)
                    }
                })
                await User.findOneAndUpdate({ _id: userId }, { isOnline: false, lastSeen: new Date() })
                io.emit("user_status", { userId, isOnline: false, lastSeen: new Date() })
                console.log(`user ${userId} disconnected`)
            } catch (e) {
                console.error(e)
            }
        }

        socket.on("disconnect", handleDisconnected)
    })

    io.socketUserMap = onlineUsers
    return io
}

module.exports = initializeSocketIO
