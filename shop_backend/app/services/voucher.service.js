const { ObjectId } = require("mongodb");

class Voucher {
  constructor(client) {
    this.Voucher = client.db().collection("Vouchers");
  }

  extractVoucherData(payload) {
    return {
      voucher_code: payload.voucher_code.toUpperCase().trim(),
      description: payload.description,
      discount_value: Number(payload.discount_value),
      discount_type: payload.discount_type,
      min_order_value: Number(payload.min_order_value || 0),
      max_discount: Number(payload.max_discount || 0),
      usage_limit: Number(payload.usage_limit),
      is_welcome_voucher:
        payload.is_welcome_voucher === true ||
        payload.is_welcome_voucher === "true",
      used_by_users: [],
      applicable_rank: payload.applicable_rank || "Đồng",
      start_date: new Date(payload.start_date),
      expiry_date: new Date(payload.expiry_date),
      is_active: true,
      created_at: new Date(),
    };
  }

  async createWellComeVoucher(payload) {
    const voucher = {
      voucher_code: payload.voucher_code.toUpperCase(),
      discount_value: payload.discount_value,
      discount_type: payload.discount_type,
      usage_limit: payload.usage_limit || 1,
      is_welcome_voucher: true,
      used_by_users: [],
      used_count: 0,
      owner_id: ObjectId.isValid(payload.owner_id)
        ? new ObjectId(payload.owner_id)
        : null,
      start_date: new Date(),
      expiry_date: new Date(payload.expiry_date),
      is_active: true,
      created_at: new Date(),
    };

    return await this.Voucher.insertOne(voucher);
  }

  async create(payload) {
    const voucher = this.extractVoucherData(payload);
    return await this.Voucher.insertOne(voucher);
  }

  async getAllVouchers(rank, userId) {
    const ranks = ["Đồng", "Bạc", "Vàng", "Kim cương"];
    const userRankLevel = ranks.indexOf(rank || "Đồng");
    const allowedRanks = ranks.slice(0, userRankLevel + 1);

    return await this.Voucher.find({
      applicable_rank: { $in: allowedRanks },
      is_active: true,
      used_by_users: { $nin: [userId.toString()] },

      $expr: { $lt: ["$used_count", "$usage_limit"] },
      expiry_date: { $gt: new Date() },
      start_date: { $lte: new Date() },
    })
      .sort({ created_at: -1 })
      .toArray();
  }
  async findById(id) {
    return await this.Voucher.findOne({ _id: new ObjectId(id) });
  }

  async update(id, payload) {
    const updateData = {
      voucher_code: payload.voucher_code?.toUpperCase().trim(),
      description: payload.description,
      usage_limit: Number(payload.usage_limit),
      expiry_date: new Date(payload.expiry_date),
      is_welcome_voucher: payload.is_welcome_voucher,
      applicable_rank: payload.applicable_rank,
      min_order_value: Number(payload.min_order_value),
      max_discount: Number(payload.max_discount),
      is_active: payload.is_active,
    };

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    return await this.Voucher.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" },
    );
  }

  async changeStatus(id, status) {
    return await this.Voucher.updateOne(
      { _id: new ObjectId(id) },
      { $set: { is_active: status } },
    );
  }

  async checkVoucher(code, orderAmount, userRank, userId) {
    const voucher = await this.Voucher.findOne({
      voucher_code: code.toUpperCase(),
      is_active: true,
    });

    if (!voucher)
      return {
        valid: false,
        message: "Mã giảm giá không tồn tại hoặc đã bị khóa",
      };

    if (voucher.is_welcome_voucher && voucher.used_by_users) {
      if (voucher.used_by_users.includes(userId.toString())) {
        return {
          valid: false,
          message: "Bạn đã sử dụng mã này rồi!",
        };
      }
    }

    const ranks = ["Đồng", "Bạc", "Vàng", "Kim cương"];
    const userRankLevel = ranks.indexOf(userRank);
    const voucherRequiredLevel = ranks.indexOf(voucher.applicable_rank);

    if (userRankLevel < voucherRequiredLevel) {
      return {
        valid: false,
        message: `Mã này chỉ dành cho thành viên hạng ${voucher.applicable_rank} trở lên!`,
      };
    }

    const now = new Date();
    if (now < voucher.start_date || now > voucher.expiry_date) {
      return {
        valid: false,
        message: "Mã giảm giá đã hết hạn hoặc chưa đến ngày sử dụng",
      };
    }

    if (voucher.used_count >= voucher.usage_limit) {
      return { valid: false, message: "Mã giảm giá đã hết lượt sử dụng" };
    }

    if (orderAmount < voucher.min_order_value) {
      return {
        valid: false,
        message: `Đơn hàng chưa đạt giá trị tối thiểu (${voucher.min_order_value}đ)`,
      };
    }

    // Tính số tiền được giảm thực tế
    let discountAmount = 0;
    if (voucher.discount_type === "percent") {
      discountAmount = (orderAmount * voucher.discount_value) / 100;
      if (voucher.max_discount > 0 && discountAmount > voucher.max_discount) {
        discountAmount = voucher.max_discount;
      }
    } else {
      discountAmount = voucher.discount_value;
    }

    return { valid: true, voucher, discountAmount };
  }

  async incrementUsedCount(code, userId) {
    return this.Voucher.updateOne(
      { voucher_code: code.toUpperCase() },
      {
        $inc: { used_count: 1 },
        $push: { used_by_users: userId.toString() },
      },
    );
  }
  async getAllVouchersAdmin() {
    return this.Voucher.find().sort({ _id: -1 }).toArray();
  }
}

module.exports = Voucher;
