import createAdminApiClient from "./api.service";

class Order {
  constructor(baseUrl = "/api/order") {
    this.privateApi = createAdminApiClient(baseUrl);
  }
  getAllOrders = async () => (await this.privateApi.get("/")).data;
  updateStatusOnline = async (id, data) => {
    return (await this.privateApi.patch(`/updateStatus/${id}`, data)).data;
  };

  updateStatusCOD = async (id, data) => {
    return (await this.privateApi.patch(`/updateStatusCOD/${id}`, data)).data;
  };

  confirmRefund = async (id) => {
    return (await this.privateApi.patch(`/confirm_refund/${id}`, {})).data;
  };
}

export default new Order();
