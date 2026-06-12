const mongoose = require('mongoose')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config()
const port = process.env.PORT

const connectDB = async () =>{
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log(`MongoDB connected`)
    }
    catch(e){
        console.error(e.message)
        process.exit(1)
    }
}

module.exports = connectDB
