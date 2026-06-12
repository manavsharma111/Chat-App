const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()
const JWT_SECRET = process.env.JWT_SECRET


const generateToken = (userId) => {
    return jwt.sign({userId},JWT_SECRET,{ 
        expiresIn:'30d'
    })
}

module.exports = generateToken
