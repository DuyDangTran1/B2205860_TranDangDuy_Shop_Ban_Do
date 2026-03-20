import axios from "axios";

const commonConfig = {
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
};

export default (baseURL) => axios.create({ baseURL, ...commonConfig });
