# 🚀 Real-Time Chat App (Next.js + Express + Microservices)

A full-featured **real-time chat application** built using **Next.js, Express.js, MongoDB, RabbitMQ, Redis, Socket.IO**, and deployed on **AWS**. The project follows a **microservices architecture** and uses **npm** as the package manager.

---

## 📚 Table of Contents

- [About](#about)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Repo structure](#repo-structure)
  - [Installation](#installation)
- [Environment Variables](#environment-variables)
- [RabbitMQ Setup](#rabbitmq-setup)
- [Running Services (development)](#running-services-development)
- [API Endpoints (example)](#api-endpoints-example)
- [Socket.IO Events (example)](#socketio-events-example)
- [Redis Usage](#redis-usage)
- [Testing](#testing)
- [Deployment](#deployment)
- [Logging & Monitoring](#logging--monitoring)
- [Contributing](#contributing)
- [License](#license)

---

## 🧩 About <a name="about"></a>

This project is a **real-time messaging platform** that enables one-on-one chats with support for text and image messages. It demonstrates a microservice design with event-driven communication via **RabbitMQ** and real-time delivery via **Socket.IO**. MongoDB stores persistent data, Redis is used for caching and ephemeral data (presence, sockets), and services are intended to be deployed on AWS for production.

---

## 🏗 Architecture Overview <a name="architecture-overview"></a>

```
Next.js (Frontend)
       │
       ▼
 ┌──────────────┬──────────────┬──────────────┐
 │ Auth Service │ Chat Service │ User Service │
 └──────────────┴──────────────┴──────────────┘
       │
    RabbitMQ (Event Bus)
       │
    Redis (Caching / PubSub)
       │
    MongoDB (Database)
```

- **Frontend (Next.js)**: UI, authentication, client-side socket connection.
- **Auth Service**: user registration/login, JWT issuance/refresh.
- **User Service**: user profile, contact lists, search.
- **Chat Service**: message persistence, message retrieval, integrations with Socket.IO and RabbitMQ.
- **RabbitMQ**: event bus for notifications, message-delivery events, analytics events, and inter-service commands.
- **Redis**: session store, presence (which user is online), socketId mapping, and fast cache for recent messages.
- **MongoDB**: primary datastore for users, chats, messages, and metadata.

---

## 🧰 Tech Stack <a name="tech-stack"></a>

- **Frontend:** Next.js (React)
- **Backend / Gateway:** Express.js (Node.js)
- **Services:** Node.js + Express microservices
- **Database:** MongoDB (can use MongoDB Atlas)
- **Message Broker:** RabbitMQ
- **Cache / PubSub:** Redis (ElastiCache in AWS)
- **Realtime:** Socket.IO
- **Storage (images):** AWS S3 (or similar)
- **CI / CD:** GitHub Actions (suggested)
- **Deployment:** AWS (EC2, ECS, or EKS), S3, Load Balancer, Route53
- **Package Manager:** npm

---

## ⚙️ Getting Started <a name="getting-started"></a>

Follow these steps to get a local development environment running.

### 🔧 Prerequisites <a name="prerequisites"></a>

Make sure you have installed:

```bash
# Node and npm
node --version    # v18+ recommended
npm --version

# Docker (for RabbitMQ, Redis, and optionally MongoDB)
docker --version

# (Optional) MongoDB locally or use MongoDB Atlas
mongod --version
```

### 📁 Repo structure <a name="repo-structure"></a>

A recommended monorepo layout (adjust to your project):

```
/repo-root
  /services
    /auth-service
    /chat-service
    /user-service
  /gateway                 # express gateway / api
  /frontend                # next.js app
  /infrastructure         # docker-compose, k8s manifests, terraform, etc
  README.md
```

### 🛠 Installation <a name="installation"></a>

Clone the repo and install root dependencies where needed.

```bash
git clone https://github.com/yourusername/realtime-chat-app.git
cd realtime-chat-app
```

Install dependencies for each service and frontend. Example for each package.json folder:

```bash
# in frontend
cd frontend
npm install

# in gateway
cd ../gateway
npm install

# in services/auth-service
cd ../services/auth-service
npm install

# repeat for other services...
```

> Tip: use terminal tabs or a process manager (tmux) to run multiple services concurrently.

---

## 🔐 Environment Variables <a name="environment-variables"></a>

Create `.env` files for each service. Example variables (replace values as necessary).

### Gateway / Backend `.env`
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_jwt_secret
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
REDIS_URL=redis://localhost:6379
S3_BUCKET_NAME=your-s3-bucket
S3_REGION=ap-south-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
```
### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 🐇 RabbitMQ Setup <a name="rabbitmq-setup"></a>

Start RabbitMQ with management UI (recommended for local dev):

```bash
docker run -d --hostname rabbitmq-host --name rabbitmq-container   -e RABBITMQ_DEFAULT_USER=admin -e RABBITMQ_DEFAULT_PASS=admin123   -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

Management UI: http://localhost:15672 (admin / admin123)

If you use docker-compose, add rabbitmq, redis, and mongo services to the compose file.

---

## 🏃 Running Services (development) <a name="running-services-development"></a>

Example start commands (adjust to your package.json scripts):

```bash
# In frontend
cd frontend
npm run dev

# In gateway
cd ../gateway
npm run dev

# In chat service
cd ../services/chat-service
npm run dev

# In auth service
cd ../services/auth-service
npm run dev
```

You can also create a root-level `npm` script that uses `concurrently` or `pm2` to run multiple services.

---

## 🔌 API Endpoints (example) <a name="api-endpoints-example"></a>

> These are example routes — adapt to your implementation.

### Auth Service
- `POST /api/v1/auth/register` — Register user
- `POST /api/v1/auth/login` — Login (returns JWT)
- `POST /api/v1/auth/refresh` — Refresh token

### User Service
- `GET /api/v1/users/:id` — Get user profile
- `GET /api/v1/users/search?q=...` — Search users

### Chat Service
- `GET /api/v1/chat/all` — Get chat list
- `POST /api/v1/chat/new` — Start new chat
- `GET /api/v1/chat/message/:chatId` — Fetch messages
- `POST /api/v1/chat/message` — Send a message (multipart/form-data)
- `POST /api/v1/chat/seen` — Mark messages as seen

---

## 🔊 Socket.IO Events (example) <a name="socketio-events-example"></a>

Client emits / server listens:
- `connect` — Socket connect
- `join` — join chat room (payload: `{ chatId, userId }`)
- `typing` — typing indicator
- `sendMessage` — send message (payload: `{ chatId, text, imageUrl? }`)

Server emits / client listens:
- `message` — new message broadcast
- `message:delivered` — delivery confirmation
- `message:seen` — seen updates
- `user:online` / `user:offline` — presence updates
- `typing` — typing updates

---

## 🧠 Redis Usage <a name="redis-usage"></a>

- Map `userId -> socketId(s)` to deliver messages to connected sockets.
- Cache recent messages for faster read (e.g., last 50 messages of a chat).
- Use Redis pub/sub for cross-node socket event propagation (if scaling Socket.IO across multiple instances).

---

## ✅ Testing <a name="testing"></a>

- Unit tests: Jest (or preferred test runner)
- Integration tests: supertest for API endpoints
- End-to-end: Playwright / Cypress for frontend flows

Example to run tests (if configured):
```bash
npm test
```

---

## ☁️ Deployment <a name="deployment"></a>

Guidelines for deploying to AWS:

- Use **MongoDB Atlas** (or DocumentDB) for managed MongoDB.
- Use **ElastiCache (Redis)** for Redis.
- Use **Amazon MQ** or managed RabbitMQ (or self-host on EC2/ECS).
- Deploy services as Docker containers on **ECS Fargate** or **EKS**.
- Use **S3** + **CloudFront** for serving Next.js static assets (or use Next.js serverless options).
- Manage secrets with **AWS Secrets Manager** or **SSM Parameter Store**.
- Use auto-scaling groups / ECS service autoscaling for throughput.

Build & start (example):
```bash
# build frontend for production
cd frontend
npm run build
npm start

# backend services
cd ../gateway
npm run build
npm start
```

---

## 📈 Logging & Monitoring <a name="logging--monitoring"></a>

- Use **Winston / Pino** for structured logging on backend services.
- Aggregate logs via **CloudWatch Logs** (AWS) or ELK stack.
- Use **Prometheus + Grafana** for metrics, or CloudWatch metrics.
- Setup health-check endpoints for each service and let the load balancer use them.

---

## 🤝 Contributing <a name="contributing"></a>

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "feat: add ..."`
4. Push: `git push origin feature/your-feature`
5. Open a PR and describe your changes

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.

---

## 🧾 License <a name="license"></a>

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
