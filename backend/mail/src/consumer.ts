import amqp from "amqplib";
import nodemailer from "nodemailer";


export const startSendOtpConsumer = async () => {
    try {
        const connection = await amqp.connect({
            protocol: "amqp",
            hostname: process.env.RABBIT_MQ_HOST,
            port: 5672,
            username: process.env.RABBIT_MQ_USERNAME,
            password: process.env.RABBIT_MQ_PASS
        });
        const channel = await connection.createChannel();
        const queueName = "send-otp";
        await channel.assertQueue(queueName, { durable: true });
        console.log("✅ Mail service consumer started, listening for otp emails");

        channel.consume(queueName, async (msg) => {
            if (msg) {
                try {
                    const { to, subject, body } = JSON.parse(msg.content.toString());
                    const transporter = nodemailer.createTransport({
                        host: "smtp.gmail.com",
                        port: 465,
                        auth: {
                            user: process.env.NODEMAILER_USER,
                            pass: process.env.NODEMAILER_PASS
                        },
                    });
                    await transporter.sendMail({
                        from: "Chat App",
                        to,
                        subject,
                        text: body
                    });
                    console.log(`OTP mail sent to ${to}`);
                    channel.ack(msg);
                } catch (error) {
                    console.log("Failed to send otp", error);
                }
            }
        })
    } catch (error) {
        console.log("Failed to start rabbitmq consumer: ", error);
    }
}