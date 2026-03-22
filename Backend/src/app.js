const express=require("express");
const morgan=require("morgan")
const dotenv=require("dotenv")
const app=express()
const cookieParser=require("cookie-parser")
dotenv.config()
const authRouter=require("./routes/auth.routes")
app.use(express.json())
app.use(morgan("dev"))
app.use(cookieParser())


app.use("/api/auth",authRouter);
module.exports=app;


