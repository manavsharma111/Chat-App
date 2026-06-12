const mongoose = require('mongoose')
const ConversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
    },
    unreadmessages: {
        type: Number,
        default: 0,
    },
    isGroup: {
        type: Boolean,
        default: false,
    },
    
},
{timestamps:true}) 

const Conversation = mongoose.model('Conversation', ConversationSchema)

module.exports = Conversation