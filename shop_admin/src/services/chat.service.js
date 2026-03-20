import createAdminApiClient from "./api.service";
class Chat {
  constructor(baseUrl = "/api/chat") {
    this.privateApi = createAdminApiClient(baseUrl);
  }
  getHistoryForAdmin = async (user_id) => {
    return (await this.privateApi.get(`/history/${user_id}`)).data;
  };
}
export default new Chat();
