const Conversation = require('../models/Conversation')
const Message = require('../models/Message')
const User = require('../models/User')
const response = require('../utlis/responseHandler')
const { uploadFileToCloudinary } = require('../config/cloudinary')


// send message
exports.sendMessage = async (req, res) => {
    try{
        const { senderId, receiverId, content, messageStatus, replyTo } = req.body
        const file = req.file

        const participants = [senderId, receiverId].sort()
        let conversation = await Conversation.findOne({ 
            participants: { $all: participants },
            isGroup: false
         })
         if(!conversation) {
            conversation = new Conversation({ participants })
         await conversation.save()
         }
         // handle files
         let attachments = null
         let contentType = null
        if(file){
           const uploadFile = await uploadFileToCloudinary(file)
        if(!uploadFile?.secure_url){
            return response(res, 400, "Failed to upload file")
        }
        attachments = uploadFile?.secure_url
        if(file.mimetype.startsWith('image')){
            contentType = 'image'
        }
        else if(file.mimetype.startsWith('video')){
            contentType = 'video'
        }
        else if(file.mimetype.startsWith('audio')){
            contentType = 'audio'
        }
        else{
            contentType = 'file'
        }
        }
        else if(content?.trim()) contentType = 'text'
        else{
          return response(res, 400, "Message content is required")  
        } 
        const message = new Message({
            conversation: conversation._id,
            sender: senderId,
            receiver: receiverId,
            content,
            contentType,
            attachments,
            messageStatus,
            replyTo: replyTo || null
        })
        await message.save()
        conversation.lastMessage = message._id
        await conversation.save()
        if(message?.content) conversation.unreadmessages += 1
        await conversation.save()

        const populateMessage = await Message.findById(message?._id)
        .populate("sender", "username profilePicture")
        .populate("receiver", "username profilePicture")
        .populate({
            path: 'replyTo',
            populate: { path: 'sender', select: 'username profilePicture' }
        })
        .lean()

        
        // Emit Socket Event for real time
        if (req.io && req.socketUserMap) {
          const receiverSocketId = req.socketUserMap.get(receiverId)
          if (receiverSocketId) {
            req.io.to(receiverSocketId).emit("new_message", populateMessage)
            message.messageStatus = "delivered"
            await message.save()
          }
          else {
            console.log("Receiver not found")
          }
        }

        return response(res, 200, "Message sent successfully", populateMessage)
    }
    catch(e){
        console.error(e)
        return response(res, 500, "Failed to send message")
    }
}

// get all conversation
exports.getAllConversation = async (req, res) => {
    const userId = req.user.userId
    try{
         let conversation = await Conversation.find({ 
            participants: { $in: [userId] }
         }).populate("participants","username profilePicture isOnline lastSeen")
         .populate({
            path: "lastMessage",
            populate: {
                path: "sender receiver",
                select: "username profilePicture"
            }
         }).sort({ updatedAt: -1 }).lean()
         return response(res, 200, "Conversation retrieved successfully", conversation  )
        }
        catch(e){
            console.error(e)
            return response(res, 500, "Failed to get conversation")
        }
}

// get messages of specific conversation
exports.getMessages = async (req, res) => {
    const { conversationId } = req.params
    const userId = req.user.userId
    try{
        const conversation = await Conversation.findById(  conversationId )
        if(!conversation) return response(res, 404, "Conversation not found")
        if(!conversation.participants.includes(userId)) return response(res, 403, "You are not a participant of this conversation")
    const messages = await Message.find({ conversation: conversationId })
            .populate("sender", "username profilePicture")
        .populate("receiver", "username profilePicture")
        .populate({
            path: 'replyTo',
            populate: { path: 'sender', select: 'username profilePicture' }
        })
        .sort("createdAt")

        await Message.updateMany(
            { conversation: conversationId,
                receiver: userId,
                 messageStatus:{ $in : ["send", "delivered"] }
           },
            { $set: { messageStatus: "read" } }
        )
        conversation.unreadmessages = 0
        await conversation.save()
        return response(res, 200, "Messages retrieved successfully", messages)
    }
    catch(e){
        console.error(e)
    }
}


// mark as read
exports.markAsRead = async (req, res) => {
    const { messageIds } = req.body
    const userId = req.user.userId
    try{
        // get relevent message to determine sender
        let messages = await Message.find({ 
            _id: { $in: messageIds },
            receiver: userId,
        })
        await Message.updateMany(
            { _id: { $in: messageIds },
                receiver: userId},
            { $set: { messageStatus: "read" } }
        )



        // notify to original user
        if (req.io && req.socketUserMap) {
            for (const message of messages) {
                const senderSocketId = req.socketUserMap.get(message.sender.toString())
                if (senderSocketId) {
                    const updatedMessage = {
                        _id: message._id,
                        messageStatus: "read"
                    }
                    req.io.to(senderSocketId).emit("message_read", updatedMessage)
                    await message.save()
                }
                else {
                    console.log("Sender not found")
                }
            }
        }
        return response(res, 200, "Messages marked as read successfully")
    }
    catch(e){
        console.error(e)
        return response(res, 500, "Failed to mark messages as read")
    }
        
}

// delete message
exports.deleteMessage = async ( req, res ) => {
    const { messageId } = req.params
    const userId = req.user.userId
    try{
        const message = await Message.findById(messageId)
        if(!message) return response(res, 404, "Message not found")
        if(message.sender.toString() !== userId && message.receiver.toString() !== userId){
            return response(res, 403, "You are not authorized to delete this message")
        }
        await message.deleteOne()

        // Emit Socket Event
        if (req.io && req.socketUserMap) {
            const receiverSocketId = req.socketUserMap.get(message.receiver.toString())
            if (receiverSocketId) {
                req.io.to(receiverSocketId).emit("message_deleted", messageId)
            }
            else {
                console.log("Receiver not found")
            }
        }
        return response(res, 200, "Message deleted successfully")
    }
    catch(e){
        console.error(e)
        return response(res, 500, "Failed to delete message")
    }
}

// edit message
exports.editMessage = async (req, res) => {
    const { messageId } = req.params
    const { content } = req.body
    const userId = req.user.userId
    try{
        if(!content || !content.trim()) return response(res, 400, "Content cannot be empty")
        
        const message = await Message.findById(messageId)
        if(!message) return response(res, 404, "Message not found")
        if(message.sender.toString() !== userId){
            return response(res, 403, "You are not authorized to edit this message")
        }
        if(message.contentType !== 'text'){
            return response(res, 400, "Only text messages can be edited")
        }

        message.content = content.trim()
        message.isEdited = true
        await message.save()

        const populateMessage = await Message.findById(message._id)
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture")
            .lean()

        // Emit Socket Event
        if (req.io && req.socketUserMap) {
            const receiverSocketId = req.socketUserMap.get(message.receiver.toString())
            if (receiverSocketId) {
                req.io.to(receiverSocketId).emit("message_edited", populateMessage)
            }
        }
        return response(res, 200, "Message edited successfully", populateMessage)
    }
    catch(e){
        console.error(e)
        return response(res, 500, "Failed to edit message")
    }
}
