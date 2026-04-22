const { ObjectId } = require("mongodb");

class Order {
  constructor(client) {
    this.Order = client.db().collection("Orders");
  }

  extractOrderData(payload) {
    const Order = {
      user_id: ObjectId.isValid(payload.user_id) ? payload.user_id : undefined,
      recipient_name: payload.recipient_name,
      address: payload.address,
      phone: payload.phone,
      total_price: payload.total_price,
      sub_total: payload.sub_total,
      applied_voucher: payload.applied_voucher || null,
      discount_amount: payload.discount_amount || 0,
      pay_method: payload.pay_method,
      pay_status: payload.pay_status,
      order_status: payload.order_status,
      items: payload.items,
      created_at: new Date(),
    };

    Object.keys(Order).forEach(
      (key) => Order[key] === undefined && delete Order[key],
    );

    return Order;
  }

  async CreateOrder(payload) {
    const orderData = this.extractOrderData(payload);
    return this.Order.insertOne(orderData);
  }

  async updatePaymentStatus(orderId, status, vnpTransactionNo) {
    return await this.Order.findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          pay_status: status,
          vnp_transaction_no: vnpTransactionNo,
          updated_at: new Date(),
        },
      },
      { returnDocument: "after" },
    );
  }

  async updateStatus(orderId, pay_status, order_status, employee_id = null) {
    const updateData = {
      pay_status: pay_status,
      order_status: order_status,
      updated_at: new Date(),
    };

    if (employee_id) {
      updateData.employee_id = employee_id;
    }

    return await this.Order.findOneAndUpdate(
      { _id: ObjectId.isValid(orderId) ? new ObjectId(orderId) : null },
      { $set: updateData },
      { returnDocument: "after" },
    );
  }

  async receiveConfirm(order_id, pay_status, order_status) {
    return await this.Order.findOneAndUpdate(
      { _id: ObjectId.isValid(order_id) ? new ObjectId(order_id) : null },
      {
        $set: {
          pay_status: pay_status,
          order_status: order_status,
          updated_at: new Date(),
        },
      },
      { returnDocument: "after" },
    );
  }

  async findOrder(order_id) {
    return this.Order.findOne({
      _id: ObjectId.isValid(order_id) ? new ObjectId(order_id) : null,
    });
  }

  // Lấy tất cả đơn hàng
  async getAllOrders() {
    return await this.Order.aggregate([
      //Lọc bỏ các đơn hàng ảo
      {
        $match: {
          pay_status: { $ne: "Chờ thanh toán" },
        },
      },

      //Sắp xếp đơn mới nhất lên đầu
      { $sort: { created_at: -1 } },

      {
        $addFields: {
          employee_id: {
            $cond: {
              if: { $ne: ["$employee_id", null] },
              then: { $toObjectId: "$employee_id" },
              else: null,
            },
          },
        },
      },
      //Kết nối với bảng Employee để lấy tên nhân viên đã xử lý (nếu có)
      {
        $lookup: {
          from: "Employee", // Đảm bảo tên collection này khớp với DB của Duy
          localField: "employee_id",
          foreignField: "_id",
          as: "staff_info",
        },
      },

      //Trải phẳng mảng staff_info và lấy trường tên ra ngoài
      {
        $addFields: {
          handler_name: { $arrayElemAt: ["$staff_info.name", 0] },
        },
      },

      //Loại bỏ mảng staff_info cồng kềnh sau khi đã lấy được tên
      {
        $project: {
          staff_info: 0,
        },
      },
    ]).toArray();
  }

  //Lấy tất cả đơn hàng của user
  async getAllOrdersByUser(user_id) {
    return await this.Order.aggregate([
      { $match: { user_id: user_id } },
      { $sort: { created_at: -1 } },

      //Lookup thông tin Nhân viên xử lý (Dựa trên employee_id trong Order)
      {
        $lookup: {
          from: "Employee",
          localField: "employee_id",
          foreignField: "_id",
          as: "staff_info",
        },
      },

      //Tách mảng items để check Review
      { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },

      //Lookup check Review (Giữ nguyên logic cũ của Duy)
      {
        $lookup: {
          from: "Reviews",
          let: { oid: "$_id", vid: "$items.variant_id", uid: "$user_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$order_id", "$$oid"] },
                    { $eq: ["$variant_id", "$$vid"] },
                    { $eq: ["$user_id", "$$uid"] },
                  ],
                },
              },
            },
          ],
          as: "review_info",
        },
      },

      //Thêm trường is_reviewed
      {
        $addFields: {
          "items.is_reviewed": {
            $cond: {
              if: { $gt: [{ $size: "$review_info" }, 0] },
              then: true,
              else: false,
            },
          },
        },
      },

      // 5. Gom lại và lấy thêm thông tin nhân viên
      {
        $group: {
          _id: "$_id",
          user_id: { $first: "$user_id" },
          recipient_name: { $first: "$recipient_name" },
          address: { $first: "$address" },
          phone: { $first: "$phone" },
          total_price: { $first: "$total_price" },
          sub_total: { $first: "$sub_total" }, // Thêm sub_total
          discount_amount: { $first: "$discount_amount" }, // Thêm discount
          applied_voucher: { $first: "$applied_voucher" },
          pay_status: { $first: "$pay_status" },
          pay_method: { $first: "$pay_method" },
          order_status: { $first: "$order_status" },
          items: { $push: "$items" },
          created_at: { $first: "$created_at" },
          // Lấy tên nhân viên từ mảng staff_info
          handler_name: { $first: { $arrayElemAt: ["$staff_info.name", 0] } },
        },
      },
      { $sort: { created_at: -1 } },
    ]).toArray();
  }
  async getCompletedOrdersByUserId(userId) {
    return await this.Order.find({
      user_id: userId,
      order_status: "Đã giao",
    }).toArray();
  }
  async findOrderLastestByUser(user_id) {
    return this.Order.find({
      user_id: ObjectId.isValid(user_id) ? new ObjectId(user_id) : null,
    })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray();
  }

  async updateCancelInfo(orderId, updateData) {
    return await this.Order.findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: { ...updateData, updated_at: new Date() } },
      { returnDocument: "after" },
    );
  }
  // Thống kê doanh thu & số đơn thành công theo thời gian
  async getRevenueStats(startDate, endDate) {
    const query = {
      order_status: "Đã giao",
      created_at: { $gte: new Date(startDate), $lte: new Date(endDate) },
    };
    return await this.Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total_price" },
          orderCount: { $sum: 1 },
        },
      },
    ]).toArray();
  }

  //Thống kê doanh thu theo từng ngày (Dùng để vẽ biểu đồ đường Doanh thu)
  async getRevenueOverTime(startDate, endDate) {
    return await this.Order.aggregate([
      {
        $match: {
          order_status: "Đã giao",
          created_at: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%d-%m-%Y", date: "$created_at" } },
          revenue: { $sum: "$total_price" },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray();
  }

  // Lấy trạng thái đơn hàng
  async getOrderStatusStats(startDate, endDate) {
    return await this.Order.aggregate([
      {
        $match: {
          created_at: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      {
        $group: {
          _id: "$order_status",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]).toArray();
  }

  async getTopSellingProducts(limit = 5) {
    return await this.Order.aggregate([
      // Duy TẠM THỜI comment dòng match này lại để check xem dữ liệu có lên không nhé
      // { $match: { order_status: "Đã giao" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.variant_id",
          product_name: { $first: "$items.product_name" },
          image: { $first: "$items.image" },
          totalSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
    ]).toArray();
  }
  async getRefundStats(startDate, endDate) {
    return await this.Order.aggregate([
      {
        $match: {
          pay_status: "Đã hoàn tiền",
          created_at: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      {
        $group: {
          _id: null,
          totalRefund: { $sum: "$total_price" },
        },
      },
    ]).toArray();
  }
  async getOrderStatusOverTime(startDate, endDate) {
    return await this.Order.aggregate([
      {
        $match: {
          created_at: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$created_at" },
            },
            status: "$order_status",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]).toArray();
  }
  async getRevenueByCategory(startDate, endDate) {
    return await this.Order.aggregate([
      // 1. Chỉ lấy đơn đã giao trong khoảng thời gian chọn
      {
        $match: {
          order_status: "Đã giao",
          created_at: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      // 2. Trải phẳng sản phẩm trong đơn
      { $unwind: "$items" },
      // 3. Nối với bảng Products
      {
        $lookup: {
          from: "Products",
          localField: "items.product_id",
          foreignField: "_id",
          as: "product_info",
        },
      },
      // Giữ lại đơn kể cả khi ko tìm thấy sản phẩm để tránh mất data
      { $unwind: { path: "$product_info", preserveNullAndEmptyArrays: true } },
      // 4. Nối tiếp với bảng Categories để lấy tên danh mục trực tiếp
      {
        $lookup: {
          from: "Categories",
          localField: "product_info.category_id",
          foreignField: "_id",
          as: "category_info",
        },
      },
      // Quan trọng: Lookup xong rồi mới Unwind nè Duy
      { $unwind: { path: "$category_info", preserveNullAndEmptyArrays: true } },
      // 5. Gom nhóm theo Tên danh mục trực tiếp
      {
        $group: {
          _id: { $ifNull: ["$category_info.category_name", "Danh mục khác"] },
          totalAmount: {
            // Dùng price_at_purchase
            $sum: {
              $multiply: ["$items.quantity", "$items.price_at_purchase"],
            },
          },
          count: { $sum: "$items.quantity" },
        },
      },
      // 6. Sắp xếp theo tiền từ cao xuống thấp
      { $sort: { totalAmount: -1 } },
    ]).toArray();
  }

  //Đếm order mới
  async countNewOrder() {
    return this.Order.countDocuments({ order_status: "Đang chờ xác nhận" });
  }
}

module.exports = Order;
