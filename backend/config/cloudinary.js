const multer = require('multer')
const dotenv = require('dotenv')
const cloudinary = require('cloudinary').v2

dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const storage = multer.memoryStorage()
const multerMiddleware = multer({ storage }).single('file')

const uploadFileToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
      if (error) return reject(error)
      return resolve(result)
    })

    stream.end(file.buffer)
  })

module.exports = { multerMiddleware, uploadFileToCloudinary }
