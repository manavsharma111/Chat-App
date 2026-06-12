const mongoose = require('mongoose')

const statusSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        default: "",
        required: true,
    },
    // Adding media support
    attachments: [{
        url: { type: String, required: true },
        fileType: { 
            type: String, 
            enum: ['image', 'video', 'audio', 'file'], 
            required: true 
        },
        fileName: String,
        fileSize: Number, // Useful for displaying "2.4 MB"
        duration: Number, // For audio/video messages
        thumbnail: String // For video previews
    }],
    viewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    expiresAt: { type:Date, required:true }, 
}, { timestamps: true })

const Status = mongoose.model('Status', statusSchema)

module.exports = Status