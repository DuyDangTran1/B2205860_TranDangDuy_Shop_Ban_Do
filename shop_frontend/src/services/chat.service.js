import createPublicApiClient from "./publicApi.service";

class Chat {
  constructor(BaseURL = "/api/chat") {
    this.API = createPublicApiClient(BaseURL);
  }

  async getHistory(accessToken) {
    // console.log(accessToken);
    return (
      await this.API.get("/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    ).data;
  }

  async chat(data, accessToken) {
    return (
      await this.API.post("/", data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    ).data;
  }
}

export default new Chat();
