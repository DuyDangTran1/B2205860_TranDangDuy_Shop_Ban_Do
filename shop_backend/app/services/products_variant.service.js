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
      size_id: ObjectId.isValid(payload.size_id)
        ? new ObjectId(payload.size_id)
        : null,
      color_id: ObjectId.isValid(payload.color_id)
        ? new ObjectId(payload.color_id)
        : null,
      quantity: Number(payload.quantity),
      image_url: payload.image_url,
    };

    Object.keys(product_variant).forEach(
      (key) => product_variant[key] === undefined && delete product_variant[key]
    );

    return product_variant;
  }

  async create(payload) {
    const product_variant = this.extractProductVariantData(payload);
    const quantity_product_variant = product_variant.quantity || 0;
    delete product_variant.quantity;

    return await this.Product_variant.findOneAndUpdate(
      {
        product_id: product_variant.product_id,
        color_id: product_variant.color_id,
        size_id: product_variant.size_id,
      },
      { $set: product_variant, $inc: { quantity: quantity_product_variant } },
      { returnDocument: "after", upsert: true }
    );
  }

  async update(payload) {
    const update = this.extractProductVariantData(payload);
    const filter = {
      product_id: update.product_id,
      color_id: update.color_id,
      size_id: update.size_id,
    };
    return await this.Product_variant.findOneAndUpdate(
      filter,
      { $set: update },
      { returnDocument: "after" }
    );
  }

  async delete(product_id, color_id, size_id) {
    return await this.Product_variant.findOneAndDelete({
      product_id: ObjectId.isValid(product_id)
        ? new ObjectId(product_id)
        : null,
      color_id: ObjectId.isValid(color_id) ? new ObjectId(color_id) : null,
      size_id: ObjectId.isValid(size_id) ? new ObjectId(size_id) : null,
    });
  }

  async findVariant(product_id, color_id, size_id) {
    return await this.Product_variant.findOne({
      product_id: ObjectId.isValid(product_id)
        ? new ObjectId(product_id)
        : null,
      color_id: ObjectId.isValid(color_id) ? new ObjectId(color_id) : null,
      size_id: ObjectId.isValid(size_id) ? new ObjectId(size_id) : null,
    });
  }
}

module.exports = ProductVariant;
