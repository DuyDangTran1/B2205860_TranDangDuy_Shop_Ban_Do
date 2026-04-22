const { ObjectId } = require("mongodb");

class CollectionProduct {
  constructor(client) {
    this.CollectionProduct = client.db().collection("Collection_product");
  }

  extractCollectionProductData(payload) {
    const Collection_product = {
      product_id: ObjectId.isValid(payload.product_id)
        ? new ObjectId(payload.product_id)
        : null,
      collection_id: ObjectId.isValid(payload.collection_id)
        ? new ObjectId(payload.collection_id)
        : null,
    };

    Object.keys(Collection_product).forEach(
      (key) =>
        Collection_product[key] === undefined && delete Collection_product[key],
    );
    return Collection_product;
  }

  async createCollectionProduct(payload) {
    const collection_product = this.extractCollectionProductData(payload);
    return await this.CollectionProduct.findOneAndUpdate(
      {
        product_id: collection_product.product_id,
        collection_id: collection_product.collection_id,
      },
      { $set: collection_product },
      { returnDocument: "after", upsert: true },
    );
  }

  //chỉ cho set collection_id
  async updateCollectionProduct(product_id, collection_id, payload) {
    const update = this.extractCollectionProductData(payload);
    const filter = {
      product_id: ObjectId.isValid(product_id)
        ? new ObjectId(product_id)
        : null,
      collection_id: ObjectId.isValid(collection_id)
        ? new ObjectId(collection_id)
        : null,
    };
    return await this.CollectionProduct.findOneAndUpdate(
      filter,
      { $set: update },
      { returnDocument: "after" },
    );
  }

  async deleteCollectionProduct(product_id, collection_id) {
    const filter = {
      product_id: ObjectId.isValid(product_id)
        ? new ObjectId(product_id)
        : null,
      collection_id: ObjectId.isValid(collection_id)
        ? new ObjectId(collection_id)
        : null,
    };
    return await this.CollectionProduct.findOneAndDelete(filter);
  }

  async findCollectionProduct(collection_id, product_id) {
    return await this.CollectionProduct.findOne({
      collection_id: ObjectId.isValid(collection_id)
        ? new ObjectId(collection_id)
        : null,
      product_id: ObjectId.isValid(product_id)
        ? new ObjectId(product_id)
        : null,
    });
  }

  async deleteAllCollectionProduct(collection_id) {
    return this.CollectionProduct.deleteMany({
      collection_id: ObjectId.isValid(collection_id)
        ? new ObjectId(collection_id)
        : null,
    });
  }

  async getAllCollectionProductAdmin(collection_id) {
    return await this.CollectionProduct.aggregate([
      {
        $match: {
          collection_id: ObjectId.isValid(collection_id)
            ? new ObjectId(collection_id)
            : null,
        },
      },

      {
        $lookup: {
          from: "Products",
          localField: "product_id",
          foreignField: "_id",
          as: "product_detail",
        },
      },
      { $unwind: "$product_detail" },
      {
        $project: {
          _id: 1,
          collection_id: 1,
          product_id: 1,
          product_id: "$product_detail._id",
          product_name: "$product_detail.product_name",
          product_image: "$product_detail.image_url",
          base_price: "$product_detail.base_price",
        },
      },
    ]).toArray();
  }
  async getAllCollectionProduct(collection_id, page = 1, limit = 8) {
    const skip = (page - 1) * limit;
    const filter = {
      collection_id: ObjectId.isValid(collection_id)
        ? new ObjectId(collection_id)
        : null,
    };

    const [products, totalCount] = await Promise.all([
      this.CollectionProduct.aggregate([
        { $match: filter },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "Products",
            localField: "product_id",
            foreignField: "_id",
            as: "product_detail",
          },
        },
        { $unwind: "$product_detail" },
        {
          $project: {
            _id: 1,
            product_id: "$product_detail._id",
            product_name: "$product_detail.product_name",
            product_image: "$product_detail.image_url",
            base_price: "$product_detail.base_price",
          },
        },
      ]).toArray(),
      this.CollectionProduct.countDocuments(filter),
    ]);

    return {
      products,
      count_page: Math.ceil(totalCount / limit),
      total_count: totalCount,
    };
  }
}

module.exports = CollectionProduct;
