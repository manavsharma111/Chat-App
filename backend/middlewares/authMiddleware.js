const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()
const JWT_SECRET = process.env.JWT_SECRET

const authMiddleware = (req,res,next) => {
    const token = req.cookies?.auth_token
    if(!token){ 
         return res.status(401).json({message:'Unauthorized'})
    }
    try{
        const decode = jwt.verify(token,JWT_SECRET)
        req.user = decode
        console.log(req.user)
        next()
    }
    catch(e){
        console.error(e)
        return res.status(401).json({message:'Unauthorized'})
    }

    }

    module.exports = authMiddleware
