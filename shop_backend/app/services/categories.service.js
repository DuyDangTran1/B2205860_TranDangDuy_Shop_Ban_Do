const { ObjectId, ReturnDocument } = require("mongodb");

class Categories {
  constructor(client) {
    this.Categories = client.db().collection("Categories");
  }

  extractDataCategory(payload) {
    const category = {
      category_name: payload.category_name?.trim(),
      parent_name: payload.parent_name?.trim(),
    };

    Object.keys(category).forEach((key) => {
      category[key] === undefined && delete category[key];
    });

    return category;
  }

  //Hàm tạo 1 thể loại mới
  async createCategory(payload) {
    const category = this.extractDataCategory(payload);
    return await this.Categories.findOneAndUpdate(
      { category_name: category.category_name },
      { $set: category },
      { returnDocument: "after", upsert: true }
    );
  }

  //Hàm cập nhật thông tin của 1 thể loại
  async updateCategory(id, payload) {
    const filter = {
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    };

    const category = this.extractDataCategory(payload);

    return await this.Categories.findOneAndUpdate(
      filter,
      { $set: category },
      { returnDocument: "after" }
    );
  }

  //Hàm xóa thể loại
  async deleteCategory(id) {
    return this.Categories.findOneAndDelete({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
  }

  async getAll() {
    return this.Categories.find().toArray();
  }
}

module.exports = Categories;
