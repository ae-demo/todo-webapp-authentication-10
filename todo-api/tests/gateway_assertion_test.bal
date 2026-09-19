// Tests for the gateway's signed-assertion verification, per the `ballerina`
// skill's gateway_assertion testing guidance.
//
// Run with GATEWAY_ASSERTION_CERTIFICATE / _ISSUER / _HEADER exported to a
// throwaway RSA keypair's self-signed certificate before `bal test` — the
// three trio env vars are read once per request by `AssertionInterceptor`, so
// nothing here talks to a real gateway or IdP.
//
// todo-db is not reachable from this sandbox (no TODO_DB_* credentials), so a
// request that clears the interceptor still fails downstream at 500 — see
// `db.bal`'s `requireDbClient()`. That is exactly the signal these tests rely
// on to prove the interceptor accepted a valid caller: 401 means the
// assertion was refused, 500 means it was not.

import ballerina/crypto;
import ballerina/http;
import ballerina/jwt;
import ballerina/test;

const string TEST_ISSUER = "test-gateway";
const string VALID_KEY_PATH = "tests/resources/gateway_test_key.pem";
const string WRONG_KEY_PATH = "tests/resources/wrong_key.pem";
const string ASSERTION_HEADER = "x-jwt-assertion";

final http:Client gatewayTestClient = check new ("http://localhost:9090");

# Mints a gateway-shaped assertion signed with the given private key.
#
# + keyFile - PEM private key to sign with
# + userId - the `sub` the assertion names
# + scopes - the space-separated `scope` claim
# + return - the signed JWT, or an error
function mintAssertion(string keyFile, string userId, string scopes) returns string|error {
    crypto:PrivateKey signingKey = check crypto:decodeRsaPrivateKeyFromKeyFile(keyFile);
    jwt:IssuerConfig issuerConfig = {
        issuer: TEST_ISSUER,
        username: userId,
        expTime: 300,
        customClaims: {"scope": scopes, "username": "tester", "ouHandle": "test-org"},
        signatureConfig: {
            algorithm: jwt:RS256,
            config: signingKey
        }
    };
    return jwt:issue(issuerConfig);
}

@test:Config {}
function testNoAssertionIsUnauthorized() returns error? {
    http:Response res = check gatewayTestClient->get("/me/todos");
    test:assertEquals(res.statusCode, 401);
}

@test:Config {}
function testValidAssertionClearsTheInterceptor() returns error? {
    string assertion = check mintAssertion(VALID_KEY_PATH, "user-1", "todos:read todos:write");
    http:Response res = check gatewayTestClient->get("/me/todos", {[ASSERTION_HEADER]: assertion});
    // A valid assertion is accepted by the interceptor and reaches the
    // handler; todo-db being unreachable here turns that into a 500, never
    // a 401 -- an interceptor bug would show up as a wrong 401 instead.
    test:assertEquals(res.statusCode, 500);
}

@test:Config {}
function testWrongSigningKeyIsUnauthorized() returns error? {
    string assertion = check mintAssertion(WRONG_KEY_PATH, "user-1", "todos:read todos:write");
    http:Response res = check gatewayTestClient->get("/me/todos", {[ASSERTION_HEADER]: assertion});
    test:assertEquals(res.statusCode, 401);
}

@test:Config {}
function testTamperedPayloadIsUnauthorized() returns error? {
    string assertion = check mintAssertion(VALID_KEY_PATH, "user-1", "todos:read todos:write");
    string[] parts = re `\.`.split(assertion);
    test:assertEquals(parts.length(), 3);
    string payloadSegment = parts[1];
    string firstChar = payloadSegment.substring(0, 1);
    string swapped = firstChar == "e" ? "f" : "e";
    string tamperedPayload = swapped + payloadSegment.substring(1);
    string tamperedAssertion = parts[0] + "." + tamperedPayload + "." + parts[2];

    http:Response res = check gatewayTestClient->get("/me/todos", {[ASSERTION_HEADER]: tamperedAssertion});
    test:assertEquals(res.statusCode, 401);
}

@test:Config {}
function testDeleteRequiresAnAssertionToo() returns error? {
    http:Response res = check gatewayTestClient->delete("/me/todos/11111111-1111-1111-1111-111111111111");
    test:assertEquals(res.statusCode, 401);
}
