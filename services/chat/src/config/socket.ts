import { Socket, Server } from "socket.io";
import http from "http";
import express from "express";
import { getFileLogger } from "./winston.js";

const app = express();

const server = http.createServer(app);

export const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

const userSocketMap: Record<string, string> = {};

const socketLogs = getFileLogger("logs/socket.log");

io.on("connection", (socket: Socket) => {
    socketLogs.info("User Connected", { socketId: socket.id });
    console.log("User Connected");

    const userId = socket.handshake.query.userId as string | undefined;
    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;
        socketLogs.info("User Subscribed to Socket", { userId, socketId: socket.id });
    }

    io.emit("getOnlineUser", Object.keys(userSocketMap));

    if (userId) {
        socket.join(userId);
    }

    socket.on("typing", (data) => {
        socketLogs.info("User Typing in Chat", { userId: data.userId, chatId: data.chatId, socketId: socket.id });
        socket.to(data.chatId).emit("userTyping", {
            chatId: data.chatId,
            userId: data.userId
        })
    });

    socket.on("stoppedTyping", (data) => {
        socketLogs.info("User Stopped Typing in Chat", { userId: data.userId, chatId: data.chatId, socketId: socket.id });
        socket.to(data.chatId).emit("userStoppedTyping", {
            chatId: data.chatId,
            userId: data.userId
        })
    });

    socket.on("joinChat", (chatId) => {
        socket.join(chatId);
        socketLogs.info("User Joined Chat Room", { userId, chatId, socketId: socket.id });
    })

    socket.on("leaveChat", (chatId) => {
        socket.leave(chatId);
        socketLogs.warn("User Left Chat Room", { userId, chatId, socketId: socket.id });
    })

    socket.on("disconnect", () => {
        socketLogs.warn("User Disconnected", { socketId: socket.id });

        if (userId) {
            delete userSocketMap[userId];
            socketLogs.warn("User Removed from Online Users", { userId, socketId: socket.id });
            io.emit("getOnlineUser", Object.keys(userSocketMap));
        }
    });

    socket.on("connect_error", (error) => {
        socketLogs.error("Socket Connection Error", { error: error.message, socketId: socket.id });
    })
});

export { app, server };
