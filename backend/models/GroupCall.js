const mongoose = require('mongoose');

const GroupCallSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation', // Must be a group conversation
        required: true
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // Person who started the call
    },
    callType: {
        type: String,
        enum: ['audio', 'video'],
        required: true
    },
    status: {
        type: String,
        enum: ['ongoing', 'ended'],
        default: 'ongoing'
    },
    participants: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        joinedAt: { type: Date, default: Date.now },
        leftAt: { type: Date },
        status: { 
            type: String, 
            enum: ['joined', 'left', 'missed', 'rejected'],
            default: 'joined' 
        }
    }],
    startedAt: {
        type: Date,
        default: Date.now
    },
    endedAt: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('GroupCall', GroupCallSchema);
