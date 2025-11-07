import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { logger } from "./winston.js";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;

export const generateToken = (user: any) => {
    try {
        const token = jwt.sign({ user }, JWT_SECRET, { expiresIn: "15d" });
        return token;
    } catch (error) {
        logger.error(`JWT Error`);
        throw new Error("JWT Error");
    }

}