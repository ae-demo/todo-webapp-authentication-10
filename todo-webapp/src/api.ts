// The typed client for the sibling todo-api, generated from its committed
// OpenAPI contract (src/generated/todo-api.ts). Same-origin `baseUrl`: nginx
// in this pod reverse-proxies /api to the sibling (react-webapp). This module
// adds NOTHING of its own about authorization — the bearer and the 401 rule
// come from src/authz/client.ts, exactly as that module's own doc comment
// prescribes for a generated openapi-fetch client.
import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./generated/todo-api";
import { authorizationHeader, classifyResponse, ForbiddenError } from "./authz/client";

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const header = await authorizationHeader();
    if (header) request.headers.set("Authorization", header);
    return request;
  },
  async onResponse({ response }) {
    if ((await classifyResponse(response.status)) === "forbidden") {
      throw new ForbiddenError(response.status);
    }
    return response;
  },
};

export const todoApi = createClient<paths>({ baseUrl: "/api" });
todoApi.use(authMiddleware);
