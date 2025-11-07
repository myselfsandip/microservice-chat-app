import amqp from "amqplib"
import { logger } from "./winston.js";

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect({
            protocol: "amqp",
            hostname: process.env.RABBIT_MQ_HOST,
            port: 5672,
            username: process.env.RABBIT_MQ_USERNAME,
            password: process.env.RABBIT_MQ_PASS
        });
        channel = await connection.createChannel();
        logger.info("✅ connected to rabbitmq");
    } catch (error) {
        logger.error("Failed to connect to rabbitmq", error);
    }
}


export const publishToQueue = async (queueName: string, message: any) => {
    try {
        if (!channel) {
            logger.info("Rabbitmq channel is not initialized");
            return;
        }
        await channel.assertQueue(queueName, { durable: true });
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
            persistent: true
        });
    } catch (error) {
        logger.error(`Unable to publish to queue: `, error);
    }
}