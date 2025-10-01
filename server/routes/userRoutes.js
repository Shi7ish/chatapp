import express from 'express'
import { checkAuth, login, signUp, updateUser } from '../controllers/userController.js'
import { protectRoute } from '../middleware/auth.js'

const userRouter = express.Router()

userRouter.post("/sign-up",signUp)
userRouter.post("/login",login)
userRouter.put("/update-profile",protectRoute,updateUser)
userRouter.get("/check",protectRoute,checkAuth)

export default userRouter