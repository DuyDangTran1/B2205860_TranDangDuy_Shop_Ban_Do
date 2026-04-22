import createPublicApiClient from "./publicApi.service";

class Review {
  constructor(baseUrl = "/api/review") {
    this.PublicApi = createPublicApiClient(baseUrl);
  }

  createReview = async (data) => (await this.PublicApi.post("/", data)).data;

  getAllReviewByProduct = async (productId) =>
    (await this.PublicApi.get(`/product/${productId}`)).data;
}
export default new Review();
