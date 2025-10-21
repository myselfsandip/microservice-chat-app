import asyncHandler from "../config/asyncHandler.js";
import { AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { HTTPSTATUS } from "../config/http.config.js";
import { Chat } from "../models/Chat.js";
import { Messages } from "../models/Messages.js";
import axios from "axios";

export const createNewChat = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { otherUserId } = req.body;

    if (!otherUserId) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Other userId is required"
        });
        return;
    }

    const existingChat = await Chat.findOne({ users: { $all: [userId, otherUserId], $size: 2 } });

    if (existingChat) {
        res.status(HTTPSTATUS.OK).json({
            success: true,
            message: "Chat already exists",
            chatId: existingChat._id,
        });
        return;
    }

    const newChat = await Chat.create({
        users: [userId, otherUserId]
    });

    res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "New chat created",
        chatId: newChat._id,
    })
});

export const getAllChats = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    if (!userId) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "UserId is required"
        });
        return;
    }
    const chats = await Chat.find({ users: userId }).sort({ updatedAt: -1 });

    const chatWithUserData = await Promise.all(
        chats.map(async (chat) => {
            const otherUserId = chat.users.find(id => id !== userId);
            const unseenCount = await Messages.countDocuments({
                chatId: chat._id,
                sender: { $ne: userId },
                seen: false,
            });
            try {
                const { data } = await axios.get(`${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`);
                return {
                    user: data,
                    chat: {
                        ...chat.toObject(),
                        latestMessage: chat.latestMessage || null,
                        unseenCount,
                    }
                }
            } catch (error) {
                console.log(error);
                return {
                    user: {
                        _id: otherUserId,
                        name: "Unknown User",
                    },
                    chat: {
                        ...chat.toObject(),
                        latestMessage: chat.latestMessage || null,
                        unseenCount,
                    }
                }
            }
        })
    );

    res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "Data fetched successfully",
        chats: chatWithUserData
    })
});

export const sendMessage = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const senderId = req.user?._id;
    const { chatId, text } = req.body;
    const imageFile = req.file;

    if (!senderId) {
        res.status(HTTPSTATUS.UNAUTHORIZED).json({
            success: false,
            message: "unauthorized",
        });
        return;
    }

    if (!chatId) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Chat Id required",
        });
        return;
    }

    if (!text && !imageFile) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Text or image is required",
        });
        return;
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
        res.status(HTTPSTATUS.NOT_FOUND).json({
            success: false,
            message: "Chat not found"
        });
        return;
    }

    const isUserInChat = chat.users.some((userId) => userId.toString() === senderId.toString());

    if (!isUserInChat) {
        res.status(HTTPSTATUS.FORBIDDEN).json({
            success: false,
            message: "You are not a participant of this chat",
        });
        return;
    }

    const otherUserId = chat.users.find((userId) => userId.toString() !== senderId.toString());
    if (!otherUserId) {
        res.status(HTTPSTATUS.UNAUTHORIZED).json({
            success: false,
            message: "No other user",
        });
        return;
    }

    //socket setup

    let messageData: any = {
        chatId: chatId,
        sender: senderId,
        seeen: false,
        seenAt: undefined,
    };

    if (imageFile) {
        messageData.image = {
            url: imageFile.path,
            publicId: imageFile.filename,
        }
        messageData.messageType = "image";
        messageData.text = text || "";
        messageData.text = text || "";
    } else {
        messageData.text = text;
        messageData.messageType = "text";
    }

    const message = new Messages(messageData);
    const savedMessage = await message.save();
    const latestMessageText = imageFile ? "📷 Image" : text;

    await Chat.findByIdAndUpdate(chatId, {
        latestMessage: {
            text: latestMessageText,
            sender: senderId,
        },
        updatedAt: new Date(),
    }, { new: true });

    //emit to sockets

    res.status(HTTPSTATUS.CREATED).json({
        message: savedMessage,
        sender: senderId,
    });
});

export const getMessagesByChat = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { chatId } = req.params;

    if (!userId) {
        res.status(HTTPSTATUS.UNAUTHORIZED).json({
            success: false,
            message: "UNAUTHORIZED"
        })
        return;
    }
    if (!chatId) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "ChatId required"
        })
        return;
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
        res.status(HTTPSTATUS.NOT_FOUND).json({
            success: false,
            message: "Chat not found"
        })
        return;
    }

    const isUserInChat = chat.users.some((id) => id.toString() === userId.toString());

    if (!isUserInChat) {
        res.status(HTTPSTATUS.FORBIDDEN).json({
            success: false,
            message: "You are not a participant of this chat",
        });
        return;
    }

    const messagesToMarkSeen = await Messages.find({
        chatId: chatId,
        sender: { $ne: userId },
        seen: false,
    });

    await Messages.updateMany({
        chatId: chatId,
        sender: { $ne: userId },
        seen: false,
    }, {
        seen: true,
        seenAt: new Date(),
    });

    const messages = await Messages.find({ chatId }).sort({
        createdAt: 1
    });

    const otherUserId = chat.users.find((id) => id !== userId);

    try {
        const { data } = await axios.get(`${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`);

        if (!otherUserId) {
            res.status(HTTPSTATUS.BAD_REQUEST).json({
                success: false,
                message: "No other user",
            })
        }
        //socket work
        //
        res.status(HTTPSTATUS.OK).json({
            messages,
            user: data,
        });
    } catch (error) {
        console.log(error);
        res.json({
            messages,
            user: {
                _id: otherUserId,
                name: "Unknown User"
            }
        })
    }

})