const { ObjectId } = require("mongodb");

class User {
  constructor(client) {
    this.User = client.db().collection("User");
  }

  extractUserData(payload) {
    const user = {
      email: payload.email?.trim(),
      phone: payload.phone,
      name: payload.name,
      birthday: payload.birthday,
      address: payload.address,
      terms_and_condition: payload.terms_and_condition,
      password: payload.password,
      url_avatar: payload.url_avatar,
      created: new Date(),
    };

    Object.keys(user).forEach(
      (key) => user[key] === undefined && delete user[key],
    );

    return user;
  }

  async created(payload) {
    const user = this.extractUserData(payload);
    user.chat_mode = "ai";
    ((user.count_violate = 0), (user.block = false), (user.role = "user"));
    return await this.User.insertOne(user);
  }

  async update(user_id, payload) {
    const user = this.extractUserData(payload);
    const filter = {
      _id: ObjectId.isValid(user_id) ? new ObjectId(user_id) : null,
    };
    return await this.User.findOneAndUpdate(
      filter,
      { $set: user },
      { returnDocument: "after" },
    );
  }

  async getAll() {
    return await this.User.find().toArray();
  }

  async find(filter) {
    return await this.User.findOne(filter);
  }

  async updateLastestMessage(email, lastestProduct) {
    return this.User.findOneAndUpdate(
      { email: email },
      { $set: { lastestProduct: lastestProduct } },
    );
  }

  // 1. Hàm dành riêng cho việc Staff nhận tư vấn (Khóa khách hàng)
  async updateStaffChat(userId, staffId) {
    const filter = {
      _id: ObjectId.isValid(userId) ? new ObjectId(userId) : null,
    };
    return await this.User.findOneAndUpdate(
      filter,
      {
        $set: {
          current_staff_id: staffId,
          updated_chat_at: new Date(), // Để biết nhân viên nhận lúc nào
        },
      },
      { returnDocument: "after" },
    );
  }

  async updateChatMode(userId, mode) {
    const filter = {
      _id: ObjectId.isValid(userId) ? new ObjectId(userId) : null,
    };
    return await this.User.findOneAndUpdate(
      filter,
      {
        $set: { chat_mode: mode },
        $unset: {
          current_staff_id: "",
          updated_chat_at: "",
          update_chat_mode: "",
        },
      },
      { returnDocument: "after" },
    );
  }

  async updateStaffChat(userId, staffId) {
    const filter = {
      _id: ObjectId.isValid(userId) ? new ObjectId(userId) : null,
    };
    return await this.User.findOneAndUpdate(
      filter,
      {
        $set: {
          current_staff_id: staffId,
          updated_chat_at: new Date(),
        },
      },
      { returnDocument: "after" },
    );
  }

  async getWaitingUsers() {
    return await this.User.find({
      chat_mode: "staff",
      $or: [
        { current_staff_id: null },
        { current_staff_id: { $exists: false } },
      ],
    })
      .sort({ update_chat_mode: 1 })
      .toArray();
  }
}

module.exports = User;
