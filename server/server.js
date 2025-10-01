import express from 'express';
import 'dotenv/config';
import http from 'http';
import cors from 'cors';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io';

//Create Express app and HTTP server
const app = express()
const server = http.createServer(app)

// Initialize socket.io server
export const io = new Server(server,{
    cors: {origin : "*"}
})

// Store online users
export const userSocketMap = {} // {userId : socket.id}

// Socket.io connection handler
io.on("connection",(socket)=>{
    const userId = socket.handshake.query.userId
    console.log("User connected ",userId)
    if (userId) {
        userSocketMap[userId]  = socket.id        
    }

    // Emit online user to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap))

    socket.on("disconnect",() => {
        console.log("User Disconnected", userId)
        delete userSocketMap[userId]
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})

//Middleware Setup
app.use(express.json({limit : '4mb'}))
app.use(cors())

// Route Setup
app.use("/api/status",(req,res)=> res.send("Server is live"))
app.use("/api/auth", userRouter)
app.use("/api/messages", messageRouter)

const PORT = process.env.PORT || 5000

// Connecting to DB
await connectDB()


server.listen(PORT,()=>{
    console.log("Server is live at Port : "+PORT)   
})

