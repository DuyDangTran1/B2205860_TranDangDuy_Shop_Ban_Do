const { ObjectId } = require("mongodb");
const MongoDB = require("./utils/mongodb.util");
const ChatService = require("./services/chat.service");
const UserService = require("./services/user.service");

module.exports = (io) => {
  io.on("connection", (socket) => {
    // 1. Tham gia phòng (Room ID = User ID)
    socket.on("join_room", (userId) => {
      const roomId = String(userId);
      socket.join(userId);
      console.log(`[Socket] ID ${socket.id} joined room: ${userId}`);
    });

    // 2. Nhân viên nhận tư vấn
    socket.on("staff_accept_chat", async (data) => {
      const { userId, staffId, staffName } = data;
      try {
        const userService = new UserService(MongoDB.client);
        const user = await userService.find({ _id: new ObjectId(userId) });

        if (user.current_staff_id && user.current_staff_id !== staffId) {
          return socket.emit("accept_error", "Nhân viên khác đang tư vấn");
        }

        await userService.updateStaffChat(userId, staffId);

        // Thông báo cho cả phòng biết nhân viên đã vào
        io.to(userId).emit("staff_joined", { staffName });
        // Cập nhật danh sách chờ cho toàn bộ Admin khác
        io.emit("update_waiting_list", { userId, status: "busy" });
      } catch (err) {
        console.error("Lỗi nhận tư vấn:", err);
      }
    });

    // 3. Nhân viên gửi tin nhắn
    socket.on("staff_send_message", async (data) => {
      const { userId, content, staffId } = data;
      try {
        const chatService = new ChatService(MongoDB.client);
        await chatService.saveMessage({
          user_id: userId,
          role: "model",
          content: content,
          type: "human",
          staff_id: staffId,
        });

        io.to(userId).emit("receive_message", {
          role: "model",
          content: content,
        });
      } catch (err) {
        console.error("Lỗi nhân viên gửi tin:", err);
      }
    });

    // 4. Khách hàng gửi tin nhắn (Dùng io.to thay vì socket.to)
    socket.on("user_send_message", async (data) => {
      const { userId, content } = data;
      // Gửi cho tất cả (bao gồm cả nhân viên và các tab khác của khách)
      io.to(userId).emit("receive_message", {
        role: "user",
        content: content,
      });
    });

    // 5. Kết thúc tư vấn
    socket.on("end_chat", async (userId) => {
      try {
        const userService = new UserService(MongoDB.client);
        await userService.updateChatMode(userId, "ai");

        io.emit("update_waiting_list"); // Load lại danh sách chờ cho Admin
      } catch (err) {
        console.error("Lỗi kết thúc chat:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });
};
