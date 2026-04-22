const { ObjectId } = require("mongodb");
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
      tag: payload.tag || [],
      collection_tags: payload.collection_tags || [],
      image_url: payload.image_url,
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
  async create(product_information, category_name, suggested_outfits) {
    const product = this.extractProductData(product_information);
    product.rating = 0;
    product.created = new Date();
    const embedding = await this.createEmbedding(
      product,
      category_name,
      suggested_outfits,
    );
    product.embedding = embedding;
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

    const now = new Date();
    const [products, count_product, brands] = await Promise.all([
      this.Product.aggregate([
        { $match: filter },
        { $sort: sortOrder },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "Product_variant",
            localField: "_id",
            foreignField: "product_id",
            as: "variants",
          },
        },

        {
          $addFields: {
            is_discounting: {
              $and: [
                { $gt: [now, "$discount_start"] },
                { $lt: [now, "$discount_end"] },
                { $gt: ["$discount", 0] },
              ],
            },
          },
        },

        {
          $project: {
            _id: 1,
            product_name: 1,
            base_price: 1,
            image_url: 1,
            brand: 1,
            rating: 1,
            count_sell: { $sum: "$variants.sold_count" },
            variants: 1,
            discount: {
              $cond: { if: "$is_discounting", then: "$discount", else: 0 },
            },
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
  async update(id, payload, category_name, suggested_outfits) {
    const filter = { _id: ObjectId.isValid(id) ? new ObjectId(id) : null };
    const update = this.extractProductData(payload);
    const embedding = await this.createEmbedding(
      update,
      category_name,
      suggested_outfits,
    );
    update.embedding = embedding;
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
    const now = new Date();
    return await this.Product.aggregate([
      { $match: { _id: ObjectId.isValid(id) ? new ObjectId(id) : null } },
      {
        $addFields: {
          is_discounting: {
            $and: [
              { $gt: [now, "$discount_start"] },
              { $lt: [now, "$discount_end"] },
              { $gt: ["$discount", 0] },
            ],
          },
        },
      },
      {
        $project: {
          embedding: 0,
        },
      },
      {
        $addFields: {
          discount: {
            $cond: { if: "$is_discounting", then: "$discount", else: 0 },
          },
        },
      },
      {
        $lookup: {
          from: "Product_variant",
          localField: "_id",
          foreignField: "product_id",
          as: "variant",
        },
      },
    ]).next();
  }

  //Hàm Lấy 3 sản phẩm mới nhất cho trang chủ
  async getProductNew() {
    return this.Product.find().sort({ created: -1 }).limit(3).toArray();
  }

  // Hàm tạo embedding từ dữ liệu sản phẩm
  async createEmbedding(product, category_name, suggested_outfits) {
    const allTags = [
      ...(product.tag || []),
      ...(product.collection_tags || []),
    ];

    const matchingStyle = suggested_outfits || "Phụ kiện thời trang phù hợp";
    try {
      const text = `
Sản phẩm: ${product.product_name}
Thương hiệu: ${product.brand}
Danh mục/Bộ sưu tập: ${allTags.join(", ")}
Mô tả: ${product.description}
Thể loại: ${category_name}
Chất liệu: ${product.attribute?.material || ""}
Phong cách: ${product.attribute?.style || ""}
Độ dày: ${product.attribute?.thickness}
Thiết kế OverSize: ${product.attribute?.oversize}
Điểm nổi bật: ${product.bot_knowledge?.selling_point || ""}
Mục đích sử dụng: ${product.bot_knowledge?.usage || ""}
Gợi ý phối đồ (Outfit): Sản phẩm này cực kỳ phù hợp khi mặc cùng với ${matchingStyle}.
`.trim();

      const result = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
      });

      if (result && result.embeddings && result.embeddings.length > 0) {
        return result.embeddings[0].values;
      }

      return null;
    } catch (error) {
      console.error("Embedding error full:", error);
      return null;
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
                $project: {
                  _id: 0,
                  color_name: 1,
                  size_name: 1,
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
    const now = new Date();
    return this.Product.aggregate([
      {
        $addFields: {
          is_discounting: {
            $and: [
              { $gt: [now, "$discount_start"] },
              { $lt: [now, "$discount_end"] },
              { $gt: ["$discount", 0] },
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          product_name: 1,
          base_price: 1,
          image_url: 1,
          category_id: 1,
          discount: {
            $cond: { if: "$is_discounting", then: "$discount", else: 0 },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]).toArray();
  }

  async syncCollectionTag(
    productId,
    collectionName,
    category_name,
    suggested_outfits,
    action = "add",
  ) {
    const product = await this.findProductById(productId);
    if (!product) return null;

    if (!Array.isArray(product.collection_tags)) product.collection_tags = [];

    if (action === "add") {
      if (!product.collection_tags.includes(collectionName)) {
        product.collection_tags.push(collectionName);
      }
    } else if (action === "remove") {
      product.collection_tags = product.collection_tags.filter(
        (t) => t !== collectionName,
      );
    }

    const embedding = await this.createEmbedding(
      product,
      category_name,
      suggested_outfits,
    );

    return await this.Product.findOneAndUpdate(
      { _id: product._id },
      {
        $set: {
          collection_tags: product.collection_tags,
          embedding: embedding,
        },
      },
      { returnDocument: "after" },
    );
  }

  async updateDiscount(id, discountData) {
    const filter = {
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    };

    const update = {
      discount: Number(discountData.discount || 0),
      discount_start: discountData.discount_start
        ? new Date(discountData.discount_start)
        : null,
      discount_end: discountData.discount_end
        ? new Date(discountData.discount_end)
        : null,
    };

    if (!filter._id) return null;

    return await this.Product.findOneAndUpdate(
      filter,
      { $set: update },
      { returnDocument: "after" },
    );
  }
  async updateRating(productId, avgRating, totalReviews) {
    return await this.Product.updateOne(
      { _id: new ObjectId(productId) },
      {
        $set: {
          rating: parseFloat(avgRating.toFixed(1)),
          review_count: totalReviews,
        },
      },
    );
  }

  async getOutfitSuggestions(currentProduct) {
    if (!currentProduct || !currentProduct.embedding) return [];

    const pipeline = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: currentProduct.embedding,
          numCandidates: 100,
          limit: 10,
        },
      },
      {
        $match: {
          _id: { $ne: currentProduct._id },
          category_id: { $ne: currentProduct.category_id }, // không lấy cùng loại
        },
      },
      {
        $lookup: {
          from: "Product_variant",
          localField: "_id",
          foreignField: "product_id",
          as: "variants_data",
        },
      },

      {
        $addFields: {
          count_sell: { $sum: "$variants_data.sold_count" },
        },
      },
      { $limit: 4 },
      {
        $project: {
          embedding: 0,
          variants_data: 0,
        },
      },
    ];

    return await this.Product.aggregate(pipeline).toArray();
  }
  async getRecommendationsFromProductList(productIds) {
    try {
      const boughtIds = productIds.map((id) => id.toString());

      const boughtProducts = await this.Product.find({
        _id: { $in: productIds.map((id) => new ObjectId(id)) },
      }).toArray();

      const suggestionPromises = boughtProducts.map((product) =>
        this.getOutfitSuggestions(product),
      );
      const resultsArray = await Promise.all(suggestionPromises);

      // 3. Gom mảng, lọc trùng và loại bỏ đồ đã mua
      const allSuggestions = resultsArray.flat();

      return allSuggestions
        .filter(
          (item, index, self) =>
            index ===
              self.findIndex((t) => t._id.toString() === item._id.toString()) &&
            !boughtIds.includes(item._id.toString()),
        )
        .slice(0, 6);
    } catch (error) {
      console.error("Lỗi gợi ý danh sách:", error);
      return [];
    }
  }

  // đếm số sản phẩm
  async countProduct() {
    return this.Product.countDocuments();
  }
}

module.exports = ProductService;
