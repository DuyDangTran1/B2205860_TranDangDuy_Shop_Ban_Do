const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const CategoryService = require("../services/categories.service");

exports.create = async (req, res, next) => {
  const category = {
    category_name: req.body.category_name,
    parent_name: req.body.parent_name ? req.body.parent_name : null,
  };

  if (!category.category_name)
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  try {
    const category_service = new CategoryService(MongoDB.client);
    await category_service.createCategory(category);

    return res.send("Thêm mới thành công");
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Đã có lỗi xảy ra trong quá trình thêm mới"));
  }
};

exports.update = async (req, res, next) => {
  const id = req.params.id;
  const category = {
    category_name: req.body.category_name,
    parent_name: req.body.parent_name,
  };

  if (!id || !category.category_name)
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  try {
    const category_service = new CategoryService(MongoDB.client);
    if (!(await category_service.updateCategory(id, category)))
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần cập nhật"));

    return res.send("Cập nhật thành công");
  } catch (error) {
    return next(new ApiError(500, "Đã có lỗi xảy ra trong quá trình cập nhật"));
  }
};

exports.delete = async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(400, "Lỗi truyền dữ liệu");

  try {
    const category_service = new CategoryService(MongoDB.client);
    if (!(await category_service.deleteCategory(id)))
      return next(new ApiError(404, "Không tìm thấy dữ liệu để xóa"));

    return res.send("Xóa thành công");
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình xóa dữ liệu")
    );
  }
};

exports.getAllCategories = async (req, res, next) => {
  try {
    const category_service = new CategoryService(MongoDB.client);
    const categories = await category_service.getAll();
    return res.json({ categories: categories });
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình lấy dữ liệu")
    );
  }
};
