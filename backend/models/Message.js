const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        default: ""
    },
    contentType: {
        type: String,
        default: "text"
    },
    attachments: {
        type: String,
        default: null
    },
    messageStatus: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    reactions: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String }
    }]
}, { timestamps: true });

const Message = mongoose.model('Message', MessageSchema);
module.exports = Message;
