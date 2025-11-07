import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connectDB from "./config/db.js";
import chatRoutes from "./routes/chat.js";
import cors from "cors";
import { app, server } from "./config/socket.js";
import helmet from "helmet";


connectDB();

const PORT = process.env.PORT || 5002;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(helmet()); // Add security headers
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json());


app.use("/api/v1/chat", chatRoutes);



server.listen(PORT, () => {
    console.log(`Server is listening on PORT ${PORT}`);
})