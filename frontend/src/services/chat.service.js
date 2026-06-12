import {io} from "socket.io-client"
import useUserStore from "../store/useUserStore"
const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
import axios from "axios"

let socket = null

// initialize socket
export const initializeSocket=()=>{
  if(socket) return socket

  const user = useUserStore.getState().user

    let URL = VITE_BACKEND_URL
    socket = io(URL,{
        withCredentials:true,
        transports:['websocket',"polling"],
        reconnection:true,
        reconnectionAttempts:5,
        reconnectionDelay:1000,
    })
    // connect events from backend
    socket.on("connect",()=>{
        console.log("Connected to server", socket.id)
        socket.emit("user:online",user._id)
    })
    socket.on("connect_error",(error)=>{
        console.log("Socket connection error:", error)
    })
    // disconnect
    socket.on("disconnect", (reason)=>{
        console.log("Disconnect from server due to ", reason)
    })

}
// get socket 
export const getSocket = () =>{
    if(!socket) initializeSocket()
    return socket
}

// disconnect socket
export const disconnectSocket = () =>{
    if(socket) {
        socket.disconnect()
        socket = null
    }
}


// Send message
export const sendMessage = ({ conversationId, message, receiverId }) => {
    const socket = getSocket()
    if (socket) {
        socket.emit('send_message', {
            conversationId,
            message,
            senderId: useUserStore.getState().user._id,
            receiverId,
            timestamp: new Date().toISOString(),
        })
    }
}

// Send message with file (images, video, audio, files)
export const sendFileMessage = async ({ receiverId, content, file, messageStatus = "send" }) => {
    try {
        const formData = new FormData()
        formData.append('senderId', useUserStore.getState().user._id)
        formData.append('receiverId', receiverId)
        formData.append('messageStatus', messageStatus)
        if (content) formData.append('content', content)
        if (file) formData.append('file', file)
        
        const response = await axios.post(`${VITE_BACKEND_URL}/api/chat/send-message`, formData, {
            withCredentials: true,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return response.data
    } catch (error) {
        console.error("Error sending file message:", error)
        throw error
    }
}

// Mark messages as read
export const markMessageRead = ({ messageIds, senderId, receiverId }) => {
    const socket = getSocket()
    if (socket) {
        socket.emit('message_read', {
            messageIds,
            senderId,
            receiverId,
            readAt: new Date().toISOString(),
        })
    }
}

// Typing indicators
export const startTyping = ({ conversationId, receiverId }) => {
    const socket = getSocket()
    if (socket) {
        socket.emit('typing_start', {
            conversationId,
            senderId: useUserStore.getState().user._id,
            receiverId,
            timestamp: new Date().toISOString(),
        })
    }
}

export const stopTyping = ({ conversationId, receiverId }) => {
    const socket = getSocket()
    if (socket) {
        socket.emit('typing_stop', {
            conversationId,
            senderId: useUserStore.getState().user._id,
            receiverId,
            timestamp: new Date().toISOString(),
        })
    }
}

// Message reactions
export const addReaction = ({ messageId, emoji, receiverId }) => {
    const socket = getSocket()
    if (socket) {
        socket.emit('add_reaction', {
            messageId,
            emoji,
            senderId: useUserStore.getState().user._id,
            receiverId,
            timestamp: new Date().toISOString(),
        })
    }
}

export const removeReaction = ({ messageId, reactionId, receiverId }) => {
    const socket = getSocket()
    if (socket) {
        socket.emit('remove_reaction', {
            messageId,
            reactionId,
            senderId: useUserStore.getState().user._id,
            receiverId,
            timestamp: new Date().toISOString(),
        })
    }
}



