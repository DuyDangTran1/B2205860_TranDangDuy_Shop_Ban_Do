import createAdminApiClient from "./api.service";

class WareHouse {
  constructor(baseUrl = "/api/warehouse") {
    this.privateApi = createAdminApiClient(baseUrl);
  }

  getAllBill = async () => {
    return (await this.privateApi.get(`/`)).data;
  };

  createBill = async (data) => {
    return (await this.privateApi.post(`/`, data)).data;
  };
}

export default new WareHouse();
