const express = require('express')
const authController = require('../controller/authController')
const response = require('../utlis/responseHandler')
const authMiddleware = require('../middlewares/authMiddleware')
const { multerMiddleware } = require('../config/cloudinary')

const router = express.Router()


// normal routes
router.post('/send-otp', authController.sendOtp)
router.post('/otp-verification', authController.otpVerification)
router.post('/logout', authController.logout)

// protected routes
router.put('/update-profile', authMiddleware, multerMiddleware, authController.updateProfile)
router.get('/check-auth', authMiddleware, authController.checkAuthenticate)
router.get('/get-all-user', authMiddleware, authController.getAllUser)



module.exports = router
