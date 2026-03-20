<script>
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import userService from "@/services/user.service"; // API lấy danh sách chờ
import chatService from "@/services/chat.service"; // API lấy lịch sử chat
import MarkdownIt from "markdown-it";

const socket = io("http://localhost:3000");
const md = new MarkdownIt({ html: true, breaks: true });

export default {
  data() {
    return {
      waitingList: [],
      selectedUser: null,
      messages: [],
      input: "",
      adminInfo: null,
      accessToken: sessionStorage.getItem("accessToken") || null,
    };
  },
  methods: {
    // 1. Lấy danh sách khách hàng đang ở mode 'staff' và chưa có ai nhận
    async fetchWaitingList() {
      try {
        const res = await userService.getWaitingList();
        this.waitingList = res.data;
        console.log(this.waitingList);
      } catch (error) {
        console.error("Lỗi lấy danh sách chờ:", error);
      }
    },

    // 2. Khi Admin bấm vào một khách hàng
    async selectUser(user) {
      this.selectedUser = user;
      // Join vào phòng của khách đó để bắt đầu "hóng" tin nhắn
      socket.emit("join_room", user._id);

      // Load lại lịch sử để biết nãy giờ con Bot Gemini nó nói gì với khách
      const res = await chatService.getHistoryForAdmin(user._id);
      console.log(res);
      this.messages = res.history || [];
      this.scrollToBottom();
    },

    // 3. Admin bấm nút "Nhận tư vấn" để khóa khách này lại
    acceptChat() {
      if (!this.selectedUser) return;
      socket.emit("staff_accept_chat", {
        userId: this.selectedUser._id,
        staffId: this.adminInfo.id,
        staffName: this.adminInfo.name,
      });
    },

    // 4. Gửi tin nhắn cho khách
    sendToUser() {
      if (!this.input.trim() || !this.selectedUser) return;

      const msgData = {
        userId: this.selectedUser._id,
        content: this.input,
        staffId: this.adminInfo.id,
      };

      socket.emit("staff_send_message", msgData);

      // Đẩy vào mảng messages để hiển thị phía Admin
      this.messages.push({ role: "model", content: this.input });
      this.input = "";
      this.scrollToBottom();
    },

    // 5. Kết thúc tư vấn, trả khách về cho AI
    endChat() {
      if (confirm("Kết thúc tư vấn cho khách này?")) {
        socket.emit("end_chat", this.selectedUser._id);
        this.selectedUser = null;
        this.messages = [];
        this.fetchWaitingList();
      }
    },

    formatMessage(text) {
      return md.render(text);
    },
    scrollToBottom() {
      /* Giống bên trang User */
    },
  },

  mounted() {
    this.adminInfo = jwtDecode(this.accessToken);
    this.fetchWaitingList();

    // Lắng nghe khi có khách mới yêu cầu hỗ trợ (Real-time update list)
    socket.on("update_waiting_list", () => {
      this.fetchWaitingList();
    });

    // Lắng nghe tin nhắn từ khách gửi lên
    socket.on("receive_message", (data) => {
      if (this.selectedUser && data.role === "user") {
        this.messages.push(data);
        this.scrollToBottom();
      }
    });
  },
};
</script>
<template>
  <div class="consult-container d-flex">
    <div class="user-list-side border-end">
      <div class="p-3 bg-light border-bottom fw-bold">
        Khách hàng cần tư vấn
      </div>
      <div
        v-for="user in waitingList"
        :key="user._id"
        @click="selectUser(user)"
        :class="[
          'user-item p-3 border-bottom cursor-pointer',
          { active: selectedUser?._id === user._id },
        ]"
      >
        <div class="fw-bold">{{ user.name }}</div>
        <small class="text-muted">{{ user.email }}</small>
      </div>
    </div>

    <div
      class="chat-main-side flex-grow-1 d-flex flex-direction-column"
      v-if="selectedUser"
    >
      <div
        class="chat-header p-3 border-bottom d-flex justify-content-between align-items-center bg-white"
      >
        <div>
          <span class="fw-bold">{{ selectedUser.name }}</span>
          <small class="ms-2 text-success">● Đang kết nối</small>
        </div>
        <div class="actions">
          <button
            class="btn btn-sm btn-outline-primary me-2"
            @click="acceptChat"
          >
            Nhận tư vấn
          </button>
          <button class="btn btn-sm btn-outline-danger" @click="endChat">
            Kết thúc
          </button>
        </div>
      </div>

      <div
        class="chat-body p-3 flex-grow-1 overflow-auto bg-light"
        ref="chatBody"
      >
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          :class="[
            'msg-wrapper d-flex mb-3',
            msg.role === 'user'
              ? 'justify-content-start'
              : 'justify-content-end',
          ]"
        >
          <div
            :class="[
              'msg-bubble p-2 rounded shadow-sm',
              msg.role === 'user' ? 'bg-white' : 'bg-brown text-white',
            ]"
            v-html="formatMessage(msg.content)"
          ></div>
        </div>
      </div>

      <div class="chat-footer p-3 bg-white border-top">
        <div class="input-group">
          <input
            v-model="input"
            @keyup.enter="sendToUser"
            class="form-control"
            placeholder="Nhập câu trả lời..."
          />
          <button class="btn btn-brown text-white" @click="sendToUser">
            Gửi
          </button>
        </div>
      </div>
    </div>
    <div
      v-else
      class="no-user flex-grow-1 d-flex align-items-center justify-content-center text-muted"
    >
      Chọn một khách hàng để bắt đầu hỗ trợ
    </div>
  </div>
</template>
<style scoped>
.consult-container {
  height: calc(100vh - 70px);
  background: #fff;
}
.user-list-side {
  width: 300px;
  overflow-y: auto;
  background: #fafafa;
}
.user-item:hover {
  background: #f0f0f0;
}
.user-item.active {
  background: #efebe9;
  border-left: 4px solid #533422;
}
.chat-main-side {
  display: flex;
  flex-direction: column;
}
.msg-bubble {
  max-width: 70%;
  font-size: 14px;
}
.bg-brown {
  background-color: #533422 !important;
}
.btn-brown {
  background-color: #533422;
  border: none;
}
.btn-brown:hover {
  background-color: #3e271a;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
