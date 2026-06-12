const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')
const http = require('http')
const app = express()
const connectDB = require('./config/db.js')
const bodyParser = require('body-parser')
const authRoute = require('./routes/authRoute')
const chatRoute = require('./routes/chatRoute')
const statusRoute = require('./routes/statusRoute')
const initializeSocketIO = require('./service/socket.io.js')

// config .env
dotenv.config({ path: path.join(__dirname, '.env') })
const port = process.env.PORT || 5000

// cors
const corsOptions = {
    origin: process.env.CLIENT_URL,
    credentials: true
}


// database
connectDB()

// middlewares
app.use(express.json()) // parse body data
app.use(cookieParser()) // parse token on every request
app.use(cors(corsOptions))  // 
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())


// server
const server = http.createServer(app)
const io = initializeSocketIO(server)
app.use((req, res, next) => {
    req.io = io
    req.socketUserMap = io.socketUserMap
    next()
})

server.listen(port,()=>{
    console.log(`Server is running on ${port}`)
})

app.get('/', (req, res) => {
    res.send('Hello World!')
})


// routes
app.use('/api/auth',authRoute)
app.use('/api/chat',chatRoute)
app.use('/api/status', statusRoute)


module.exports = app
