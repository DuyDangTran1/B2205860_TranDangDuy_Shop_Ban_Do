import createPublicApiClient from "./publicApi.service";

class Product {
  constructor(baseUrl = "/api/products") {
    this.PublicApi = createPublicApiClient(baseUrl);
  }

  getProductBySlug = async (category_slug, query = "created=-1") =>
    (await this.PublicApi.get(`/${category_slug}?${query}`)).data;

  getDetailProduct = async (id) => (await this.PublicApi(`/detail/${id}`)).data;

  getAllProduct = async () => (await this.PublicApi.get("/")).data;

  getProductNew = async () => (await this.PublicApi.get("/new")).data;

  getProductRecommend = async () =>
    (await this.PublicApi.get("/recommend")).data;
}
export default new Product();
