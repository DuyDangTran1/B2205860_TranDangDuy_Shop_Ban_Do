import createPublicApiClient from "./publicApi.service";

class Chat {
  constructor(BaseURL = "/api/chat") {
    this.API = createPublicApiClient(BaseURL);
  }

  async getHistory() {
    return (await this.API.get("/")).data;
  }

  async chat(data) {
    return (await this.API.post("/", data)).data;
  }
}

export default new Chat();
