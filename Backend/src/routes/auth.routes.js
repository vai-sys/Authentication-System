const express = require("express");
const authRouter = express.Router();
const {register,getMe ,refreshToken,logout,login,logoutAll ,verifyEmail}=require("../controllers/auth.controller")
const authMiddleware=require("../middleware/authMiddleware.js")

authRouter.post("/register",register);
authRouter.get("/get-me", authMiddleware,getMe);
authRouter.get("/refreshToken",refreshToken);
authRouter.get("/logout",logout)
authRouter.post("/login",login)
authRouter.get("/logout-all",logoutAll)
authRouter.post("/verify-email",verifyEmail)

module.exports = authRouter;