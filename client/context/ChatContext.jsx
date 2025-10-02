import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext()

export const ChatProvider = (({children})=>{

    const [message, setMessage] = useState([])
    const [users, setUsers] = useState([])
    const [selectedUsers, setSelectedUsers] = useState(null)
    const [unseenMessages, setUnseenMessages] = useState({})
    const [view, setView] = useState(false)

    const {socket, axios} = useContext(AuthContext)

    // function to get all users for the sidebar
    const getUsers = async () => {
        try {
            const {data} = await axios.get("/api/messages/users")
            if (data.success) {
                setUsers(data.users)
                setUnseenMessages(data.unseenMessages)
            }
        } catch (error) {
            console.log(error.message)
            toast.error(error.message)
        }
    }
    // function to get messages for the selected user
    const getMessages = async (userId) => {
        try {
            const {data} = await axios.get(`/api/messages/${userId}`)
            if (data.success) {
                setMessage(data.messages)
            }

        } catch (error) {
            console.log(error.message)
            toast.error(error.message)
        }

    }

    // function to send message to the selected user
    const sendMessage = async (messageData) =>{
        try {
            const {data} = await axios.post(`/api/messages/send/${selectedUsers._id}`,messageData)
            if (data.success) {
                return data.newMessage
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error.message)
            toast.error(error.message)
        }
    }
    // function to subscribe to the messages for selected user
    const subscribeToMessages = async () => {
        if (!socket) {
            return
        }
        socket.on("newMessage",async (newMessage)=>{
            if (selectedUsers && newMessage.senderId === selectedUsers._id) {
                newMessage.seen = true
                setMessage((prevMessages)=>[...prevMessages, newMessage])
                await axios.put(`/api/messages/mark/${newMessage._id}`)
            }else{
                setUnseenMessages((prevUnseenMessages)=>({
                    ...prevUnseenMessages,[newMessage.sender_Id] : 
                    prevUnseenMessages[newMessage.sender_Id] ? prevUnseenMessages[newMessage.sender_Id] + 1 : 1
                }))
            }
        })
    }

    // function to unsubscribe to the messages
    const unsubscribeToMessages = () => {
        if(socket){
            socket.off("newMessage")
        }
    }

    useEffect(()=>{
        subscribeToMessages()
        return ()=>unsubscribeToMessages()
    },[socket, selectedUsers])

    const value={
        view, setView, message, users, selectedUsers, getMessages, getUsers, setMessage, sendMessage,setSelectedUsers,unseenMessages,setUnseenMessages
    }

    return(
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
})