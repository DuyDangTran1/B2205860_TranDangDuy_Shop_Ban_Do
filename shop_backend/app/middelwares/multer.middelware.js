const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ApiError = require("../api-error");

// Tạo một hàm nhận vào tên thư mục
const createUpload = (folderName) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const folderPath = path.resolve(
        __dirname,
        `../../public/uploads/${folderName}`,
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
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const fileTypes = /jpeg|jpg|png|webp|mp4|mov|avi|mkv/;
      const extname = fileTypes.test(
        path.extname(file.originalname).toLowerCase(),
      );

      const isImage = file.mimetype.startsWith("image/");
      const isVideo = file.mimetype.startsWith("video/");

      if (extname && (isImage || isVideo)) {
        return cb(null, true);
      }
      cb(new ApiError(400, "Chỉ chấp nhận ảnh hoặc video phù hợp!"));
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
    filePath.startsWith("/") ? filePath.substring(1) : filePath,
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
