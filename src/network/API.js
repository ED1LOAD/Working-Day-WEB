
import Cookies from "universal-cookie";

class API {
  static source = `https://working-day.su:8080/v1`;
  static cookies = new Cookies();

  constructor() {
    if (this instanceof API) {
      throw Error("A static class cannot be instantiated.");
    }
  }

  static formatQuery(source, queries = {}) {
    let res = source;
    let first = true;
    console.log("FORMATQUERY RES: " + res);
    Object.keys(queries).forEach(function (key) {
      if (first) {
        res += "?";
        first = false;
      } else {
        res += "&";
      }
      res += key;
      res += "=";
      res += queries[key];
    });
    console.log(res);
    return res;
  }

  static async xfetch({
    path = "",
    isabsolute = false,
    method = "GET",
    headers = {},
    queries = {},
    body,
    bodyisjson = true,
  }) {
    console.log("XFETCH PATH: " + path);
    console.log("THIS.SOURCE: " + this.source);
    // console.log("SOURCE: " + source);
    console.log("XFETCH BODY: " + body);
    console.log(body);
    return await fetch(
      this.formatQuery(isabsolute ? path : this.source + path, queries),
      {
        method: method,
        headers: {
          Accept: "application/json",
          ...headers,
        },
        body: bodyisjson ? JSON.stringify(body) : body,
      }
    );
    // ).json();
  }

  static async authFetch({
    path = "",
    isabsolute = false,
    method = "GET",
    headers = {},
    queries = {},
    body,
    bodyisjson = true,
  }) {
    console.log("AUTHFETCH PATH");
    console.log(path);
    // console.log();
    return await this.xfetch({
      path: path,
      isabsolute: isabsolute,
      method: method,
      headers: {
        Authorization: "Bearer " + this.cookies.get("auth_token"),
        ...headers,
      },
      queries: queries,
      body: body,
      bodyisjson: bodyisjson,
    });
  }

  static async getEmployees() {
    return await this.authFetch({ path: "/employees" });
  }

  static async addEmployee({ name, surname, patronymic, role, job_position }) {
    return await this.authFetch({
      path: "/employee/add",
      method: "POST",
      body: {
        name: name,
        surname: surname,
        patronymic: patronymic,
        role: role,
        job_position: job_position,
      },
    });
  }

  static async addHeadEmployee({ employee_id, head_id }) {
    return await this.authFetch({
      path: "/employee/add-head",
      method: "POST",
      queries: {
        employee_id: employee_id,
      },
      body: {
        head_id: head_id,
      },
    });
  }

  static async removeEmployee({ employee_id }) {
    return await this.authFetch({
      path: "/employee/remove",
      method: "POST",
      queries: {
        employee_id: employee_id,
      },
    });
  }

  static async infoEmployee(employee_id) {
    return await this.authFetch({
      path: "/employee/info",
      queries: {
        employee_id: employee_id,
      },
    });
  }

  static async uploadPhotoProfile() {
    return await this.authFetch({
      path: "/profile/upload-photo",
      method: "POST",
    });
  }

  static async editProfile({
    phones,
    email,
    birthday,
    password,
    telegram_id,
    vk_id,
    team,
    job_position,
  }) {
    return await this.authFetch({
      path: "/profile/edit",
      method: "POST",
      body: {
        phones: phones,
        email: email,
        birthday: birthday,
        password: password,
        telegram_id: telegram_id,
        vk_id: vk_id,
        team: team,
        job_position: job_position,
      },
    });
  }

  static async authorize({ login, password, company_id }) {
    return await this.xfetch({
      path: "/authorize",
      method: "POST",
      body: {
        login: login,
        password: password,
        company_id: company_id,
      },
    });
  }

  static async login({ login, password, company_id }) {
    let r = await this.xfetch({
      path: "/authorize",
      method: "POST",
      body: {
        login: login,
        password: password,
        company_id: company_id,
      },
    });
    r = await r.json();
    console.log("Login response:", r);

    if (r && r.token) {
      this.cookies.set("login", login, { path: "/" });
      this.cookies.set("auth_token", r.token, { path: "/" });
      this.cookies.set("role", r.role, { path: "/" });
      console.log("Cookies after login:", this.cookies.getAll()); 
      return true;
    }
    return false;
  }

  static logout() {
    this.cookies.remove("login", { path: "/" });
    this.cookies.remove("auth_token", { path: "/" });
    this.cookies.remove("role", { path: "/" });
  }

  static async notifications({ earlier_than }) {
    return await this.authFetch({
      path: "/notifications",
      method: "POST",
      body: {
        earlier_than: earlier_than,
      },
    });
  }

  static async actions({ from, to, employee_id }) {
    return await this.authFetch({
      path: "/actions",
      method: "POST",
      body: {
        from: from,
        to: to,
        employee_id: employee_id,
      },
    });
  }

  static async requestAbsence({ start_date, end_date, type }) {
    return await this.authFetch({
      path: "/abscence/request",
      method: "POST",
      body: {
        start_date: start_date,
        end_date: end_date,
        type: type,
      },
    });
  }

  static async verdictAbsence({ action_id, notification_id, approve }) {
    return await this.authFetch({
      path: "/abscence/verdict",
      method: "POST",
      body: {
        action_id: action_id,
        notification_id: notification_id,
        approve: approve,
      },
    });
  }

  static async splitAbsence({ action_id, split_date }) {
    return await this.authFetch({
      path: "/abscence/split",
      method: "POST",
      body: {
        action_id: action_id,
        split_date: split_date,
      },
    });
  }

  static async rescheduleAbsence({ action_id, reschedule_date }) {
    return await this.authFetch({
      path: "/abscence/reschedule",
      method: "POST",
      body: {
        action_id: action_id,
        reschedule_date: reschedule_date,
      },
    });
  }

  static async vacationDocuments({ action_id, request_type }) {
    return await this.authFetch({
      path: "/documents/vacation",
      queries: {
        action_id: action_id,
        request_type: request_type,
      },
    });
  }

  static async addAttendance({ employee_id, start_date, end_date }) {
    return await this.authFetch({
      path: "/attendance/add",
      method: "POST",
      queries: {
        employee_id: employee_id,
      },
      body: {
        start_date: start_date,
        end_date: end_date,
      },
    });
  }

  static async addBulkPayments({ payments }) {
    return await this.authFetch({
      path: "/payments/add-bulk",
      method: "POST",
      body: {
        payments: payments,
      },
    });
  }

  static async payments() {
    return await this.authFetch({
      path: "/payments",
    });
  }

  static async basicSearch({ search_key }) {
    return await this.authFetch({
      path: "/search/basic",
      method: "POST",
      body: {
        search_key: search_key,
      },
    });
  }

  static async listAllAttendance({ from, to }) {
    return await this.authFetch({
      path: "/attendance/list-all",
      method: "POST",
      body: {
        from: from,
        to: to,
      },
    });
  }

  static async uploadDocuments() {
    return await this.authFetch({
      path: "/documents/upload",
      method: "POST",
    });
  }

  static async sendDocuments({
    doc_id,
    doc_name,
    doc_sign_required,
    doc_description,
    employee_ids,
  }) {
    return await this.authFetch({
      path: "/documents/send",
      method: "POST",
      body: {
        document: {
          id: doc_id,
          name: doc_name,
          sign_required: doc_sign_required,
          description: doc_description,
        },
        employee_ids: employee_ids,
      },
    });
  }

  static async listDocuments() {
    return await this.authFetch({
      path: "/documents/list",
    });
  }

  static async downloadDocuments(id) {
    return await this.authFetch({
      path: "/documents/download",
      queries: {
        id: id,
      },
    });
  }

  static async signDocuments(document_id) {
    return await this.authFetch({
      path: "/documents/sign",
      method: "POST",
      queries: {
        document_id: document_id,
      },
    });
  }

  static async listAllDocuments() {
    return this.authFetch({
      path: "/documents/list-all",
    });
  }

  static async getSignsDocuments(document_id) {
    return this.authFetch({
      path: "/documents/get-signs",
      queries: {
        document_id: document_id,
      },
    });
  }

  static async fullSearch({ search_key, limit = 5 }) {
    return await this.authFetch({
      path: "/search/full",
      method: "POST",
      body: {
        search_key: search_key,
        limit: limit,
      },
    });
  }

  static async suggestSearch({ search_key, limit }) {
    return await this.authFetch({
      path: "/search/suggest",
      method: "POST",
      body: {
        search_key: search_key,
        limit: limit,
      },
    });
  }

  static async addInventoryItem({ name, description, employee_id }) {
    return await this.authFetch({
      path: "/inventory/add",
      method: "POST",
      body: {
        item: {
          name: name,
          description: description,
        },
        employee_id: employee_id,
      },
    });
  }

  
}

export default API;
