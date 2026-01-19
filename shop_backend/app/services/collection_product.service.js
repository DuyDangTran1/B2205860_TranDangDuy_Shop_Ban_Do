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
}

module.exports = CollectionProduct;
