import createAdminApiClient from "./api.service";

class Order {
  constructor(baseUrl = "/api/order") {
    this.privateApi = createAdminApiClient(baseUrl);
  }
  getAllOrders = async () => (await this.privateApi.get("/")).data;
  updateStatus = async (id, data) => {
    return (await this.privateApi.patch(`/updateStatus/${id}`, data)).data;
  };
}

export default new Order();
