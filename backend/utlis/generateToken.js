const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()
const JWT_SECRET = process.env.JWT_SECRET

const generateToken = (userId, rememberMe = true) => {
    return jwt.sign({userId},JWT_SECRET,{ 
        expiresIn: rememberMe ? '30d' : '1d'
    })
}

module.exports = generateToken
