const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const VoucherService = require("../services/voucher.service");

exports.create = async (req, res, next) => {
  if (!req.body.voucher_code || !req.body.discount_value) {
    return next(
      new ApiError(400, "Mã voucher và giá trị giảm không được để trống"),
    );
  }

  try {
    const voucherService = new VoucherService(MongoDB.client);
    const existing = await voucherService.Voucher.findOne({
      voucher_code: req.body.voucher_code.toUpperCase().trim(),
    });

    if (existing) {
      return next(new ApiError(400, "Mã voucher này đã tồn tại trên hệ thống"));
    }

    await voucherService.create(req.body);
    return res.status(201).json({ message: "Tạo voucher thành công" });
  } catch (error) {
    return next(new ApiError(500, "Lỗi khi tạo voucher"));
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const rank = req.user.rank || "Đồng";
    const voucherService = new VoucherService(MongoDB.client);
    const vouchers = await voucherService.getAllVouchers(rank, userId);
    return res.json({ vouchers });
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Lỗi khi lấy danh sách voucher"));
  }
};

exports.update = async (req, res, next) => {
  const { id } = req.params;
  if (!id) return next(new ApiError(400, "Thiếu ID voucher"));

  try {
    const voucherService = new VoucherService(MongoDB.client);
    const result = await voucherService.update(id, req.body);

    if (!result) {
      return next(new ApiError(404, "Không tìm thấy voucher để cập nhật"));
    }
    return res.json({ message: "Cập nhật thành công", voucher: result });
  } catch (error) {
    return next(new ApiError(500, "Lỗi khi cập nhật voucher"));
  }
};

exports.changeStatus = async (req, res, next) => {
  const { id } = req.params;
  try {
    const voucherService = new VoucherService(MongoDB.client);
    const voucher = voucherService.findById(id);
    if (!voucher) {
      return next(new ApiError(404, "Không tìm thấy voucher"));
    }

    await voucherService.changeStatus(id, !voucher.is_active);

    return res.json({ message: "Cập nhật trang thái voucher thành công" });
  } catch (error) {
    return next(new ApiError(500, "Lỗi khi xóa voucher"));
  }
};

exports.check = async (req, res, next) => {
  const userId = req.user._id.toString();
  const { code, amount } = req.query;
  const userRank = req.user.rank || "Đồng";
  if (!code || !amount) {
    return next(
      new ApiError(400, "Thiếu mã voucher hoặc tổng số tiền đơn hàng"),
    );
  }

  try {
    const voucherService = new VoucherService(MongoDB.client);
    const checkResult = await voucherService.checkVoucher(
      code,
      Number(amount),
      userRank,
      userId,
    );

    if (!checkResult.valid) {
      return res.status(400).json(checkResult);
    }

    return res.json({
      success: true,
      discountAmount: checkResult.discountAmount,
      voucher_code: checkResult.voucher.voucher_code,
    });
  } catch (error) {
    return next(new ApiError(500, "Lỗi khi kiểm tra mã voucher"));
  }
};

exports.getAllVouchersAdmin = async (req, res, next) => {
  try {
    const voucherService = new VoucherService(MongoDB.client);
    const vouchers = await voucherService.getAllVouchersAdmin();
    return res.json({ vouchers });
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình lấy dữ liệu"),
    );
  }
};
