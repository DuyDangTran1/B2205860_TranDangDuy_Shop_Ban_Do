<script>
import chatService from "@/services/chat.service";
import MarkdownIt from "markdown-it";
import { jwtDecode } from "jwt-decode";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");
const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
});

export default {
  emits: ["close"],
  data() {
    return {
      messages: [],
      input: "",
      loading: false,
      accessToken: sessionStorage.getItem("accessToken") || null,
      userId: null,
    };
  },

  methods: {
    async LoadData() {
      try {
        if (this.accessToken) {
          const res = await chatService.getHistory();
          this.messages = res.history ? res.history : [];
        }
      } catch (error) {
        console.error("Lỗi load lịch sử:", error);
      }
    },

    setupSocket() {
      if (!this.accessToken) return;

      try {
        const decoded = jwtDecode(this.accessToken);
        this.userId = decoded.id; // Lấy ID từ token

        if (this.userId) {
          // Join vào phòng riêng
          socket.emit("join_room", this.userId);

          // Lắng nghe tin nhắn từ nhân viên (Real-time)
          socket.on("receive_message", (data) => {
            // Chỉ nhận tin từ nhân viên (role model), tin của mình đã push lúc gửi rồi
            if (data.role === "model") {
              this.messages.push({
                role: "ai",
                content: data.content,
              });
              this.scrollToBottom();
            }
          });

          // Lắng nghe khi cuộc chat kết thúc
          socket.on("chat_ended", (msg) => {
            this.messages.push({ role: "ai", content: msg });
            this.scrollToBottom();
          });
        }
      } catch (err) {
        console.error("Lỗi cấu hình Socket:", err);
      }
    },

    formatMessage(text) {
      if (!text) return "";

      let cleanedText = text.replace(/\*\*\[PRODUCT_CARD:/g, "[PRODUCT_CARD:");
      cleanedText = cleanedText.replace(/\]\*\*/g, "]");

      const cardRegex = /\[PRODUCT_CARD: (.*)\]/g;

      const hasCard = cardRegex.test(cleanedText);

      let htmlContent = cleanedText.replace(cardRegex, (match, content) => {
        const parts = content.split("|").map((p) => p.trim());
        if (parts.length < 4) return match;

        const [name, id, img, price] = parts;
        const fullSrc = img.startsWith("http")
          ? img
          : `http://localhost:3000/${img}`;

        return `<div class="product-item-card clickable-card" data-id="${id}"><div class="card-thumb"><img src="${fullSrc}" alt="${name}" onerror="this.src='/images/product_default.jpg'"/></div><div class="card-body-content"><div class="p-title">${name}</div><div class="p-price-tag">${price} VNĐ</div><div class="p-detail-btn">Xem chi tiết <i class="fa-solid fa-arrow-right"></i></div></div></div>`;
      });

      if (hasCard) {
        return md.render(htmlContent);
      }

      return md.render(cleanedText);
    },
    handleChatClick(event) {
      const target = event.target.closest(".clickable-card");
      if (target) {
        const id = target.getAttribute("data-id");
        this.$router.push({ name: "Detail", params: { id: id } });
        this.$emit("close");
      }
    },

    async sendMessage() {
      if (!this.input.trim()) return;
      const userMessage = this.input;
      this.messages.push({ role: "user", content: userMessage });
      this.input = "";
      this.loading = true;
      this.scrollToBottom();

      socket.emit("user_send_message", {
        userId: this.userId,
        content: userMessage,
      });

      try {
        const res = await chatService.chat({ content: userMessage });
        if (res.mode === "ai") {
          this.messages.push({ role: "ai", content: res.reply });
        }
      } catch (error) {
        this.messages.push({
          role: "ai",
          content: "Nhân viên sẽ tư vấn cho bạn sau ít phút nữa.",
        });
      } finally {
        this.loading = false;
        this.scrollToBottom();
      }
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const body = this.$refs.chatBody;
        if (body) body.scrollTop = body.scrollHeight;
      });
    },
  },

  mounted() {
    this.LoadData();
    this.setupSocket();
    this.scrollToBottom();
  },
  unmounted() {
    socket.off("receive_message");
    socket.off("chat_ended");
    console.log("Đã ngắt các lắng nghe socket chat");
  },
};
</script>

<template>
  <div class="chat-widget shadow">
    <div class="chat-header">
      <div class="d-flex align-items-center">
        <div class="online-status me-2"></div>
        <span class="fw-bold">Tư vấn SHOPDD</span>
      </div>
      <span class="close-icon" @click="$emit('close')">✖</span>
    </div>

    <div class="chat-body" ref="chatBody" @click="handleChatClick">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['message-item', msg.role]"
      >
        <div class="bubble">
          <div
            class="message-content"
            v-html="formatMessage(msg.content)"
          ></div>
        </div>
      </div>

      <div v-if="loading" class="message-item ai">
        <div class="bubble">
          <div class="typing-dots">
            <span>.</span><span>.</span><span>.</span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-footer">
      <input
        v-model="input"
        @keyup.enter="sendMessage"
        placeholder="Nhập tin nhắn..."
      />
      <button class="send-btn" @click="sendMessage">
        <i class="fa-solid fa-paper-plane"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Widget */
.chat-widget {
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 340px;
  height: 480px;
  background: white;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  z-index: 9999;
  border: 1px solid #eee;
}

.chat-header {
  background: #533422;
  color: white;
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  border-radius: 15px 15px 0 0;
}

.online-status {
  width: 10px;
  height: 10px;
  background: #2ecc71;
  border-radius: 50%;
}

.chat-body {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  background: #fdfaf8;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  display: flex;
  width: 100%;
  margin-bottom: 5px;
}
.message-item.user {
  justify-content: flex-end;
}
.message-item.ai {
  justify-content: flex-start;
}

.bubble {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 15px;
  font-size: 14px;
  line-height: 1.4;
}
.user .bubble {
  background: #ac7657;
  color: white;
  border-bottom-right-radius: 2px;
}
.ai .bubble {
  background: white;
  color: #333;
  border: 1px solid #eee;
  border-bottom-left-radius: 2px;
}

:deep(.product-item-card) {
  display: flex !important;
  background: #fff !important;
  border: 1px solid #eee !important;
  border-radius: 12px !important;
  margin: 12px 0 !important;
  overflow: hidden !important;
  cursor: pointer !important;
  transition: 0.3s ease;
  width: 100%;
}

:deep(.product-item-card:hover) {
  border-color: #ac7657 !important;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
}

:deep(.card-thumb) {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}
:deep(.card-thumb img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:deep(.card-body-content) {
  padding: 8px 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

:deep(.p-title) {
  font-weight: 600;
  font-size: 13px;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.p-price-tag) {
  font-weight: bold;
  color: #ac7657;
  font-size: 12px;
  margin-top: 4px;
}
:deep(.p-detail-btn) {
  font-size: 11px;
  text-align: right;
  color: #888;
  margin-top: 5px;
}

/* Footer */
.chat-footer {
  padding: 10px;
  display: flex;
  gap: 8px;
  border-top: 1px solid #eee;
}
.chat-footer input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 6px 15px;
  outline: none;
}
.send-btn {
  background: none;
  border: none;
  color: #ac7657;
  font-size: 18px;
  cursor: pointer;
}
.close-icon {
  cursor: pointer;
}

/* Dots */
.typing-dots span {
  animation: blink 1s infinite;
  margin: 0 2px;
}
@keyframes blink {
  0% {
    opacity: 0.2;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.2;
  }
}
</style>
