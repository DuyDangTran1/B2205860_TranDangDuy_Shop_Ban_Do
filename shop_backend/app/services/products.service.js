const { ObjectId, ReturnDocument } = require("mongodb");
const Size = require("./size.service");
const genai = require("@google/genai");
const { path } = require("../../app");

const ai = new genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
class ProductService {
  constructor(client) {
    this.Product = client.db().collection("Products");
  }

  extractProductData(payload) {
    const product = {
      product_name: payload.product_name?.trim(),
      brand: payload.brand,
      category_id: ObjectId.isValid(payload.category_id)
        ? new ObjectId(payload.category_id)
        : null,
      discount: payload.discount,
      supplier_id: ObjectId.isValid(payload.supplier_id)
        ? new ObjectId(payload.supplier_id)
        : null,
      base_price: payload.base_price,
      description: payload.description,
      discount_start: payload.discount_start,
      discount_end: payload.discount_end,
      tag: payload.tag,
      rating: payload.rating,
      count_sell: payload.count_sell,
      image_url: payload.image_url,
      created: new Date(),
    };

    Object.keys(product).forEach(
      (key) => product[key] === undefined && delete product[key],
    );

    const attribute = {
      material: payload.attribute.material,
      style: payload.attribute.style,
      thickness: payload.attribute.thickness,
      oversize: payload.attribute.oversize,
    };

    Object.keys(attribute).forEach(
      (key) => attribute[key] === undefined && delete attribute[key],
    );
    product.attribute = attribute;

    const bot_knowledge = {
      selling_point: payload.bot_knowledge.selling_point,
      usage: payload.bot_knowledge.usage,
    };
    Object.keys(bot_knowledge).forEach(
      (key) => bot_knowledge[key] === undefined && delete bot_knowledge[key],
    );
    product.bot_knowledge = bot_knowledge;

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
      },
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
  async findAllByCategory(
    category_id,
    page = 1,
    limit = 8,
    created = -1,
    brand,
    base_price,
    price_min = 0,
    price_max,
  ) {
    const skip = (page - 1) * limit;
    const filter = {
      category_id: category_id,
    };

    if (price_min != null || price_max != null) {
      filter.base_price = {};
      if (price_min != null || price_min != undefined)
        filter.base_price.$gte = Number(price_min) * 1000;
      if (price_max != null || price_max != undefined)
        filter.base_price.$lte = Number(price_max) * 1000;
    }

    if (brand) {
      filter.brand = brand;
    }
    // console.log(filter);
    const sortOrder = {
      base_price:
        base_price == 1 || base_price == -1 ? parseInt(base_price) : 1,
      created: created == 1 || created == -1 ? parseInt(created) : -1,
    };
    const [products, count_product, brands] = await Promise.all([
      this.Product.aggregate([
        { $match: filter },
        { $sort: sortOrder },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "Product_variant",
            let: { proId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$product_id", "$$proId"] } } },
              {
                $lookup: {
                  from: "Color",
                  localField: "color_id",
                  foreignField: "_id",
                  as: "colorInfo",
                },
              },
              { $unwind: "$colorInfo" },
              {
                $lookup: {
                  from: "Size",
                  localField: "size_id",
                  foreignField: "_id",
                  as: "sizeInfo",
                },
              },
              { $unwind: "$sizeInfo" },
              {
                $project: {
                  _id: 1,
                  quantity: 1,
                  image_url: 1,
                  color_name: "$colorInfo.color_name",
                  size_name: "$sizeInfo.size_name",
                },
              },
            ],
            as: "variants",
          },
        },
      ]).toArray(),
      this.Product.countDocuments(filter),
      this.Product.aggregate([
        { $match: { category_id: category_id } },
        { $group: { _id: "$brand" } },
        { $sort: { _id: 1 } },
      ]).toArray(),
    ]);

    return { products, count_product, brands };
  }

  //Hàm cập nhật thông tin sản phẩm
  async update(id, payload) {
    const filter = { _id: ObjectId.isValid(id) ? new ObjectId(id) : null };
    const update = this.extractProductData(payload);
    delete update.created;
    return await this.Product.findOneAndUpdate(
      filter,
      { $set: update },
      { returnDocument: "after" },
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

  // Hàm tạo embedding từ dữ liệu sản phẩm
  async createEmbedding(product) {
    try {
      const text = `
Sản phẩm: ${product.product_name}
Thương hiệu: ${product.brand}
Danh mục: ${product.tag?.join(", ") || ""}
Mô tả: ${product.description}
Chất liệu: ${product.attribute?.material || ""}
Phong cách: ${product.attribute?.style || ""}
Điểm nổi bật: ${product.bot_knowledge?.selling_point || ""}
Mục đích sử dụng: ${product.bot_knowledge?.usage || ""}
`.trim();

      const result = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
      });

      // console.log("RAW embedding response:", result);

      // FIX: SDK mới trả về dạng này
      if (result && result.embeddings && result.embeddings.length > 0) {
        return result.embeddings[0].values;
      }

      return null;
    } catch (error) {
      console.error("Embedding error full:", error);
      return null;
    }
  }
  // Hàm cập nhật embedding cho tất cả sản phẩm chưa có embedding
  async updateMissingEmbeddings() {
    try {
      const products = await this.Product.find({
        embedding: { $exists: false },
      }).toArray();
      console.log(products);
      console.log(`Có ${products.length} sản phẩm cần update embedding`);

      for (const product of products) {
        const embedding = await this.createEmbedding(product);

        await this.Product.updateOne(
          { _id: product._id },
          {
            $set: {
              embedding: embedding,
            },
          },
        );

        console.log(`Đã cập nhật: ${product.product_name}`);
      }

      console.log("Update embedding hoàn tất");
    } catch (error) {
      console.error("Lỗi update embedding:", error);
    }
  }

  async searchProductVector(queryVector) {
    try {
      const pipeline = [
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: queryVector,
            numCandidates: 100,
            limit: 3,
          },
        },

        {
          $lookup: {
            from: "Product_variant",
            localField: "_id",
            foreignField: "product_id",
            as: "variants",
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
              {
                $project: {
                  _id: 0,
                  color_name: "$color.color_name",
                  size_name: "$size.size_name",
                  quantity: 1,
                  image_url: 1,
                },
              },
            ],
          },
        },
        {
          $project: {
            _id: 1,
            product_name: 1,
            base_price: 1,
            image_url: 1,
            description: 1,
            tag: 1,
            bot_knowledge: 1,
            variants: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ];
      return await this.Product.aggregate(pipeline).toArray();
    } catch (error) {
      console.error("Lỗi search vector:", error);
      return [];
    }
  }

  async getAllProduct() {
    return this.Product.find()
      .project({
        _id: 1,
        product_name: 1,
        image_url: 1,
      })
      .toArray();
  }
}

module.exports = ProductService;
