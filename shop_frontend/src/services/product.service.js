import createPublicApiClient from "./publicApi.service";

class Product {
  constructor(baseUrl = "/api/products") {
    this.PublicApi = createPublicApiClient(baseUrl);
  }

  getProductBySlug = async (category_slug, query = "created=-1") =>
    (await this.PublicApi(`/${category_slug}?${query}`)).data;

  getDetailProduct = async (id) => (await this.PublicApi(`/detail/${id}`)).data;

  async getAllProduct() {
    return (await this.PublicApi.get("/")).data;
  }
}
export default new Product();
