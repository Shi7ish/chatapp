import User from "../models/User.js"
import bcrypt from 'bcryptjs';
import { generateToken } from './../lib/utils.js';
import cloudinary from './../lib/cloudinary.js';

//Signup a new user
export const signUp = async(req,res)=>{
    try {
        const {email, fullName, password, bio} = req.body
        if (!email || !fullName || !password || !bio) {
            return res.json({success : false, message : "Missing Details"})
        }
        const user = await User.findOne({email})
        if (user) {
            return res.json({success : false, message : "Accound already exists"})
        }

        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(password, salt)

        const newUser = await User.create({
            email,
            fullName,
            password:hashPassword,
            bio
        })

        const token = generateToken(newUser._id)
        return res.json({success : true, user : newUser, token, message : "Account created successfully"})
    } catch (error) {
        console.log(error.message)
        return res.json({success : false, message : error.message})
    }
}

// Login user
export const login = async(req,res)=>{
    try {
        const {email,password} = req.body 
        const userData = await User.findOne({email})

        const isPasswordCorrect = await bcrypt.compare(password, userData.password)
        if (!isPasswordCorrect) {
            return res.json({success : false, message : "Invalid Credentials"})
        }
        const token = generateToken(userData._id)
        return res.json({success : true, user : userData, token, message : "Login successfull"})
    } catch (error) {
        console.log(error.message)
        return res.json({success : false, message : error.message})    
    }
}


// Controller to check user is authenticated
export const checkAuth = (req,res) => {
    return res.json({success : true, user : req.user})
} 

// Update user data
export const updateUser = async(req,res) => {
    try {
        const {profilePic, bio, fullName} = req.body
        const userId = req.user._id
        let updatedUser;
        if(!profilePic){
            updatedUser = await User.findByIdAndUpdate(userId,{bio,fullName},{new:true})
        } else {
            const upload = await cloudinary.uploader.upload(profilePic)
            updatedUser = await User.findByIdAndUpdate(userId,{profilePic : upload.secure_url, bio, fullName },{new : true})
        }
        return res.json({success : true, user : updatedUser})
    } catch (error) {
        console.log(error.message)
        return res.json({success : false, message : error.message})
    }
}
