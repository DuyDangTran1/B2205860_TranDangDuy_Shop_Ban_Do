const { ObjectId, ReturnDocument } = require("mongodb");

class Collection {
  constructor(client) {
    this.Collection = client.db().collection("Collection");
  }

  extractCollectionData(payload) {
    const collection = {
      collection_name: payload.collection_name?.trim(),
    };

    if (
      collection.collection_name === undefined ||
      collection.collection_name === null
    )
      delete collection.collection_name;
    return collection;
  }

  async createCollection(payload) {
    const collection = this.extractCollectionData(payload);

    return await this.Collection.findOneAndUpdate(
      {
        collection_name: collection.collection_name,
      },
      { $set: collection },
      { returnDocument: "after", upsert: true },
    );
  }
  async updateCollection(id, payload) {
    const update = this.extractCollectionData(payload);
    const filter = { _id: ObjectId.isValid(id) ? new ObjectId(id) : null };
    return await this.Collection.findOneAndUpdate(
      filter,
      { $set: update },
      { returnDocument: "after" },
    );
  }
  async deleteCollection(id) {
    return await this.Collection.findOneAndDelete({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
  }

  async getAllCollection() {
    return await this.Collection.find().toArray();
  }
}

module.exports = Collection;
