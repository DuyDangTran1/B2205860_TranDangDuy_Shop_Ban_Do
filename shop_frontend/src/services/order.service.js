import createPublicApiClient from "../services/publicApi.service.js";

class Order {
  constructor(baseURL = "/api/order") {
    this.publicAPI = createPublicApiClient(baseURL);
  }

  async addProduct(data) {
    return (await this.publicAPI.post("/pay", data)).data;
  }

  async resultReturn(data) {
    return (await this.publicAPI.get("/vnpay_return", { params: data })).data;
  }

  async resultReturnMomo(data) {
    return (await this.publicAPI.get("/momo_return", { params: data })).data;
  }

  async getAllOrdersByUser() {
    return (await this.publicAPI.get("/user")).data;
  }

  async receiveConfirm(order_id) {
    return (await this.publicAPI.patch(`/receive_confirm/${order_id}`, {}))
      .data;
  }

  async cancelOrder(order_id, data) {
    return (await this.publicAPI.patch(`/cancel/${order_id}`, data)).data;
  }
}
export default new Order();
