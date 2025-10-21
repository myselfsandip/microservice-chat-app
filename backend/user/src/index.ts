import dotenv from "dotenv";
import express from "express";
import http from "http"
import connectDB from "./config/db.js";
import { createClient } from "redis";
import cors from "cors";
import userRoutes from "./routes/user.js"
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { errorHandler } from "./middlewares/errorHandler.js";


dotenv.config();
connectDB();

connectRabbitMQ();

//Redis Connection
export const redisClient = createClient({
    url: process.env.REDIS_URL,
});
redisClient.connect().then(() => console.log('Connected to redis')).catch((console.error));

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use("/api/v1/user", userRoutes);

//Error Handler
app.use(errorHandler);

server.listen(PORT, () => {
    console.log(`Server is listening on PORT ${PORT}`);
});