import createAdminApiClient from "./api.service";

class Employee {
  constructor(baseUrl = "/api/employee") {
    this.privateApi = createAdminApiClient(baseUrl);
  }
  getListEmployee = async () => (await this.privateApi.get("/")).data;

  create = async (data) => (await this.privateApi.post("/", data)).data;

  login = async (data) => (await this.privateApi.post("/login", data)).data;

  updateStatusAccount = async (id) =>
    (await this.privateApi.patch(`/updateStatusAccount/${id}`)).data;
}

export default new Employee();
