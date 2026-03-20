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
      pay_status: "chưa thanh toán",
      pay_method: payload.pay_method,
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

  async receiveConfirm(order_id) {
    return this.Order.findOneAndUpdate(
      { _id: ObjectId.isValid(order_id) ? new ObjectId(order_id) : null },
      { $set: { order_status: "Đã giao" } },
    );
  }

  async findOrder(order_id) {
    return this.Order.findOne({
      _id: ObjectId.isValid(order_id) ? new ObjectId(order_id) : null,
    });
  }

  // Lấy tất cả đơn hàng
  async getAllOrders() {
    return this.Order.find().sort({ created_at: -1 }).toArray();
  }

  //Lấy tất cả đơn hàng của user
  async getAllOrdersByUser(user_id) {
    return this.Order.find({ user_id: user_id })
      .sort({ created_at: -1 })
      .toArray();
  }
}

module.exports = Order;
