import createPublicApiClient from "../services/publicApi.service.js";

class Order {
  constructor(baseURL = "/api/order") {
    this.publicAPI = createPublicApiClient(baseURL);
  }

  async addProduct(data, accessToken) {
    return (
      await this.publicAPI.post(`/pay`, data, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    ).data;
  }

  async resultReturn(data, accessToken) {
    return (
      await this.publicAPI.get(`/vnpay_return`, {
        params: data,
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    ).data;
  }

  async resultReturnMomo(data, accessToken) {
    return (
      await this.publicAPI.get(`/momo_return`, {
        params: data,
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    ).data;
  }

  async getAllOrdersByUser(accessToken) {
    return (
      await this.publicAPI.get(`/user`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    ).data;
  }

  async receiveConfirm(order_id, accessToken) {
    console.log(accessToken);
    return (
      await this.publicAPI.patch(
        `/receive_confirm/${order_id}`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      )
    ).data;
  }
}

export default new Order();
