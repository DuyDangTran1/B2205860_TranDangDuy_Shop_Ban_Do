const MongoDB = require("../utils/mongodb.util");
const OrderService = require("../services/order.service");
const CartService = require("../services/cart.service");
const Product_Variant = require("../services/products_variant.service");
const VoucherService = require("../services/voucher.service");
const UserService = require("../services/user.service");
const WareHouseService = require("../services/warehouse.service");
const ActivityService = require("../services/activity.service");
const ApiError = require("../api-error");
const { ObjectId } = require("mongodb");
const moment = require("moment");
const querystring = require("querystring");
const crypto = require("crypto");
const axios = require("axios");
exports.createOrder = async (req, res, next) => {
  try {
    const {
      recipient_name,
      address,
      phone,
      pay_method,
      items,
      applied_voucher,
      is_quick_buy, // Nhận thêm flag này từ Frontend gửi lên nè Duy
    } = req.body;

    // 1. Kiểm tra đầu vào cơ bản
    if (!recipient_name || !address || !phone || !pay_method) {
      return next(
        new ApiError(
          400,
          "Thiếu thông tin nhận hàng hoặc phương thức thanh toán",
        ),
      );
    }
    if (!items || items.length === 0)
      return next(new ApiError(400, "Thiếu sản phẩm cần mua"));

    const cartService = new CartService(MongoDB.client);
    const orderService = new OrderService(MongoDB.client);
    const productVariant = new Product_Variant(MongoDB.client);

    let validItems = [];

    // 2. PHÂN LUỒNG XỬ LÝ DỮ LIỆU
    if (is_quick_buy) {
      // LUỒNG MUA NHANH: Check trực tiếp kho cho từng item gửi lên
      for (const item of items) {
        const variant = await productVariant.findVariantById(item.variant_id);

        if (!variant || variant.quantity < item.quantityInCart) {
          return next(
            new ApiError(
              400,
              `Sản phẩm ${item.product_name} đã hết hàng hoặc không đủ số lượng`,
            ),
          );
        }

        // Build object chuẩn để dùng cho logic phía sau
        validItems.push({
          variant_id: variant._id,
          product_name: item.product_name,
          product_id: variant.product_id,
          price: variant.price || item.price,
          discount: item.discount || 0,
          quantityInCart: item.quantityInCart,
          color_name: item.color_name,
          size_name: item.size_name,
          image: item.image,
        });
      }
    } else {
      // LUỒNG GIỎ HÀNG: Giữ nguyên logic cũ của Duy, check khớp với Cart trong DB
      const cartItems = await cartService.getAll(req.user._id);
      if (!cartItems || cartItems.length === 0) {
        return next(new ApiError(400, "Giỏ hàng rỗng, không thể tạo đơn hàng"));
      }

      for (const item of items) {
        const found = cartItems.find(
          (c) =>
            c.variant_id.toString() === item.variant_id &&
            c.quantityInCart >= item.quantityInCart,
        );
        if (!found)
          return next(
            new ApiError(
              400,
              "Sản phẩm không hợp lệ hoặc đã thay đổi trong giỏ",
            ),
          );
        validItems.push(found);
      }
    }

    // 3. TÍNH TOÁN TỔNG TIỀN (Chung cho cả 2 luồng)
    const totalAmount = validItems.reduce((total, item) => {
      const priceAfterDiscount = item.price * (1 - (item.discount || 0) / 100);
      return total + priceAfterDiscount * item.quantityInCart;
    }, 0);

    let discountAmount = 0;
    if (applied_voucher) {
      const voucherService = new VoucherService(MongoDB.client);
      const vCheck = await voucherService.checkVoucher(
        applied_voucher,
        totalAmount,
        req.user.rank,
        req.user._id,
      );
      if (vCheck.valid) {
        discountAmount = vCheck.discountAmount;
      }
    }

    const finalPrice = totalAmount - discountAmount;

    // 4. THIẾT LẬP TRẠNG THÁI ĐƠN HÀNG
    let initialPayStatus = "Chờ thanh toán";
    let initialOrderStatus = "Đang chờ thanh toán";

    if (pay_method === "cod") {
      initialPayStatus = "Chưa thanh toán";
      initialOrderStatus = "Đang chờ xác nhận";
    }

    const orderPayload = {
      user_id: req.user._id,
      recipient_name,
      address,
      phone,
      sub_total: totalAmount,
      total_price: finalPrice,
      applied_voucher: applied_voucher || null,
      discount_amount: discountAmount,
      pay_method,
      pay_status: initialPayStatus,
      order_status: initialOrderStatus,
      items: validItems.map((item) => {
        const discountRate = item.discount || 0;
        const priceAfterDiscount = item.price * (1 - discountRate / 100);
        return {
          variant_id: item.variant_id,
          product_name: item.product_name,
          product_id: item.product_id,
          quantity: item.quantityInCart,
          base_price: item.price,
          discount: discountRate,
          price_at_purchase: priceAfterDiscount,
          color: item.color_name,
          size: item.size_name,
          image: item.image,
        };
      }),
    };

    const result = await orderService.CreateOrder(orderPayload);
    const orderId = result.insertedId.toString();

    // 5. XỬ LÝ THANH TOÁN ONLINE HOẶC COD
    if (pay_method === "vnpay") {
      let ip =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        "127.0.0.1";
      if (ip === "::1") ip = "127.0.0.1";
      if (ip.includes("::ffff:")) ip = ip.split("::ffff:")[1];

      const paymentUrl = await generateVnpayUrl(orderId, finalPrice, ip);
      return res
        .status(200)
        .json({ message: "Đang chuyển hướng VNPAY", paymentUrl });
    } else if (pay_method === "momo") {
      const paymentUrl = await generateMomoUrl(orderId, finalPrice);
      return res
        .status(200)
        .json({ message: "Đang chuyển hướng MoMo", paymentUrl });
    } else {
      // XỬ LÝ HẬU CẦN CHO COD (Thanh toán sau)
      const voucherService = new VoucherService(MongoDB.client);
      const warehouseService = new WareHouseService(MongoDB.client);
      // Trừ kho
      for (const item of orderPayload.items) {
        await productVariant.adjustQuantity(item.variant_id, -item.quantity);
      }

      const exportBillCOD = {
        type: "Phiếu xuất hàng",
        order_id: new ObjectId(orderId),
        employee_id: null, // Khách tự chốt đơn COD
        reason: `Xuất kho cho đơn hàng COD mới: ${orderId}`,
        total_price: finalPrice,
        items: orderPayload.items.map((i) => ({
          variant_id: i.variant_id,
          product_name: i.product_name,
          quantity: i.quantity,
          color_name: i.color,
          size_name: i.size,
        })),
      };
      await warehouseService.createBill(exportBillCOD);

      // Trừ lượt dùng voucher
      if (applied_voucher) {
        await voucherService.incrementUsedCount(applied_voucher, req.user._id);
      }

      // CHỈ XÓA GIỎ HÀNG NẾU KHÔNG PHẢI MUA NHANH
      if (!is_quick_buy) {
        for (const item of orderPayload.items) {
          await cartService.delete(req.user._id, item.variant_id);
        }
      }

      return res.status(201).json({
        success: true,
        message: "Đặt hàng thành công!",
        orderId,
      });
    }
  } catch (error) {
    console.log(error);
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

    // 3. Nếu chữ ký khớp và ResponseCode là "00"
    if (secureHash === signed && vnp_Params["vnp_ResponseCode"] === "00") {
      const orderId = vnp_Params["vnp_TxnRef"];

      // Cập nhật trạng thái đơn hàng trong DB
      const orderService = new OrderService(MongoDB.client);
      const productVariant = new Product_Variant(MongoDB.client);
      const voucherService = new VoucherService(MongoDB.client);
      const warehouseService = new WareHouseService(MongoDB.client);
      //Kiểm tra số lượng sản phẩm có đủ trong kho không
      const order = await orderService.findOrder(orderId);

      if (order.applied_voucher) {
        await voucherService.incrementUsedCount(
          order.applied_voucher,
          order.user_id,
        );
      }

      for (const item of order.items) {
        const variant = await productVariant.findVariantById(item.variant_id);
        if (variant.quantity < item.quantity) {
          await orderService.updateStatus(
            orderId,
            "Đã thanh toán",
            "Hàng tồn kho không đủ",
          );
          return next(new ApiError(400, "Đơn hàng thất bại"));
        }
      }

      await orderService.updateStatus(
        orderId,
        "Đã thanh toán",
        "Đang chờ xác nhận",
      );

      //Cập nhật lại số lượng sản phẩm trong kho
      for (const item of order.items) {
        await productVariant.adjustQuantity(item.variant_id, -item.quantity);
      }

      const exportBillOnline = {
        type: "Phiếu xuất hàng",
        order_id: new ObjectId(orderId),
        employee_id: null,
        total_price: order.total_price,
        reason: `Xuất kho cho đơn hàng thanh toán online thành công: ${orderId}`,
        items: order.items.map((i) => ({
          variant_id: i.variant_id,
          product_name: i.product_name,
          quantity: i.quantity,
          color_name: i.color_name,
          size_name: i.size_name,
        })),
      };
      await warehouseService.createBill(exportBillOnline);

      // Xóa các sản phẩm đã mua ra khỏi giỏ hàng giỏ hàng của User
      const cartService = new CartService(MongoDB.client);
      for (const item of order.items) {
        await cartService.delete(order.user_id, item.variant_id);
      }

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

  const requestId = partnerCode + new Date().getTime();

  const orderIdStr = orderId.toString();

  const amountNumber = Number(amount);
  const orderInfo = "Thanh_toan_don_hang";
  const redirectUrl = process.env.REDIRECTURL_MOMO;
  const ipnUrl = process.env.IPNURL_MOMO;
  const requestType = "captureWallet";
  const extraData = "";

  //Chuỗi băm
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
      const productVariant = new Product_Variant(MongoDB.client);
      const voucherService = new VoucherService(MongoDB.client);
      const warehouseService = new WareHouseService(MongoDB.client);
      //Kiểm tra số lượng sản phẩm có đủ trong kho không
      const order = await orderService.findOrder(orderId);
      if (order.applied_voucher) {
        await voucherService.incrementUsedCount(
          order.applied_voucher,
          order.user_id,
        );
      }
      for (const item of order.items) {
        const variant = await productVariant.findVariantById(item.variant_id);
        if (variant.quantity < item.quantity) {
          await orderService.updateStatus(
            orderId,
            "Đã thanh toán",
            "Hàng tồn kho không đủ",
          );
          return next(new ApiError(400, "Đơn hàng thất bại"));
        }
      }

      // Cập nhật trạng thái
      await orderService.updateStatus(
        orderId,
        "Đã thanh toán",
        "Đang chờ xác nhận",
      );
      // await cartService.updateStatus(req.user._id);

      //Cập nhật lại số lượng sản phẩm trong kho
      for (const item of order.items) {
        await productVariant.adjustQuantity(item.variant_id, -item.quantity);
      }

      const exportBillOnline = {
        type: "Phiếu xuất hàng",
        order_id: new ObjectId(orderId),
        employee_id: null,
        total_price: order.total_price,
        reason: `Xuất kho cho đơn hàng thanh toán online thành công: ${orderId}`,
        items: order.items.map((i) => ({
          variant_id: i.variant_id,
          product_name: i.product_name,
          quantity: i.quantity,
          color_name: i.color_name,
          size_name: i.size_name,
        })),
      };
      await warehouseService.createBill(exportBillOnline);

      // Xóa các sản phẩm đã mua ra khỏi giỏ hàng giỏ hàng của User
      for (const item of order.items) {
        await cartService.delete(order.user_id, item.variant_id);
      }

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
    const activityService = new ActivityService(MongoDB.client);
    const variantService = new Product_Variant(MongoDB.client);
    const order = await orderService.findOrder(id);
    const index_current_order_status = arr_status.findIndex(
      (Element) => Element === order.order_status,
    );
    const index_update_status = arr_status.findIndex(
      (Element) => Element === status,
    );
    if (index_current_order_status < index_update_status) {
      await orderService.updateStatus(id, pay_status, status, employee_id);
      await activityService.createLog(
        "Đơn hàng",
        `${req.user.role} ${req.user.name} vừa chuyển đơn #${id} sang: ${status}`,
      );
    } else {
      return next(
        new ApiError(
          400,
          "Trạng thái cập nhật không phù hợp với trạng thái hiện tại",
        ),
      );
    }

    if (status === "Đã giao") {
      for (const item of order.items) {
        await variantService.incrementSoldCount(item.variant_id, item.quantity);
      }
    }
    return res.send("Cập nhật trạng thái thành công");
  } catch (error) {
    return next(new ApiError(500, "Lỗi Server"));
  }
};

exports.updateStatusCOD = async (req, res, next) => {
  try {
    const arr_status = [
      "Đang chờ xác nhận",
      "Đã xác nhận",
      "Đang giao",
      "Đã giao",
    ];
    const id = req.params.id;
    const { status } = req.body;

    const orderService = new OrderService(MongoDB.client);
    const variantService = new Product_Variant(MongoDB.client);
    const userService = new UserService(MongoDB.client);
    const activityService = new ActivityService(MongoDB.client);
    const order = await orderService.findOrder(id);

    if (!order) return next(new ApiError(404, "Không tìm thấy đơn hàng"));

    const index_current = arr_status.indexOf(
      order.order_status || "Đang chờ xác nhận",
    );
    const index_update = arr_status.indexOf(status);

    if (index_current < index_update) {
      const employee_id = status === "Đã xác nhận" ? req.user._id : null;
      let final_pay_status = order.pay_status;

      if (status === "Đã giao") {
        final_pay_status = "Đã thanh toán";

        for (const item of order.items) {
          await variantService.incrementSoldCount(
            item.variant_id,
            item.quantity,
          );
        }

        const completedOrders = await orderService.getCompletedOrdersByUserId(
          order.user_id,
        );
        const oldTotal = completedOrders.reduce(
          (sum, item) => sum + (item.total_price || 0),
          0,
        );
        const finalTotalSpent = oldTotal + (order.total_price || 0);

        await userService.updateRank(order.user_id, finalTotalSpent);
      }

      await orderService.updateStatus(
        id,
        final_pay_status,
        status,
        employee_id,
      );

      await activityService.createLog(
        "Đơn hàng",
        `${req.user.role} ${req.user.name} vừa xác nhận COD cho đơn #${id}: ${status}`,
      );

      return res.send("Cập nhật trạng thái COD thành công");
    } else {
      return next(new ApiError(400, "Trạng thái không hợp lệ"));
    }
  } catch (error) {
    return next(new ApiError(500, "Lỗi Server rồi Duy ơi"));
  }
};

exports.orderReceiveConfirm = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) return next(new ApiError(400, "Thiếu ID đơn hàng"));

    const orderService = new OrderService(MongoDB.client);
    const variantService = new Product_Variant(MongoDB.client);
    const userService = new UserService(MongoDB.client);

    const order = await orderService.findOrder(id);
    if (!order) return next(new ApiError(404, "Không tìm thấy đơn hàng"));
    if (order.order_status === "Đã giao")
      return res.send("Đơn hàng này đã giao xong");

    await orderService.receiveConfirm(id, "Đã thanh toán", "Đã giao");

    for (const item of order.items) {
      await variantService.incrementSoldCount(item.variant_id, item.quantity);
    }

    const completedOrders = await orderService.getCompletedOrdersByUserId(
      order.user_id,
    );
    const oldTotal = completedOrders.reduce(
      (sum, item) => sum + (item.total_price || 0),
      0,
    );
    const finalTotalSpent = oldTotal + (order.total_price || 0);

    await userService.updateRank(order.user_id, finalTotalSpent);

    return res.send("Xác nhận đã nhận hàng thành công");
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { reason, refund_info } = req.body;

    const orderService = new OrderService(MongoDB.client);
    const variantService = new Product_Variant(MongoDB.client);
    const warehouseService = new WareHouseService(MongoDB.client);

    const order = await orderService.findOrder(id);
    if (!order) return next(new ApiError(404, "Không tìm thấy đơn hàng"));

    //Check quyền (Chỉ user của đơn đó hoặc Staff mới được hủy)
    if (order.user_id.toString() !== req.user._id.toString()) {
      return next(
        new ApiError(403, "Bạn không có quyền thực hiện hành động này"),
      );
    }

    //Check trạng thái đơn
    if (order.order_status !== "Đang chờ xác nhận") {
      return next(new ApiError(400, "Đơn hàng đã được xử lý, không thể hủy"));
    }

    //LOGIC HỦY & TẠO PHIẾU KHO
    const processCancellation = async (finalStatus) => {
      // Cập nhật trạng thái đơn hàng
      await orderService.updateCancelInfo(id, {
        order_status: finalStatus,
        cancel_reason: reason,
        refund_info: refund_info || null,
        cancelled_at: new Date(),
      });

      // Nếu là COD (Hủy ngay) thì mới cộng kho và tạo phiếu điều chỉnh
      if (finalStatus === "Đã hủy") {
        //Cộng lại kho cho từng sản phẩm
        for (const item of order.items) {
          await variantService.adjustQuantity(item.variant_id, item.quantity);
        }

        //TẠO PHIẾU ĐIỀU CHỈNH KHO (Audit Log cho giáo viên xem)
        const warehouseBill = {
          type: "Phiếu điều chỉnh", // Phân loại phiếu
          order_id: order._id, // Lưu ID đơn hàng để truy vết
          reason: `Hoàn kho từ đơn hàng bị hủy: ${id}. Lý do khách: ${reason || "Không có"}`,
          items: order.items.map((i) => ({
            variant_id: i.variant_id,
            product_name: i.product_name,
            quantity: i.quantity, // Số lượng hoàn lại
            color_name: i.color,
            size_name: i.size,
          })),
          employee_id: null, // Vì khách tự hủy nên để null hoặc ID Admin hệ thống
        };
        await warehouseService.createBill(warehouseBill);
      }
    };

    //Phân luồng Thanh toán
    if (order.pay_method !== "cod" && order.pay_status === "Đã thanh toán") {
      await processCancellation("Chờ hoàn tiền");
      return res.send({
        message: "Yêu cầu hủy đã gửi, vui lòng chờ hoàn tiền",
      });
    } else {
      await processCancellation("Đã hủy");
      return res.send({
        message: "Đã hủy đơn hàng và tạo phiếu hoàn kho thành công",
      });
    }
  } catch (error) {
    console.error("Lỗi Cancel Order:", error);
    return next(new ApiError(500, "Lỗi khi xử lý hủy đơn hàng"));
  }
};

exports.confirmRefund = async (req, res, next) => {
  try {
    const order_id = req.params.id;
    if (!order_id) return next(new ApiError(400, "Truyền thiếu id đơn hàng"));

    const orderService = new OrderService(MongoDB.client);
    const order = orderService.findOrder(order_id);
    if (!order)
      return next(
        new ApiError(404, `Không tìm thấy đơn hàng có id là ${order_id}`),
      );

    await orderService.updateStatus(order_id, "Đã hoàn tiền", "Đã hủy");

    return res.json({ message: "Hủy đơn hàng thành công" });
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};
