const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const UserService = require("../services/user.service");
const ChatService = require("../services/chat.service");
const ProductService = require("../services/products.service");
const genai = require("@google/genai");

function isNewSearchIntent(message, hasLastest) {
  if (!message) return false;

  const detailKeywords = /(size|kích cỡ|màu|giá|bao nhiêu|còn hàng|còn không)/i;
  if (detailKeywords.test(message) && hasLastest) {
    return false;
  }

  // Nhóm 1: Tên loại đồ
  const items = "áo|quần|váy|hoodie|sơ mi|thun|khoác|đầm|jean|kaki|short|polo";
  // Nhóm 2: Nhu cầu/Hoàn cảnh
  const context =
    "thể thao|gym|đá banh|đi chơi|đi tiệc|công sở|mùa hè|mùa đông|nắng|lạnh";
  // Nhóm 3: Tính từ mô tả/Hành động
  const action = "tìm|mua|bst|mới|hot|nào|gì";

  const productKeywords = new RegExp(`(${items}|${context}|${action})`, "i");

  return productKeywords.test(message);
}

exports.chat = async (req, res, next) => {
  if (!req.body.content)
    return next(new ApiError(new (400, "Lỗi truyền dữ liệu")()));
  try {
    const ai = new genai.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    let matchedProducts = null;

    const userService = new UserService(MongoDB.client);
    const chatService = new ChatService(MongoDB.client);
    const productService = new ProductService(MongoDB.client);
    // check session
    const history = await chatService.getHistoryForAI(req.user._id);
    const historyText = history
      .reverse()
      .map((msg) => {
        if (msg.role === "user") {
          return `Khách: ${msg.content}`;
        }
        return `AI: ${msg.content}`;
      })
      .join("\n");
    if (req.user?.chat_mode === "staff") {
      await chatService.saveMessage({
        user_id: req.user._id,
        role: "user",
        content: req.body.content,
        type: "human",
      });

      const io = req.app.get("socketio");
      if (io) {
        io.emit("update_waiting_list");
      }

      return res.send({
        mode: "staff",
        reply: "Nhân viên sẽ hỗ trợ bạn sớm.",
      });
    }

    // lưu tin user
    await chatService.saveMessage({
      user_id: req.user._id,
      role: "user",
      content: req.body.content,
      type: "ai",
    });

    const hasLastest = req.user?.lastestProduct?.length > 0;
    const isNewSearch = isNewSearchIntent(req.body.content, hasLastest);

    if (isNewSearch || !hasLastest) {
      //Search mới
      const questionEmbedding = await chatService.embeddingQuestion(
        req.body.content,
      );

      matchedProducts =
        await productService.searchProductVector(questionEmbedding);

      if (matchedProducts?.length > 0) {
        await userService.updateLastestMessage(req.user.email, matchedProducts);
      }
    } else {
      matchedProducts = req.user?.lastestProduct;
    }

    let contextProduct = "Không tìm thấy sản phẩm phù hợp.";

    if (matchedProducts?.length > 0) {
      contextProduct = matchedProducts
        .map((p) => {
          const variantsText = p.variants
            ?.map(
              (v) =>
                `- Màu: ${v.color_name}, Size: ${v.size_name}, Tồn kho: ${v.quantity}`,
            )
            .join("\n");

          return `
ID: ${p._id}
Tên: ${p.product_name}
Giá niêm yết: ${p.base_price}
Mô tả: ${p.description}
Hình ảnh: ${p.image_url}
Màu và Size:
${variantsText || "Không có thông tin"}
`;
        })
        .join("\n\n");
    }
    // prompt RAG
    const prompt = `
# VAI TRÒ
Bạn là "nhân viên tư vấn" - Chuyên viên tư vấn thời trang thông minh của SHOPDB.
Phong cách: Trẻ trung, năng động, gọi khách là "anh/chị". 

# DỮ LIỆU KHO HÀNG (CONTEXT)
${contextProduct}

# LỊCH SỬ HỘI THOẠI (HISTORY)
${historyText}

# QUY TẮC TRÌNH BÀY SẢN PHẨM (BẮT BUỘC):
1. ĐỊNH DẠNG HIỂN THỊ: Mỗi sản phẩm khi giới thiệu PHẢI tuân thủ đúng cấu trúc:
   Mỗi sản phẩm phải hiển thị đúng cấu trúc sau:

1. Khi giới thiệu sản phẩm, bạn PHẢI viết theo đúng cấu trúc mã sau để hệ thống hiển thị Card:
   [PRODUCT_CARD: Tên_Sản_Phẩm | ID_SẢN_PHẨM | URL_ẢNH | GIÁ]

2. CHỈ hiển thị Card khi:
   - Khách yêu cầu tìm kiếm mẫu mới.
   - Bạn gợi ý sản phẩm phù hợp.
   - Tuyệt đối KHÔNG hiện Card khi chỉ đang trả lời về Size, Màu hoặc Giá của sản phẩm khách vừa hỏi.

3. Ví dụ:
   "Dạ anh xem thử mẫu này nhé:
   [PRODUCT_CARD: Áo Thun Torano | 697b7154c7368... | uploads/products/abc.png | 195.000]"
2. CẤU TRÚC PHẢN HỒI: 
   - Không viết đoạn văn dài quá 5 dòng. Hãy ngắt dòng thường xuyên để dễ đọc.
   - Chỉ liệt kê tối đa 3 sản phẩm phù hợp nhất với yêu cầu khách.

3. QUY TẮC BIẾN THỂ (SIZE/MÀU):
   - Khi khách hỏi "còn size X không": Trả lời trực tiếp là "Shop hiện còn" hoặc "Tiếc quá mẫu này shop vừa hết size đó rồi ạ".
   - Nếu dữ liệu sản phẩm không có thông tin Size/Màu: Chỉ báo Giá và Mô tả, tuyệt đối không nói "chưa có thông tin trên hệ thống".

4. CHUYỂN GIAO STAFF:
   - Nếu khách hỏi ngoài lề (chính sách, khiếu nại) hoặc không tìm thấy bất kỳ sản phẩm nào phù hợp:
     Trả lời duy nhất cụm từ: [TRANSFER_STAFF]

# YÊU CẦU CỤ THỂ:
- Chào khách ngắn gọn, thân thiện.
- Trình bày danh sách sản phẩm rõ ràng, có ảnh và link.
- Kết thúc bằng một câu hỏi gợi mở (Ví dụ: "Anh/chị có ưng mẫu nào trong số này không?").

# CÂU HỎI HIỆN TẠI CỦA KHÁCH:
"${req.body.content}"
`;
    // gọi Gemini đúng cách
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const aiReply = result.text;

    // console.log(aiReply);
    // chuyển staff nếu cần
    if (aiReply.includes("[TRANSFER_STAFF]")) {
      await userService.updateChatMode(req.user._id, "staff");
      return res.send({
        mode: "staff",
        reply: "Nhân viên sẽ hỗ trợ bạn sớm nhất.",
      });
    }

    // lưu tin AI
    await chatService.saveMessage({
      user_id: req.user._id,
      role: "model",
      content: aiReply,
      type: "ai",
    });

    return res.send({
      mode: "ai",
      reply: aiReply,
    });
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Lỗi server"));
  }
};

exports.getHistoryUser = async (req, res, next) => {
  try {
    const chatService = new ChatService(MongoDB.client);
    const history = await chatService.getHistoryUser(req.user._id);
    // console.log(history);
    return res.json({ history: history });
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};

exports.getHistoryStaff = async (req, res, next) => {
  try {
    const user_id = req.params.user_id;
    const chatService = new ChatService(MongoDB.client);
    const history = await chatService.getHistoryUser(user_id);
    // console.log(history);
    return res.json({ history: history });
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};
