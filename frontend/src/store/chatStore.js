import { create } from "zustand"
import { getSocket } from "../services/chat.service.js"
import axios from "axios"
import axiosInstance from "../services/url.service.js"


export const useChatStore = create((set, get) => ({
  conversations: [], // list all conversation
  currentConversation: null, // current conversation object
  currentUser: null, // current user object
  messages: [], // messages of current conversation
  loading: false, // loading state
  error: null,
  onlineUsers: new Map(),
  typingUsers: new Map(),


  // socket event listener
  initSocketListeners:()=>{
   const socket = getSocket()
   if(!socket) return

   socket.off("receive_message")
   socket.off("new_message")
   socket.off("user_status")
   socket.off("message_send")
   socket.off("message_read")
   socket.off("message_edited")
   socket.off("reaction_updated")
   socket.off("typing_start")
   socket.off("typing_stop")
   socket.off("error")
   socket.off("message_deleted")
   const handleNewMessage = (data) => {
     get().receiveMessage(data)
   }
   socket.on("receive_message", handleNewMessage)
   socket.on("new_message", handleNewMessage)

   // message send
   socket.on("message_send", (message) => {
    set((state) => ({
        messages: state.messages.map((msg) => 
        msg._id === message._id ? { ...message } : msg)
    }))
   })
   //update message status
   socket.on("message_status", ({messageId,messageStatus}) => {
    set((state) => ({
        messages: state.messages.map((msg) => 
        msg._id === messageId ? { ...msg, messageStatus } : msg)
    }))
   })
   // handle reaction
  socket.on("reaction_updated", ({messageId,reactions}) => {
    set((state) => ({
        messages: state.messages.map((msg) => 
        msg._id === messageId ? { ...msg, reactions } : msg)
    }))
   })
   // handle edited message
  socket.on("message_edited", (editedMessage) => {
    set((state) => ({
        messages: state.messages.map((msg) => 
        msg._id === editedMessage._id ? editedMessage : msg)
    }))
   })
   // message read
   socket.on("message_read",({messageId,messageStatus})=>{
    set((state) => ({
        messages: state.messages.map((msg) => 
        msg._id === messageId ? { ...msg, messageStatus } : msg)
    }))
   })
   // handle remove message from local state
   socket.on("message_deleted",(deletedMessageId)=>{
    set((state)=>({messages:state.messages.filter(msg=>msg._id !== deletedMessageId)}))
   })
   // handle any message error
   socket.on("error",(data)=>{
    console.error("Socket error:", data)
   })
   // typing user
   socket.on("user_typing", ({userId,conversationId,isTyping}) => {
    set((state) => {
    const newTypingUsers = new Map(state.typingUsers)
    if(!newTypingUsers.has(conversationId)){
        newTypingUsers.set(conversationId, new Set())
    }
    const typingSet = newTypingUsers.get(conversationId)
    if(isTyping){
        typingSet.add(userId)
    }else{
        typingSet.delete(userId)
    }
    return {typingUsers: newTypingUsers}
   })
})

    // track user's online/offline status
    socket.on("user_status", ({userId, isOnline, lastSeen}) => {
        set((state)=>{
            const newOnlineUsers = new Map(state.onlineUsers)
            newOnlineUsers.set(userId,{isOnline,lastSeen})
            return {onlineUsers: newOnlineUsers}
        })
    })
    // emit status check for all users in conversation list
    const {conversations} = get()
    if(conversations?.data?.length > 0){
       conversations.data?.forEach((conv)=>{
        const otherUser = conv.participants.find(
            (p)=>p._id !== get().currentUser?._id
        )
        if(otherUser && otherUser._id) { 
            socket.emit("get_user_status", otherUser._id, (status) => {
                set((state)=>{
                    const newOnlineUsers = new Map(state.onlineUsers)
                    if(status && status.userId) {
                        newOnlineUsers.set(status.userId, {
                            isOnline: status.isOnline,
                            lastSeen: status.lastSeen
                        })
                    }
                    return {onlineUsers: newOnlineUsers}
                })
            })
        }
       })
    }
  },

  setCurrentUser: (user) => set({ currentUser: user }),

  fetchConversations: async()=>{
      set({loading:true,error:null})
    try {
        const {data} = await axiosInstance.get(`/chat/conversations`)
        set({conversations: data,loading:false,error:null})
        get().initSocketListeners()
        return data
    } catch (error) {
        set({
            error:error?.response?.data?.message,
            loading:false
        })
        return null
    }
  },
  //fetch message from conversation
  fetchMessages: async(conversationId) => {
    if(!conversationId) return
    set({messages: [],loading:true, error: null})
    try {
        const {data} = await axiosInstance.get(`/chat/conversations/${conversationId}/messages`)
        const messageArray = data.data || data || []
        set({
            messages: messageArray,
            currentConversation: conversationId, 
            loading: false, 
            error: null
        })

        // mark as read messages if current user not sender of messages
      const {markMessageAsRead}= get()
      markMessageAsRead()
      return messageArray
    } catch (error) {
        console.error(error.response?.data?.message)
        set({
            error: error?.response?.data?.message || "Failed to fetch messages",
            loading: false
        })
        return null
    }

  },



  

  // send message in real time 
  sendMessage: async(formData) => {
    const senderId = formData.get('senderId')
    const receiverId = formData.get('receiverId')
    const message = formData.get('message')
    const media = formData.get('file')
    const content = formData.get('content')
    const messageStatus = formData.get('messageStatus')
    let conversationId = formData.get('conversationId')
    const replyToId = formData.get('replyTo')

    const socket = getSocket()

    const {conversations} = get()
    let conversation = null
    if(conversations?.data?.length>0){
        conversation = conversations.data?.find((conv)=>{
            return conv.participants.some((p)=>p._id===senderId) &&
            conv.participants.some((p)=>p._id===receiverId)
        })
        if(conversation){
            conversationId = conversation._id
            set({currentConversation: conversationId})
        }
    }
    const tempId = `temp-${Date.now()}`
    const tempMessage = {
        _id: tempId,
        conversation,
        sender: {_id: senderId},
        attachments: media ? URL.createObjectURL(media) : null,
        messageStatus: 'sent',
        contentType: media ? (media.type.startsWith('image/') ? 'image' : media.type.startsWith('video/') ? 'video' : 'file') : 'text',
        content: content,
        createdAt: new Date().toISOString(),
        replyTo: replyToId ? get().messages.find(m => m._id === replyToId) : null,
    }
    set((state)=>({messages: [...state.messages, tempMessage]}));

    try {
        const {data} = await axiosInstance.post("/chat/send-message", formData,
          {headers: {"Content-Type": "multipart/form-data"}}
        );
        const messageData = data.data || data;

        //replace optimistic message with real one
        set((state) => {
          const convArray = Array.isArray(state.conversations) ? state.conversations : (state.conversations?.data || [])
          
          let newConversations = [...convArray]
          const convIndex = newConversations.findIndex(conv => conv._id === (messageData.conversation?._id || messageData.conversation))
          
          if(convIndex !== -1){
              newConversations[convIndex] = {
                  ...newConversations[convIndex],
                  lastMessage: messageData,
              }
          } else if (messageData.conversation) {
             // Simply add the new conversation to the array rather than triggering a full refetch
             newConversations.push({
                 _id: messageData.conversation?._id || messageData.conversation,
                 participants: [messageData.sender, messageData.receiver].filter(Boolean),
                 lastMessage: messageData,
                 unreadMessageCount: 0
             })
          }

          return {
            messages: state.messages.map((msg) => 
              msg._id === tempId ? messageData : msg
            ),
            conversations: Array.isArray(state.conversations) ? newConversations : {
                ...state.conversations,
                data: newConversations,
            }
          }
        });
        return messageData;
    } catch (error) {
        console.error("Error sending message", error);
        set((state) => ({
          messages: state.messages.map((msg) =>
          msg._id === tempId ? {...msg, error: true} : msg),
          error: error?.response?.data?.message || error.message
        }));
        throw error

    }

  },




  // receive message
  receiveMessage: (message) => {
    if(!message) return

    const {currentConversation, currentUser, messages} = get()
    const messageExits = messages.some((msg)=> msg._id === message._id)

  if(messageExits) return
  if(message.conversation===currentConversation){
    set((state)=>({
        messages:[...state.messages, message]
    }))

    // auto mark message as read
    get().markMessageAsRead()
  }
    // update conversation and inc unread count
    set((state)=>{
        const convArray = Array.isArray(state.conversations) ? state.conversations : (state.conversations?.data || [])
        const newConversations = convArray.map((conv)=>{
            if(conv._id === message.conversation){
                return {
                    ...conv,
                    lastMessage: message,
                    unreadMessageCount: message?.receiver?._id === currentUser?._id ? 0 : (conv.unreadMessageCount || 0) + 1
                }
            }
            return conv
        })
        return{
            conversations: {
                ...state.conversations,
                data: newConversations,
            }
        }
    })
    
  },
  // mark as read
  markMessageAsRead : async () => {
    const {messages, currentUser}=get()
    if(!messages.length || !currentUser) return
    const unreadIds = messages.filter((msg)=> msg.messageStatus !== 'read' && msg.receiver?._id === currentUser?._id).map((msg)=>msg._id).filter(Boolean)
    
    if(unreadIds.length === 0) return
    try {
        const {data} = await axiosInstance.put(`/chat/messages/read`,{
            messageIds: unreadIds
        })
        console.log("message mark as read", data)
        set((state)=>({
           messages: state.messages.map((msg)=>
             unreadIds.includes(msg._id) ? { ...msg, messageStatus: "read" } : msg
           )
        }))
        const socket = getSocket()
        if(socket){
            socket.emit("message_read",
                {messageIds:unreadIds, 
                senderId:messages[0]?.sender?._id,
                conversationId:messages[0]?.conversation,
                messageStatus:"read"
            })
        }
    }
    catch(e){
        console.error(e)
    }
  },
  // delete message

  deleteMessage : async (messageId) => {
    try {
        const {data} = await axiosInstance.delete(`/chat/messages/${messageId}/delete`)
        set((state)=>({
            messages:state.messages?.filter((msg)=>msg?._id !== messageId)
        }))
        return true
    }
    catch(e){
        console.error(e)
        set({error:e?.response?.data?.message || "Failed to delete message"})
        return false
    }
  },

  // edit message
  editMessage : async (messageId, newContent) => {
    try {
        const {data} = await axiosInstance.put(`/chat/messages/${messageId}/edit`, { content: newContent })
        const editedMessage = data.data || data
        set((state)=>({
            messages: state.messages.map((msg) => msg._id === messageId ? editedMessage : msg)
        }))
        return true
    }
    catch(e){
        console.error(e)
        set({error:e?.response?.data?.message || "Failed to edit message"})
        return false
    }
  },

  // add/change reactions
  addReactions : async(messageId,emoji) => {
    const socket = getSocket()
    const {currentUser} = get()
    if(socket && currentUser) {
        socket.emit("add_reaction", {
            messageId,
            emoji,
            reactionUserId:currentUser?._id
        })
    }
  },
  startTyping : async(receiverId)=>{
    const socket = getSocket()
    const {currentConversation}= get()
    if(!socket || !currentConversation || !receiverId) return
    socket.emit("typing_start", {
        conversationId:currentConversation,
        receivedId:receiverId
    })
  },
  stopTyping : async(receiverId)=>{
    const socket = getSocket()
    const {currentConversation}= get()
    if(!socket || !currentConversation || !receiverId) return
    socket.emit("typing_stop", {
        conversationId:currentConversation,
        receivedId:receiverId
    })
  },
  isUserTyping : (userId) => {
    const {typingUsers,currentConversation} = get()
    if(!userId || !currentConversation || !typingUsers.has(currentConversation)) return false
    return typingUsers.get(currentConversation).has(userId)
  },
  isUserOnline : (userId)=>{
    if(!userId) return null
    const {onlineUsers} = get()
    return onlineUsers.get(userId)?.isOnline || false
  },
  getUserLastSeen : (userId)=>{
    if(!userId) return null
    const {onlineUsers} = get()
    return onlineUsers.get(userId)?.lastSeen || null
  },
  cleanup : () => {
    set({
        conversations:[],
        currentConversation:null,
        messages:[],
        typingUsers:new Map(),
        onlineUsers:new Map(),
        
    })
  }

}))
