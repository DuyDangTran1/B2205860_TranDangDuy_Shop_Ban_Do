const { ObjectId, ReturnDocument } = require("mongodb");

class Collection {
  constructor(client) {
    this.Collection = client.db().collection("Collection");
  }

  extractCollectionData(payload) {
    const collection = {
      collection_name: payload.collection_name?.trim(),
      description: payload.description,
      image_url: payload.image_url,
    };

    Object.keys(collection).forEach(
      (key) => collection[key] === undefined && delete collection[key],
    );
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
    return await this.Collection.find().sort({ _id: -1 }).toArray();
  }

  async findCollection(id) {
    return await this.Collection.findOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
  }
}

module.exports = Collection;
