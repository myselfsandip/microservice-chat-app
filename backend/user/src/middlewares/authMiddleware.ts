import { NextFunction, Request, Response } from "express";
import { IUser } from "../model/User.js";
import asyncHandler from "../config/asyncHandler.js";
import { HTTPSTATUS } from "../config/http.config.js";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
    user?: IUser | null;
}

export default asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(HTTPSTATUS.UNAUTHORIZED).json({
            success: false,
            message: "Please login - No authorization header provided",
        });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const decodedValue = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        if (!decodedValue || !decodedValue.user) {
            res.status(HTTPSTATUS.UNAUTHORIZED).json({
                success: false,
                message: "Invalid token payload",
            });
            return;
        }
        req.user = decodedValue.user;
        next();
    } catch (error: any) {
        console.error("JWT Verification Error:", error.message);

        next({
            statusCode: HTTPSTATUS.UNAUTHORIZED,
            message:
                error.name === "TokenExpiredError"
                    ? "Token expired, please login again"
                    : "Invalid or malformed token",
        });
    }
});
