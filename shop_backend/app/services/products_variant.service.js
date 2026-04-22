const { ObjectId } = require("mongodb");
class ProductVariant {
  constructor(client) {
    this.Product_variant = client.db().collection("Product_variant");
  }

  extractProductVariantData(payload) {
    const product_variant = {
      product_id: ObjectId.isValid(payload.product_id)
        ? new ObjectId(payload.product_id)
        : null,
      size_name: payload.size_name,
      color_name: payload.color_name,
      image_url: payload.image_url,
    };

    Object.keys(product_variant).forEach(
      (key) =>
        product_variant[key] === undefined && delete product_variant[key],
    );

    return product_variant;
  }

  async create(payload) {
    const product_variant = this.extractProductVariantData(payload);
    product_variant.quantity = 0;
    product_variant.sold_count = 0;
    product_variant.created = new Date();
    return await this.Product_variant.insertOne(product_variant);
  }

  async update(id, payload) {
    const update = this.extractProductVariantData(payload);
    const filter = {
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    };
    return await this.Product_variant.findOneAndUpdate(
      filter,
      { $set: update },
      { returnDocument: "after" },
    );
  }

  async delete(id) {
    return await this.Product_variant.findOneAndDelete({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
  }

  async findVariant(id) {
    return await this.Product_variant.findOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
  }

  async findVariantByInformation(product_id, color_name, size_name) {
    return await this.Product_variant.findOne({
      product_id: ObjectId.isValid(product_id)
        ? new ObjectId(product_id)
        : null,
      color_name: color_name,
      size_name: size_name,
    });
  }

  async findVariantById(id) {
    return await this.Product_variant.findOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
  }

  async adjustQuantity(id, quantity) {
    return await this.Product_variant.findOneAndUpdate(
      { _id: ObjectId.isValid(id) ? new ObjectId(id) : null },
      {
        $inc: { quantity: Number(quantity) },
      },
      {
        returnDocument: "after",
      },
    );
  }

  async incrementSoldCount(variantId, quantity) {
    return await this.Product_variant.updateOne(
      { _id: new ObjectId(variantId) },
      { $inc: { sold_count: Number(quantity) } },
    );
  }

  async getVariantsByIds(variantIds) {
    return await this.Product_variant.find({
      _id: { $in: variantIds.map((id) => new ObjectId(id)) },
    }).toArray();
  }

  async getInventoryStats() {
    const stats = await this.Product_variant.aggregate([
      {
        $group: {
          _id: null,
          totalStock: { $sum: "$quantity" },
          lowStockCount: {
            $sum: { $cond: [{ $lt: ["$quantity", 10] }, 1, 0] },
          },
        },
      },
    ]).toArray();
    return stats[0] || { totalStock: 0, lowStockCount: 0 };
  }

  async getAllProductInventory() {
    return await this.Product_variant.aggregate([
      {
        $lookup: {
          from: "Products",
          localField: "product_id",
          foreignField: "_id",
          as: "product_info",
        },
      },
      { $unwind: "$product_info" },
      {
        $project: {
          // Nối chuỗi: Tên SP + Size + Màu
          full_name: {
            $concat: [
              "$product_info.product_name",
              " - Size: ",
              { $ifNull: ["$size_name", "N/A"] },
              " - Màu: ",
              { $ifNull: ["$color_name", "N/A"] },
            ],
          },
          totalQty: "$quantity",
          image: "$image_url",
        },
      },
      { $sort: { totalQty: 1 } }, // Hàng ít xếp lên đầu
    ]).toArray();
  }

  async deleteByProductId(id) {
    return this.Product_variant.deleteMany({
      product_id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
  }
}

module.exports = ProductVariant;
