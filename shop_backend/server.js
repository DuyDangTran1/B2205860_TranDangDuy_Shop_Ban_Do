require("dotenv").config();
const app = require("./app");
const config = require("./app/config");
const MongoDB = require("./app/utils/mongodb.util");
const http = require("http");
const { Server } = require("socket.io");
const socketHandlers = require("./app/socket");
// const ProductService = require("./app/services/products.service");

async function startServer() {
  try {
    await MongoDB.connect(config.db.uri);
    console.log("Đã kết nối đến cơ sở dữ liệu!");
    // const productService = new ProductService(MongoDB.client);
    // await productService.updateMissingEmbeddings();
    const server = http.createServer(app);

    // 2. Khởi tạo Socket.io với cấu hình CORS
    const io = new Server(server, {
      cors: {
        origin: ["http://localhost:3001", "http://localhost:3002"],
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    app.set("socketio", io);
    socketHandlers(io);
    const PORT = config.app.port;
    server.listen(PORT, () => {
      console.log(`Server đã chạy trên cổng ${PORT}`);
    });
  } catch (error) {
    console.log("Không thể kết nối đến database", error);
    process.exit();
  }
}

startServer();
