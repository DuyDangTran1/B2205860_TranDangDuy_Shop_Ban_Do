import axios from "axios";

export default (baseURL) => {
  // 1. Tạo thực thể axios và gán vào biến instance
  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    withCredentials: true,
  });

  // 2. Sử dụng interceptor trên biến instance đó
  instance.interceptors.request.use(
    (config) => {
      // Lấy token từ sessionStorage
      const token = sessionStorage.getItem("accessToken");

      if (token) {
        // Đính kèm vào header Authorization
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  return instance;
};
