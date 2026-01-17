const { ObjectId, ReturnDocument } = require("mongodb");

class ProductService {
  constructor(client) {
    this.Product = client.db().collection("Products");
  }

  extractProductData(payload) {
    const product = {
      product_name: payload.product_name?.trim(),
      category_id: ObjectId.isValid(payload.category_id)
        ? new ObjectId(payload.category_id)
        : null,
      discount: payload.discount,
      base_price: payload.base_price,
      material: payload.material,
      description: payload.description,
      discount_start: payload.discount_start,
      discount_end: payload.discount_end,
      tag: payload.tag,
      image_url: payload.image_url,
    };

    Object.keys(product).forEach(
      (key) => product[key] === undefined && delete product[key]
    );

    return product;
  }

  //Hàm tạo sản phẩm
  async create(product_information) {
    const product = this.extractProductData(product_information);
    const result = await this.Product.findOneAndUpdate(
      { product_name: product.product_name },
      { $set: product },
      {
        returnDocument: "after",
        upsert: true,
      }
    );
    return result;
  }

  // Hàm tìm kiếm sản phẩm theo id
  async findProductById(id) {
    return await this.Product.findOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
  }

  //Hàm tìm kiếm tất cả sản phẩm theo categories
  async findAllByCategory(category_id) {
    return await this.Product.find({ category_id: category_id }).toArray();
  }

  //Hàm cập nhật thông tin sản phẩm
  async update(id, payload) {
    const filter = { _id: ObjectId.isValid(id) ? new ObjectId(id) : null };
    const update = this.extractProductData(payload);
    return await this.Product.findOneAndUpdate(
      filter,
      { $set: update },
      { returnDocument: "after" }
    );
  }

  //Hàm xóa sản phẩm
  async delete(id) {
    return await this.Product.findOneAndDelete({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
  }

  //Hàm lấy chi tiết sản phẩm
  async getProductById(id) {
    return await this.Product.aggregate([
      { $match: { _id: ObjectId.isValid(id) ? new ObjectId(id) : null } },
      {
        $lookup: {
          from: "Product_variant",
          localField: "_id",
          foreignField: "product_id",
          as: "variant",
          pipeline: [
            {
              $lookup: {
                from: "Color",
                localField: "color_id",
                foreignField: "_id",
                as: "color",
              },
            },
            {
              $lookup: {
                from: "Size",
                localField: "size_id",
                foreignField: "_id",
                as: "size",
              },
            },
            { $unwind: { path: "$color", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$size", preserveNullAndEmptyArrays: true } },
          ],
        },
      },
    ]).next();
  }
}

module.exports = ProductService;
