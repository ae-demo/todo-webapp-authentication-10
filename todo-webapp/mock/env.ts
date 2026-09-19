// mockEnv carries exactly the keys the platform emits for this component:
// the `user-auth` dependency's four browser-facing OIDC keys (src/env.ts
// declares no fifth — JWKS is never read in the browser). No sibling API
// address: todo-api is same-origin /api (react-webapp), never a browser key.
export const mockEnv = {
  USER_AUTH_CLIENT_ID: "mock-client",
  USER_AUTH_ISSUER: "https://mock-idp.test",
  USER_AUTH_SCOPES: "openid profile email group ou todos:read todos:write",
  USER_AUTH_RESOURCE: "https://aep.wso2.com/orgs/mock-org/projects/mock-project",
};
