const ActivityService = require("../services/activity.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

exports.findAll = async (req, res, next) => {
  try {
    const activityService = new ActivityService(MongoDB.client);
    const logs = await activityService.getRecent(8);
    return res.json(logs);
  } catch (error) {
    return next(new ApiError(500, "Lỗi khi lấy lịch sử hoạt động"));
  }
};
