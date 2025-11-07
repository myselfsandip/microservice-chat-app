import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import http from 'http';

const app = express();
const port = process.env.GATEWAY_SERVICE_PORT || 8000;
const server = http.createServer(app);

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// FIXED: CORRECT VARIABLE NAMES
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5000';
const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:5002';

// User proxy
app.use('/user', createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,
}));

// Chat proxy
const chatProxy = createProxyMiddleware({
    target: CHAT_SERVICE_URL,
    changeOrigin: true,
    ws: true,
});

app.use('/chat', chatProxy);

server.on('upgrade', (req, socket, head) => {
    if (req.url?.startsWith('/chat/socket.io')) {
        console.log('UPGRADING WS:', req.url);
        // @ts-ignore
        chatProxy.upgrade(req, socket, head);
    }
});

app.get('/', (_, res) => res.send('GATEWAY: FULLY WORKING'));

server.listen(port, () => {
    console.log(`Gateway → http://localhost:${port}`);
    console.log(`Proxying /chat → ${CHAT_SERVICE_URL}`);
});