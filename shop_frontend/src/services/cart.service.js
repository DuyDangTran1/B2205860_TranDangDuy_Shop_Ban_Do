import createPublicApiClient from "../services/publicApi.service.js";

class Cart {
  constructor(baseURL = "/api/cart") {
    this.publicAPI = createPublicApiClient(baseURL);
  }

  async addProduct(data, accessToken) {
    return (
      await this.publicAPI.post("/", data, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    ).data;
  }

  async getCart(accessToken) {
    return (
      await this.publicAPI.get("/", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    ).data;
  }

  async update(data, accessToken) {
    return (
      await this.publicAPI.put("/", data, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    ).data;
  }

  async deleteCart(variant_id, accessToken) {
    return (
      await this.publicAPI.delete(`/delete?variant_id=${variant_id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    ).data;
  }

  async deleteAll(accessToken) {
    return await this.publicAPI.delete("/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).data;
  }
}

export default new Cart();
