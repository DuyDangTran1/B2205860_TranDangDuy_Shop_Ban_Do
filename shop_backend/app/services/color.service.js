const { ObjectId, ReturnDocument } = require("mongodb");

class Color {
  constructor(client) {
    this.Color = client.db().collection("Color");
  }

  extractColorData(payload) {
    const color = {
      color_name: payload.color_name?.trim(),
      hex_code: payload.hex_code?.trim(),
    };

    Object.keys(color).forEach(
      (key) => color[key] === undefined && delete color[key]
    );
    return color;
  }

  async createColor(payload) {
    const color = this.extractColorData(payload);
    return await this.Color.findOneAndUpdate(
      {
        color_name: color.color_name,
      },
      { $set: color },
      { returnDocument: "after", upsert: true }
    );
  }

  async updateColor(id, payload) {
    const filter = {
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    };

    const color = this.extractColorData(payload);

    return await this.Color.findOneAndUpdate(
      filter,
      { $set: color },
      { returnDocument: "after" }
    );
  }

  async deleteColor(id) {
    return await this.Color.findOneAndDelete({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
  }

  async getAll() {
    return await this.Color.find().toArray();
  }
}

module.exports = Color;
