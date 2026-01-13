const { ObjectId } = require("mongodb");

class Size {
  constructor(client) {
    this.Size = client.db().collection("Size");
  }

  extractSizeData(payload) {
    const size = {
      size_name: payload.size_name?.trim(),
    };

    if (size.size_name === undefined) delete size.size_name;

    return size;
  }

  async createSize(payload) {
    const size = this.extractSizeData(payload);
    return await this.Size.findOneAndUpdate(
      { size_name: size.size_name },
      { $set: size },
      { returnDocument: "after", upsert: true }
    );
  }

  async update(id, payload) {
    const size = this.extractSizeData(payload);
    return await this.Size.findOneAndUpdate(
      { _id: ObjectId.isValid(id) ? new ObjectId(id) : null },
      { $set: size },
      { returnDocument: "after" }
    );
  }

  async delete(id) {
    return await this.Size.findOneAndDelete({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
  }

  async getAllSize() {
    return await this.Size.find().toArray();
  }
}

module.exports = Size;
