import dotenv from "dotenv";
dotenv.config();
import express from "express";
import http from "http"
import { startSendOtpConsumer } from "./consumer.js";
import helmet from "helmet";

startSendOtpConsumer();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(helmet()); // Add security headers

server.listen(PORT, () => {
    console.log(`Server is listening on PORT ${PORT}`);
})