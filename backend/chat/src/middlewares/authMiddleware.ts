import { NextFunction, Request, Response } from "express";
import asyncHandler from "../config/asyncHandler.js";
import { HTTPSTATUS } from "../config/http.config.js";
import jwt, { JwtPayload } from "jsonwebtoken";


interface IUser extends Document {
    _id: string;
    name: string;
    email: string;
}

export interface AuthenticatedRequest extends Request {
    user?: IUser | null;
}

export default asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(HTTPSTATUS.UNAUTHORIZED).json({
            success: false,
            message: "Please login - No auth header",
        });
        return;
    }
    const token = authHeader.split(" ")[1];
    const decodedValue = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    if (!decodedValue || !decodedValue.user) {
        res.status(HTTPSTATUS.UNAUTHORIZED).json({ 
            success: false,
            message: "Invalid token"
        })
    }
    req.user = decodedValue.user;
    next();
});