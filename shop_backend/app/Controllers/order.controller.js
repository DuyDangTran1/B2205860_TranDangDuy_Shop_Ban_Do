const MongoDB = require("../utils/mongodb.util");
const OrderService = require("../services/order.service");
const CartService = require("../services/cart.service");
const ApiError = require("../api-error");
const moment = require("moment");
const querystring = require("querystring");
const crypto = require("crypto");
const axios = require("axios");
exports.createOrder = async (req, res, next) => {
  try {
    const { recipient_name, address, phone, pay_method } = req.body;

    // 1. Kiểm tra đầu vào
    if (!recipient_name || !address || !phone || !pay_method) {
      return next(
        new ApiError(
          400,
          "Thiếu thông tin nhận hàng hoặc phương thức thanh toán",
        ),
      );
    }

    const cartService = new CartService(MongoDB.client);
    const orderService = new OrderService(MongoDB.client);

    // 2. Lấy giỏ hàng sạch từ Database (đã lookup giá và discount)
    const cartItems = await cartService.getAll(req.user._id);

    if (!cartItems || cartItems.length === 0) {
      return next(new ApiError(400, "Giỏ hàng rỗng, không thể tạo đơn hàng"));
    }

    // 3. Tính toán tổng tiền thực tế (Check giá + Discount)
    const totalAmount = cartItems.reduce((total, item) => {
      const priceAfterDiscount = item.price * (1 - (item.discount || 0) / 100);
      return total + priceAfterDiscount * item.quantityInCart;
    }, 0);

    // 4. Chuẩn bị payload để lưu vào MongoDB
    const orderPayload = {
      user_id: req.user._id,
      recipient_name,
      address,
      phone,
      total_price: totalAmount,
      pay_method,
      items: cartItems.map((item) => ({
        variant_id: item.variant_id,
        product_name: item.product_name,
        quantity: item.quantityInCart,
        price_at_purchase: item.price * (1 - (item.discount || 0) / 100),
        color: item.color_name,
        size: item.size_name,
        image: item.image,
      })),
    };

    // 5. Lưu đơn hàng vào Database
    const result = await orderService.CreateOrder(orderPayload);
    const orderId = result.insertedId.toString();

    // 6. Xử lý thanh toán VNPAY (Nếu chọn VNPAY)
    if (pay_method === "vnpay") {
      // Đây là đoạn code VNPAY
      let ip =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        "127.0.0.1";

      // convert IPv6 localhost -> IPv4
      if (ip === "::1") {
        ip = "127.0.0.1";
      }

      if (ip.includes("::ffff:")) {
        ip = ip.split("::ffff:")[1];
      }
      const paymentUrl = await generateVnpayUrl(orderId, totalAmount, ip);
      return res.status(200).json({
        message: "Đã tạo đơn hàng, đang chuyển hướng thanh toán",
        paymentUrl,
      });
    } else if (pay_method === "momo") {
      //hàm MoMo
      const paymentUrl = await generateMomoUrl(orderId, totalAmount);
      return res
        .status(200)
        .json({ message: "Đang chuyển hướng MoMo", paymentUrl });
    } else {
      // Thanh toán khi nhận hàng các phương thức khác
      return res.status(201).json({ message: "Đặt hàng thành công!", orderId });
    }
  } catch (error) {
    console.log(error?.response?.data);
    return next(new ApiError(500, "Lỗi trong quá trình tạo đơn hàng"));
  }
};

// Hàm để tạo URL VNPAY
async function generateVnpayUrl(orderId, amount, ipAddr) {
  const tmnCode = process.env.VNP_TMNCODE;
  const secretKey = process.env.VNP_HASHSECRET;
  const vnpUrl = process.env.VNP_URL;
  const returnUrl = process.env.VNP_RETURNURL;

  const date = new Date();
  const createDate = moment(date).format("YYYYMMDDHHmmss");

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId.toString(),
    vnp_OrderInfo: "Thanh_toan_don_hang_" + orderId,
    vnp_OrderType: "other",
    vnp_Amount: amount * 100,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  vnp_Params = Object.keys(vnp_Params)
    .sort()
    .reduce((result, key) => {
      result[key] = vnp_Params[key];
      return result;
    }, {});

  console.log(vnp_Params);

  const signData = querystring.stringify(vnp_Params);
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(signData, "utf-8").digest("hex");
  console.log(hmac);
  console.log("SignData:", signData);
  console.log("SecureHash:", signed);
  vnp_Params["vnp_SecureHash"] = signed;
  return vnpUrl + "?" + querystring.stringify(vnp_Params);
}

exports.vnpayReturn = async (req, res, next) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params["vnp_SecureHash"];

    // 1. Xóa các trường không dùng để băm chữ ký
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    // 2. Sắp xếp lại và check chữ ký (giống hệt bước tạo URL lúc đầu)
    vnp_Params = Object.keys(vnp_Params)
      .sort()
      .reduce((obj, key) => {
        obj[key] = vnp_Params[key];
        return obj;
      }, {});

    const secretKey = process.env.VNP_HASHSECRET;
    const signData = querystring.stringify(vnp_Params);
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(signData, "utf-8").digest("hex");

    // console.log(secretKey);
    // console.log(signData);
    // console.log(hmac);
    // console.log(signed);

    // 3. Nếu chữ ký khớp và ResponseCode là "00"
    if (secureHash === signed && vnp_Params["vnp_ResponseCode"] === "00") {
      const orderId = vnp_Params["vnp_TxnRef"];

      // Cập nhật trạng thái đơn hàng trong DB
      const orderService = new OrderService(MongoDB.client);
      await orderService.updateStatus(
        orderId,
        "Đã thanh toán",
        "Đang chờ xác nhận",
      );

      // Xóa sạch giỏ hàng của User (vì đã mua xong)
      const cartService = new CartService(MongoDB.client);
      await cartService.updateStatus(req.user._id);

      return res
        .status(200)
        .json({ success: true, message: "Thanh toán thành công" });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Chữ ký không hợp lệ" });
    }
  } catch (error) {
    return next(new ApiError(500, "Lỗi xử lý kết quả thanh toán"));
  }
};

async function generateMomoUrl(orderId, amount) {
  const partnerCode = process.env.PARTNERCODE_MOMO;
  const accessKey = process.env.ACCESSKEY_MOMO;
  const secretKey = process.env.SECRETKEY_MOMO;
  const endpoint = process.env.ENDPOINT_MOMO;

  // 1. requestId vẫn dùng timestamp để không bao giờ bị trùng (MoMo bắt buộc)
  const requestId = partnerCode + new Date().getTime();

  // 2. GIỮ NGUYÊN orderId từ MongoDB truyền vào (để sau này cập nhật DB)
  const orderIdStr = orderId.toString();

  const amountNumber = Number(amount);
  const orderInfo = "Thanh_toan_don_hang";
  const redirectUrl = process.env.REDIRECTURL_MOMO;
  const ipnUrl = process.env.IPNURL_MOMO;
  const requestType = "captureWallet";
  const extraData = "";

  // 3. Chuỗi băm (Raw Signature) - Ní soi kỹ thứ tự này
  const rawSignature = `accessKey=${accessKey}&amount=${amountNumber}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderIdStr}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  // 4. Body gửi đi
  const requestBody = {
    partnerCode,
    partnerName: "Test",
    storeId: "MomoTestStore",
    requestId,
    amount: amountNumber,
    orderId: orderIdStr, // Gửi ID của DB sang MoMo
    orderInfo,
    redirectUrl,
    ipnUrl,
    lang: "vi",
    requestType,
    autoCapture: true,
    extraData,
    signature,
  };

  const response = await axios.post(endpoint, requestBody);
  return response.data.payUrl;
}
exports.momoReturn = async (req, res, next) => {
  try {
    const { resultCode, orderId } = req.query;

    // resultCode = 0 là thanh toán thành công trong MoMo
    if (resultCode == "0") {
      const orderService = new OrderService(MongoDB.client);
      const cartService = new CartService(MongoDB.client);

      // Cập nhật trạng thái
      await orderService.updateStatus(
        orderId,
        "Đã thanh toán",
        "Đang chờ xác nhận",
      );
      await cartService.updateStatus(req.user._id);

      return res
        .status(200)
        .json({ success: true, message: "Thanh toán MoMo thành công" });
    } else {
      return res.status(400).json({
        success: false,
        message: "Thanh toán MoMo thất bại hoặc bị hủy",
      });
    }
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Lỗi xử lý kết quả MoMo"));
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const orderService = new OrderService(MongoDB.client);
    const orders = await orderService.getAllOrders();
    return res.json({ orders: orders });
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};

exports.getAllOrdersByUser = async (req, res, next) => {
  try {
    const user_id = req.user._id;
    const orderService = new OrderService(MongoDB.client);
    const orders = await orderService.getAllOrdersByUser(user_id);
    return res.json({ orders: orders });
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const arr_status = [
      "Đang chờ xác nhận",
      "Đã xác nhận",
      "Đang giao",
      "Đã giao",
    ];
    const id = req.params.id;
    const { pay_status, status } = req.body;
    const employee_id = status === "Đã xác nhận" ? req.user._id : null;

    const orderService = new OrderService(MongoDB.client);
    const order = await orderService.findOrder(id);
    const index_current_order_status = arr_status.findIndex(
      (Element) => Element === order.order_status,
    );
    const index_update_status = arr_status.findIndex(
      (Element) => Element === status,
    );
    if (index_current_order_status < index_update_status) {
      await orderService.updateStatus(id, pay_status, status, employee_id);
    } else {
      return next(
        new ApiError(
          400,
          "Trạng thái cập nhật không phù hợp với trạng thái hiện tại",
        ),
      );
    }

    return res.send("Cập nhật trạng thái thành công");
  } catch (error) {
    return next(new ApiError(500, "Lỗi Server"));
  }
};

exports.orderReceiveConfirm = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) return next(new ApiError(400, "Lỗi truyền dữ liệu"));

    const orderService = new OrderService(MongoDB.client);
    await orderService.receiveConfirm(id);

    return res.send("Xác nhận đã nhận hàng thành công");
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};
