import createAdminApiClient from "./api.service";

class Statistical {
  constructor(baseUrl = "/api/statistical") {
    this.Api = createAdminApiClient(baseUrl);
  }

  getDashboardStats = async (queryData) => {
    return (await this.Api.get("/", { params: queryData })).data;
  };
  getInventoryStats = async (keyword = "") => {
    return (await this.Api.get("/getInventoryStats", { params: { keyword } }))
      .data;
  };
  getInventoryWarehouseStats = async (queryData) => {
    return (await this.Api.get("/getInventoryWarehouseStats")).data;
  };
}

export default new Statistical();
