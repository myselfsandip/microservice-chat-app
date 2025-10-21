import dotenv from "dotenv";
dotenv.config();
import express from "express";
import http from "http";
import connectDB from "./config/db.js";
import chatRoutes from "./routes/chat.js"


connectDB();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5002;

app.use(express.json());

app.use("/api/v1/chat", chatRoutes);



server.listen(PORT, () => {
    console.log(`Server is listening on PORT ${PORT}`);
})