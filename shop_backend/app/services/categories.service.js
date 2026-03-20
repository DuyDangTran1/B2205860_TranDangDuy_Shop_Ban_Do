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
      { returnDocument: "after", upsert: true },
    );
  }

  //hàm chuyển chữ tiếng viết về không dấu
  toSlug(str) {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/([^0-9a-z-\s])/g, "")
      .replace(/(\s+)/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
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
      { returnDocument: "after" },
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

  async findCategoryBySlug(slug) {
    return await this.Categories.findOne({ slug: slug });
  }

  async getRootAncestor(slug) {
    const result = await this.Categories.aggregate([
      { $match: { slug: slug } },

      {
        $graphLookup: {
          from: "Categories",
          startWith: "$parent_name",
          connectFromField: "parent_name",
          connectToField: "category_name",
          as: "familyTree",
        },
      },

      {
        $project: {
          root_name: {
            $filter: {
              input: "$familyTree",
              as: "item",
              cond: {
                $or: [
                  { $eq: ["$$item.parent_name", null] },
                  { $eq: ["$$item.parent_name", ""] },
                ],
              },
            },
          },
        },
      },
    ]).next();

    if (!result || result.root_name.length === 0) {
      const self = await this.Categories.findOne({
        slug: slug,
      });
      return self?.parent_name ? null : currentCategoryName;
    }

    return result.root_name[0].category_name;
  }

  async getCategoryTree(category_name) {
    return this.Categories.aggregate([
      {
        $match: { category_name: category_name },
      },
      {
        $graphLookup: {
          from: "Categories",
          startWith: "$category_name",
          connectFromField: "category_name",
          connectToField: "parent_name",
          as: "Tree",
        },
      },
    ]).toArray();
  }
}

module.exports = Categories;
