import { connect } from "@nats-io/transport-node";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
let nc;
let botToken = process.env.TELEGRAM_BOT_TOKEN;
let chatId = process.env.TELEGRAM_CHAT_ID

const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;


const start = async () => {
    console.log(`Connecting to NATS server for Broadcaster at ${process.env.NATS_URL}...`);
    try {
        nc = await connect({ servers: process.env.NATS_URL });
        nc.subscribe(
            "todo.created",
            { queue: "todo-workers" },
            async (err, msg) => {
                if (err) {
                    console.error(`Error receiving NATS message: ${err}`);
                    return;
                }
                console.log(`Received NATS message: ${JSON.stringify(msg.data)}`);
                const todoData = msg.data.toString();
                const message = `New todo item created: ${todoData}`;
                try {
                    console.log("sending todo to telegram")
                    await axios.post(telegramApiUrl, {
                        chat_id: chatId,
                        text: message,
                    })
                    console.log("todo sent to telegram")
                } catch (error) {
                    console.error(`Error sending message to Telegram: ${error}`);
                };
            }
        );
    } catch (error) {
        console.error(`Error connecting to NATS server: ${error}`);
        process.exit(1);
    };
}

start();