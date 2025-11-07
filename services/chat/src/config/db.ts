import mongoose from "mongoose";
import { logger } from "./winston.js";


const connectDB = async () => {
    const DB_URL = process.env.MONGO_URI;
    if (!DB_URL) {
        throw new Error("MONGO_URI is not defined in environment variables");
    }
    
    try {
        const conn = await mongoose.connect(DB_URL, {
            dbName: "Microserviceschatapp"
        });
        logger.info("DB Connection Successfull");
    } catch (error) {
        logger.error('Mongoose connection error');
        process.exit(1);
    }
}

export default connectDB;