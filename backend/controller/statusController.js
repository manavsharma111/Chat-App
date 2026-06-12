const Status = require('../models/Status')
const Message = require('../models/Message')
const User = require('../models/User')
const response = require('../utlis/responseHandler')
const { uploadFileToCloudinary } = require('../config/cloudinary')


// create status
exports.createStatus = async (req, res) => {
    try {
        const { content, contentType } = req.body
        const userId = req.user.userId
        const file = req.file

        let mediaUrl = null
        let finalContentType = contentType ? contentType : 'text'
        let attachments = []

        // handle files
        if (file) {
            const uploadFile = await uploadFileToCloudinary(file)
            if (!uploadFile?.secure_url) {
                return response(res, 400, "Failed to upload file")
            }
            mediaUrl = uploadFile?.secure_url
            if (file.mimetype.startsWith('image')) {
                finalContentType = 'image'
            }
            else if (file.mimetype.startsWith('video')) {
                finalContentType = 'video'
            }
            else if (file.mimetype.startsWith('audio')) {
                finalContentType = 'audio'
            }
            else {
                finalContentType = 'file'
            }
            
            attachments.push({
                url: mediaUrl,
                fileType: finalContentType,
                fileName: file.originalname,
                fileSize: file.size
            })
        }
        else if (content?.trim()) finalContentType = 'text'
        else {
            return response(res, 400, "Status content or media is required")
        }

        const expiaryAt = new Date()
        expiaryAt.setDate(expiaryAt.getDate() + 1)

        const status = new Status({
            user: userId,
            content: content || mediaUrl || " ",
            attachments,
            expiresAt: expiaryAt
        })
        await status.save()

        const populateStatus = await Status.findById(status._id)
            .populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture")
            .populate("likes", "username profilePicture")


        // Emit Socket Event
        if (req.io && req.socketUserMap) {
            // broadcast to all connecting users except the creater
            for (const [ConnecteduserId, socketId] of req.socketUserMap) {
                if (ConnecteduserId !== userId) {
                    req.io.to(socketId).emit("new_status", populateStatus)
                }
            }
        }

        return response(res, 201, "Status created successfully", populateStatus)
    }
    catch (e) {
        console.error(e)
        return response(res, 500, "Failed to send status")
    }
}


// get status
exports.getStatus = async (req, res) => {
    try {
        const statuses = await Status.find({
            expiresAt: { $gt: new Date() }
        }).populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture")
            .populate("likes", "username profilePicture")
            .sort({ createdAt: -1 })
        return response(res, 200, "Status retrieved successfully", statuses)
    }
    catch (e) {
        console.error(e)
        return response(res, 500, "Failed to get status")
    }

}


// view status
exports.viewStatus = async (req, res) => {
    const { statusId } = req.params
    const userId = req.user.userId
    try {
        const updatedStatus = await Status.findByIdAndUpdate(
            statusId,
            { $addToSet: { viewers: userId } },
            { new: true }
        )
        .populate("user", "username profilePicture")
        .populate("viewers", "username profilePicture")
        .populate("likes", "username profilePicture");

        if (!updatedStatus) return response(res, 404, "Status not found")

        // Emit Socket Event
        if (req.io && req.socketUserMap) {
            // broadcast to all connecting users except the creater
            const statusOwnerSocketId = req.socketUserMap.get(updatedStatus.user._id.toString())
            if (statusOwnerSocketId) {
                const viewData = {
                    statusId,
                    viewerId: userId,
                    totalViewers: updatedStatus.viewers.length,
                    viewers: updatedStatus.viewers
                }
                req.io.to(statusOwnerSocketId).emit("status_viewed", viewData)
            }
        }
        
        return response(res, 200, "Status viewed successfully")
    }
    catch (e) {
        console.error(e)
        return response(res, 500, "Failed to view status")
    }
}


// delete status
exports.deleteStatus = async (req, res) => {
    const { statusId } = req.params
    const userId = req.user.userId
    try {
        const status = await Status.findById(statusId)
        if (!status) return response(res, 404, "Status not found")
        if (status.user.toString() !== userId) return response(res, 403, "You are not authorized to delete this status")
        await status.deleteOne()


        // Emit Socket Event
        if (req.io && req.socketUserMap) {
            for (const [ConnecteduserId, socketId] of req.socketUserMap) {
                if (ConnecteduserId !== userId) {
                    req.io.to(socketId).emit("status_delated", statusId)
                }
            }
        }




        return response(res, 200, "Status deleted successfully")
    }
    catch (e) {
        console.error(e)
    }
}

// toggle like status
exports.toggleLikeStatus = async (req, res) => {
    const { statusId } = req.params
    const userId = req.user.userId
    try {
        const status = await Status.findById(statusId)
        if (!status) return response(res, 404, "Status not found")

        const hasLiked = status.likes.includes(userId)
        
        if (hasLiked) {
            status.likes = status.likes.filter(id => id.toString() !== userId.toString())
        } else {
            status.likes.push(userId)
        }
        
        await status.save()

        const updatedStatus = await Status.findById(statusId)
            .populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture")
            .populate("likes", "username profilePicture")

        // Emit Socket Event
        if (req.io && req.socketUserMap) {
            // broadcast to all connecting users except the creater
            for (const [ConnecteduserId, socketId] of req.socketUserMap) {
                if (ConnecteduserId !== userId) {
                    req.io.to(socketId).emit("status_liked", { statusId, likes: updatedStatus.likes })
                }
            }
            // If the liker is not the status owner, notify the owner directly
            if (status.user.toString() !== userId) {
                const ownerSocketId = req.socketUserMap.get(status.user.toString())
                if (ownerSocketId) {
                    req.io.to(ownerSocketId).emit("status_liked", { statusId, likes: updatedStatus.likes })
                }
            }
        }

        return response(res, 200, hasLiked ? "Status unliked" : "Status liked", updatedStatus.likes)
    }
    catch (e) {
        console.error(e)
        return response(res, 500, "Failed to toggle like on status")
    }
}