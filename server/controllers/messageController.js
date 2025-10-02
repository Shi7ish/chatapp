import cloudinary from "../lib/cloudinary.js"
import Message from "../models/Message.js"
import User from "../models/User.js"
import { io, userSocketMap } from "../server.js"

// Get all users expect the logged in user
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id
        const filteredUser = await User.find({ _id: { $ne: userId } }).select("-password")

        const unseenMessages = {}
        const promises = filteredUser.map(async (user) => {
            const messages = await Message.find({ senderId: user._id, receiverId: userId, seen: false })
            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length
            }
        })
        await Promise.all(promises)
        return res.json({ success: true, users: filteredUser, unseenMessages })
    } catch (error) {
        console.log(error.message)
        return res.json({ success: false, message: error.message })
    }
}

// Get all messages for selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params
        const myId = req.user._id

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId }
            ]
        })
        await Message.updateMany({ senderId: selectedUserId, receiverId: myId }, { seen: true })
        return res.json({ success: true, messages })
    } catch (error) {
        console.log(error.message)
        return res.json({ success: true, message: error.message })
    }
}

// api to mark message as seen using message id
export const markMsgAsSeen = async (req, res) => {
    try {
        const { id } = req.params
        await Message.findByIdAndUpdate(id, { seen: true })
        return res.json({ success: true })
    } catch (error) {
        console.log(error.message)
        return res.json({ success: false, message: error.message })
    }
}

//send message to the selected user
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body
        const receiverId = req.params.id
        const senderId = req.user.id

        let imageUrl
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url
        }
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        })
        console.log('Sender ID:', senderId);
        console.log('Receiver ID being looked up:', receiverId);

        //Emit the new message to the receiver's socket
        const receiverSocketId = userSocketMap[receiverId]
        if (receiverSocketId) {
            console.log(receiverSocketId)
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }

        return res.json({ success: true, newMessage })
    } catch (error) {
        console.log(error.message)
        return res.json({ success: false, message: error.message })
    }
}