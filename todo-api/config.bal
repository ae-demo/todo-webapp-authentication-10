// Configuration read from environment variables, in one place.
//
// TODO_DB_* names come from design.json's `todo-db` platform-resource wiring —
// never renamed, never given a hardcoded default.

import ballerina/os;

configurable string todoDbHost = os:getEnv("TODO_DB_HOST");
configurable int todoDbPort = check int:fromString(dbPortOrDefault());
configurable string todoDbUser = os:getEnv("TODO_DB_USER");
configurable string todoDbPassword = os:getEnv("TODO_DB_PASSWORD");
configurable string todoDbName = os:getEnv("TODO_DB_DBNAME");

# `TODO_DB_PORT` as the platform injects it, or a sensible default so the
# service starts with no required environment variables.
#
# + return - the raw port string to parse
function dbPortOrDefault() returns string {
    string raw = os:getEnv("TODO_DB_PORT");
    return raw == "" ? "5432" : raw;
}
