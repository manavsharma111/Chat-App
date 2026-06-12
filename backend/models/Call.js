const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    caller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    callType: {
        type: String,
        enum: ['audio', 'video'],
        required: true
    },
    status: {
        type: String,
        enum: ['missed', 'rejected', 'completed', 'busy', 'ongoing'],
        default: 'ongoing'
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    endedAt: {
        type: Date
    },
    duration: {
        type: Number, // Seconds mein storage (endedAt - startedAt)
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Call', CallSchema);
