import { generateToken } from "../config/generateToken.js";
import { HTTPSTATUS } from "../config/http.config.js";
import { publishToQueue } from "../config/rabbitmq.js";
import asyncHandler from "../config/asyncHandler.js";
import { redisClient } from "../index.js";
import { User } from "../model/User.js";
import { AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { Response } from "express";

export const loginController = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const rateLimitKey = `otp:ratelimit:${email}`;
    const rateLimit = await redisClient.get(rateLimitKey);
    if (rateLimit) {
        res.status(HTTPSTATUS.TOO_MANY_REQUESTS).json({
            status: false,
            message: "Too many requests. Please wait before requesting new otp"
        });
        return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpKey = `otp:${email}`;
    await redisClient.set(otpKey, otp, {
        EX: 300, //300 seconds -> 5 min
    });
    await redisClient.set(rateLimitKey, "true", {
        EX: 60,
    });

    const rabbitmqMessage = {
        to: email,
        subject: "Your OTP code",
        body: `Your OTP is ${otp}. It is valid for 5 minutes`,
    };

    await publishToQueue("send-otp", rabbitmqMessage);

    res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "OTP send to your email",
    });
});


export const verifyUser = asyncHandler(async (req, res) => {
    const { email, otp: enteredOtp } = req.body;

    if (!email || !enteredOtp) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Email and OTP required"
        });
        return;
    }

    const otpKey = `otp:${email}`;
    const storedOtp = await redisClient.get(otpKey);
    if (!storedOtp || storedOtp !== enteredOtp) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
            success: false,
            message: "Invalid or expired otp"
        });
        return;
    }

    await redisClient.del(otpKey);
    let user = await User.findOne({ email });

    if (!user) {
        const name = email.slice(0, 8);
        user = await User.create({ name, email });
    }
    const token = generateToken(user);

    res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "User verified",
        user,
        token
    })
});

export const profileController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    res.status(HTTPSTATUS.OK).json({
        success: true,
        message: 'Profile fetched successfully',
        user: { ...user }
    });
});

export const updateName = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await User.findById(req.user?._id);
    if (!user) {
        res.status(HTTPSTATUS.NOT_FOUND).json({
            success: false,
            message: "Please login",
        });
        return;
    }
    user.name = req.body.name;
    await user.save();
    const token = generateToken(user);
    res.status(HTTPSTATUS.OK).json({
        success: true,
        message: "User updated",
        user,
        token,
    })
});

export const getAllUsers = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const users = await User.find({});
    res.json(users);
});
export const getAUsers = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await User.findById(req.params.id);
    res.json(user);
});
