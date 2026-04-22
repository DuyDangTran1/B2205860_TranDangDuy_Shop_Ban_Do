import createPublicApiClient from "../services/publicApi.service.js";

class Cart {
  constructor(baseURL = "/api/cart") {
    this.publicAPI = createPublicApiClient(baseURL);
  }

  async addProduct(data) {
    return (await this.publicAPI.post("/", data)).data;
  }

  async getCart() {
    return (await this.publicAPI.get("/")).data;
  }

  async update(data) {
    return (await this.publicAPI.put("/", data)).data;
  }
  async deleteCart(variant_id) {
    return (await this.publicAPI.delete(`/delete?variant_id=${variant_id}`))
      .data;
  }

  async deleteAll() {
    return (await this.publicAPI.delete("/")).data;
  }
}

export default new Cart();
