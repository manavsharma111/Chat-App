const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    phoneSuffix: {
      type: String
    },
    username: {
      type: String,
      unique: true,
      sparse: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
      type: String,
      minlength: 8,
      select: false
    },
    confirmPassword: {
      type: String,
      minlength: 8,
      select: false
    },
    emailOtp: {
      type: String
    },
    emailOtpExpiry: {
      type: Date
    },
    phoneOtp: {
      type: String
    },
    phoneOtpExpiry: {
      type: Date
    },
    forgetPassword: {
      type: String
    },
    forgetPasswordOtp: {
      type: String
    },
    forgetPasswordOtpExpiry: {
      type: Date
    },
    resetPasswordOtp: {
      type: String
    },
    resetPasswordOtpExpiry: {
      type: Date
    },
    profilePicture: { type: String },
    about: { type: String },
    lastSeen: { type: Date },
    isOnline: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isProfileCompleted: {
      type: Boolean,
      default: false
    },
    agreed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

const User = mongoose.model('User', userSchema)

module.exports = User
