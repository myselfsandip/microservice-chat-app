import mongoose from "mongoose";


const connectDB = async () => {
    const DB_URL = process.env.MONGO_URI;
    if (!DB_URL) {
        throw new Error("MONGO_URI is not defined in environment variables");
    }
    try {
        const conn = await mongoose.connect(DB_URL, {
            dbName: "Microserviceschatapp"
        });
        console.log("Connected to DB");
    } catch (error) {
        console.error(`Failed to connect to DB`);
        process.exit(1);
    }
}

export default connectDB;