const app=require("./src/app.js")
const connectDB=require("./src/config/db.js")
connectDB()

app.listen(5000,()=>{
    console.log("Server is listening on the port 5000")
})
