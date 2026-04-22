const { ObjectId } = require("mongodb");

class User {
  constructor(client) {
    this.User = client.db().collection("User");
  }

  extractUserData(payload) {
    const user = {
      email: payload.email?.trim(),
      phone: payload.phone,
      type_account: payload.type_account,
      name: payload.name,
      birthday: payload.birthday,
      address: payload.address,
      terms_and_condition: payload.terms_and_condition,
      password: payload.password,
      image_url: payload.image_url,
    };

    Object.keys(user).forEach(
      (key) => user[key] === undefined && delete user[key],
    );

    return user;
  }

  async created(payload) {
    const user = this.extractUserData(payload);
    user.created = new Date();
    user.chat_mode = "ai";
    user.rank = "Đồng";
    user.count_violate = 0;
    user.block = false;
    user.role = "user";
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
    return await this.User.find().sort({ _id: -1 }).toArray();
  }

  async updateStatusAccount(id, status) {
    return await this.User.findOneAndUpdate(
      { _id: ObjectId.isValid(id) ? new ObjectId(id) : null },
      { $set: { block: status } },
      { returnDocument: "after" },
    );
  }

  async find(filter) {
    return await this.User.findOne(filter);
  }

  async findById(id) {
    return await this.User.findOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
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
          current_staff_id: ObjectId.isValid(staffId)
            ? new ObjectId(staffId)
            : null,
          updated_chat_at: new Date(),
        },
      },
      { returnDocument: "after" },
    );
  }

  async updateChatMode(userId, mode) {
    console.log(
      `--- Đang thực hiện updateChatMode cho ID: ${userId} sang Mode: ${mode} ---`,
    );
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

  async getWaitingUsers(staffId) {
    return await this.User.find({
      chat_mode: "staff",
      $or: [
        { current_staff_id: null },
        { current_staff_id: { $exists: false } },
        { current_staff_id: staffId },
      ],
    })
      .sort({ update_chat_mode: 1 })
      .toArray();
  }

  async updateRank(userId, totalSpent) {
    let newRank = "Đồng";

    if (totalSpent >= 20000000) {
      newRank = "Kim cương";
    } else if (totalSpent >= 8000000) {
      newRank = "Vàng";
    } else if (totalSpent >= 3000000) {
      newRank = "Bạc";
    }

    return await this.User.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { rank: newRank } },
      { returnDocument: "after" },
    );
  }
  async countNewUsers(startDate, endDate) {
    return await this.User.countDocuments({
      created_at: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });
  }

  async getTotalUsers() {
    return await this.User.countDocuments({});
  }

  async getNewUsersByDate(startDate, endDate) {
    return await this.User.aggregate([
      {
        $match: {
          created: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%d-%m-%Y", date: "$created" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray();
  }

  //Đếm số lượng user
  async countUser() {
    return this.User.countDocuments();
  }
}

module.exports = User;
