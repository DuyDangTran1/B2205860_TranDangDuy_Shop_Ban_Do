import createAdminApiClient from "./api.service";

class Review {
  constructor(baseUrl = "/api/review") {
    this.privateApi = createAdminApiClient(baseUrl);
  }
  getAllReview = async () => {
    return (await this.privateApi.get(`/admin/all`)).data;
  };

  updateReviewVisibility = async (id, data) => {
    return (await this.privateApi.patch(`/admin/status/${id}`, data)).data;
  };

  getReviewDetail = async (id) => {
    return (await this.privateApi.get(`/detail/${id}`)).data;
  };
}

export default new Review();
