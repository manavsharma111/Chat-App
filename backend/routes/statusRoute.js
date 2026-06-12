const express = require('express')
const statusController = require('../controller/statusController')
const authMiddleware = require('../middlewares/authMiddleware')
const { multerMiddleware } = require('../config/cloudinary')

const router = express.Router()

// Protected routes
// create status
router.post('/create-status', authMiddleware, multerMiddleware, statusController.createStatus)
// get all active statuses
router.get('/get-status', authMiddleware, statusController.getStatus)
// view status
router.put('/:statusId/view', authMiddleware, statusController.viewStatus)
// toggle like status
router.put('/:statusId/like', authMiddleware, statusController.toggleLikeStatus)
// delete status
router.delete('/:statusId/delete', authMiddleware, statusController.deleteStatus)

module.exports = router
