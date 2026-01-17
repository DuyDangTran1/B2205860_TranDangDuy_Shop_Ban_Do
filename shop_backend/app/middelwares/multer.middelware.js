const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ApiError = require("../api-error");

// Tạo một hàm nhận vào tên thư mục (ví dụ: 'products', 'users')
const createUpload = (folderName) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Dùng path.resolve để đảm bảo đường dẫn chuẩn xác từ gốc dự án
      const folderPath = path.resolve(
        __dirname,
        `../../public/uploads/${folderName}`
      );

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      cb(null, folderPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

  return multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
      const fileTypes = /jpeg|jpg|png|webp/;
      const extname = fileTypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      const mimetype = fileTypes.test(file.mimetype);

      if (extname && mimetype) {
        return cb(null, true);
      }
      // Trong Multer, lỗi trả về qua callback đầu tiên
      cb(new ApiError(400, "Chỉ được sử dụng file ảnh (jpg, png, webp)"));
    },
  });
};

//Xóa file
const removeFile = (filePath) => {
  const fullPath = path.resolve(
    __dirname,
    "..",
    "..",
    "public",
    filePath.startsWith("/") ? filePath.substring(1) : filePath
  );

  if (fs.existsSync(fullPath)) {
    fs.unlink(fullPath, (err) => {
      if (err) {
        console.error("Lỗi xóa file:", err);
      } else {
        console.log("Đã xóa file cũ thành công!");
      }
    });
  }
};
module.exports = { createUpload, removeFile };
