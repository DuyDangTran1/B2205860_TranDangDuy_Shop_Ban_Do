const { ObjectId } = require("mongodb");
const genai = require("@google/genai");

class Chat {
  constructor(client) {
    this.db = client.db();
    this.Chat = this.db.collection("Message");
    // Cấu hình Gemini
    this.ai = new genai.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  extractChatData(payload) {
    const message = {
      user_id: payload.user_id,
      role: payload.role,
      content: payload.content,
      type: payload.type,
      createdAt: new Date(),
    };

    Object.keys(message).forEach(
      (key) => message[key] === undefined && delete message[key],
    );

    if (payload.products && payload.products.length > 0)
      message.products = payload.products;

    return message;
  }

  async saveMessage(payload) {
    const chat = this.extractChatData(payload);
    return await this.Chat.insertOne(chat);
  }

  async getHistoryForAI(user_id) {
    return await this.Chat.find({
      user_id: user_id,
      type: "ai",
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
  }

  async staffReply(user_id, content) {
    return await this.saveMessage({
      user_id,
      role: "staff",
      content,
      type: "human",
    });
  }

  // hàm chuyển câu hỏi về dang vector
  async embeddingQuestion(content) {
    const text = content.trim();
    try {
      const result = await this.ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
      });

      if (result && result.embeddings && result.embeddings.length > 0) {
        return result.embeddings[0].values;
      }

      return null;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async getHistoryUser(user_id) {
    // console.log(user_id);
    return this.Chat.find({
      user_id: ObjectId.isValid(user_id) ? new ObjectId(user_id) : null,
    }).toArray();
  }
}

module.exports = Chat;
