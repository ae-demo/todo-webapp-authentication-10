// Persistence for the Todo entity, backed by the todo-db Postgres database.
// Every query is scoped to a userId — the caller's assertion `sub` — per the
// api-management / thunder-authentication ownership rule.
//
// The client is built at module init but its failure is NOT fatal: the
// component contract requires this service to start with no required
// environment variables, so an unreachable/unconfigured todo-db must not
// crash the listener — every `/me/todos` call simply answers 500 until it is
// reachable. `check new(...)` at module scope would panic the whole module on
// a refused connection, so the client is held as `postgresql:Client|error`
// and every query goes through `requireDbClient()` first.

import ballerina/log;
import ballerina/sql;
import ballerina/time;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

final postgresql:Client|error todoDbClient = new (
    host = todoDbHost,
    username = todoDbUser,
    password = todoDbPassword,
    database = todoDbName,
    port = todoDbPort
);

final error? todoDbReady = ensureTodosTable();

# A Todo row exactly as stored, before it is projected into the API's `Todo` shape.
#
# + id - todo identifier
# + userId - the owning caller's assertion `sub`
# + title - the task text
# + completed - whether the todo is done
# + createdAt - creation time
# + updatedAt - last update time
public type TodoRow record {|
    string id;
    string userId;
    string title;
    boolean completed;
    time:Utc createdAt;
    time:Utc updatedAt;
|};

# The connected client, or an error when todo-db could not be reached at
# startup — every query function checks this first instead of the module
# failing to initialize.
#
# + return - the client, or an error describing why it is unavailable
function requireDbClient() returns postgresql:Client|error {
    postgresql:Client|error dbClient = todoDbClient;
    if dbClient is error {
        return error("todo-db is not reachable", dbClient);
    }
    return dbClient;
}

# Creates the `todos` table if it does not already exist and todo-db is
# reachable. Runs once at module init; a failure here is logged, never
# panicked — a service that cannot start because its database is not
# provisioned yet cannot be redeployed once the database is.
#
# + return - always `()`; failures are logged, not propagated
function ensureTodosTable() returns error? {
    postgresql:Client|error dbClient = requireDbClient();
    if dbClient is error {
        log:printWarn("todo-db is not reachable at startup; requests will 500 until it is", 'error = dbClient);
        return;
    }
    sql:ParameterizedQuery ddl = `CREATE TABLE IF NOT EXISTS todos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    sql:ExecutionResult|sql:Error ddlResult = dbClient->execute(ddl);
    if ddlResult is sql:Error {
        log:printWarn("failed to ensure the todos table exists", 'error = ddlResult);
        return;
    }
    sql:ParameterizedQuery indexDdl = `CREATE INDEX IF NOT EXISTS todos_user_id_idx ON todos (user_id)`;
    sql:ExecutionResult|sql:Error indexResult = dbClient->execute(indexDdl);
    if indexResult is sql:Error {
        log:printWarn("failed to ensure the todos_user_id_idx index exists", 'error = indexResult);
    }
}

# Whether a path segment is shaped like the UUID the `id` column stores.
# Checked before any query that binds it against the `uuid` column: a
# malformed id cannot match any row, so it is a 404 exactly like a
# well-formed one that belongs to nobody — never a 500 from a failed cast.
#
# + todoId - the path segment to check
# + return - true when it parses as a UUID
public function isValidTodoId(string todoId) returns boolean {
    return re `^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`.isFullMatch(todoId);
}

# Counts the caller's todos, optionally filtered by completion status.
#
# + userId - the caller's assertion `sub`
# + completed - filter by completion status, or `()` for every status
# + return - the total matching rows, or an error
public function countTodos(string userId, boolean? completed) returns int|error {
    postgresql:Client dbClient = check requireDbClient();
    sql:ParameterizedQuery query = `SELECT COUNT(*) FROM todos WHERE user_id = ${userId}`;
    if completed is boolean {
        query = sql:queryConcat(query, ` AND completed = ${completed}`);
    }
    int count = check dbClient->queryRow(query);
    return count;
}

# Lists a page of the caller's todos, optionally filtered by completion status.
#
# + userId - the caller's assertion `sub`
# + completed - filter by completion status, or `()` for every status
# + 'limit - page size
# + offset - page offset
# + return - the matching rows, in creation order, or an error
public function listTodos(string userId, boolean? completed, int 'limit, int offset) returns TodoRow[]|error {
    postgresql:Client dbClient = check requireDbClient();
    sql:ParameterizedQuery query = `SELECT id, user_id as "userId", title, completed,
        created_at as "createdAt", updated_at as "updatedAt" FROM todos WHERE user_id = ${userId}`;
    if completed is boolean {
        query = sql:queryConcat(query, ` AND completed = ${completed}`);
    }
    query = sql:queryConcat(query, ` ORDER BY created_at ASC LIMIT ${'limit} OFFSET ${offset}`);
    stream<TodoRow, sql:Error?> rows = dbClient->query(query);
    TodoRow[] result = [];
    check from TodoRow row in rows
        do {
            result.push(row);
        };
    check rows.close();
    return result;
}

# Fetches one of the caller's todos by id.
#
# + userId - the caller's assertion `sub`
# + todoId - the todo to fetch
# + return - the row, `()` when it does not exist or belongs to another caller, or an error
public function getTodo(string userId, string todoId) returns TodoRow?|error {
    postgresql:Client dbClient = check requireDbClient();
    sql:ParameterizedQuery query = `SELECT id, user_id as "userId", title, completed,
        created_at as "createdAt", updated_at as "updatedAt" FROM todos
        WHERE id = ${todoId}::uuid AND user_id = ${userId}`;
    TodoRow|sql:Error row = dbClient->queryRow(query);
    if row is sql:NoRowsError {
        return ();
    }
    if row is sql:Error {
        return row;
    }
    return row;
}

# Creates a todo owned by the caller.
#
# + userId - the caller's assertion `sub`, stamped as the owner
# + title - the task text
# + return - the created row, or an error
public function createTodo(string userId, string title) returns TodoRow|error {
    postgresql:Client dbClient = check requireDbClient();
    sql:ParameterizedQuery insert = `INSERT INTO todos (user_id, title) VALUES (${userId}, ${title})
        RETURNING id, user_id as "userId", title, completed, created_at as "createdAt", updated_at as "updatedAt"`;
    TodoRow row = check dbClient->queryRow(insert);
    return row;
}

# Updates the title and/or completion status of one of the caller's todos.
#
# + userId - the caller's assertion `sub`
# + todoId - the todo to update
# + title - the new title, or `()` to leave it unchanged
# + completed - the new completion status, or `()` to leave it unchanged
# + return - the updated row, `()` when it does not exist or belongs to another caller, or an error
public function updateTodo(string userId, string todoId, string? title, boolean? completed)
        returns TodoRow?|error {
    postgresql:Client dbClient = check requireDbClient();
    sql:ParameterizedQuery update = `UPDATE todos SET updated_at = now()`;
    if title is string {
        update = sql:queryConcat(update, `, title = ${title}`);
    }
    if completed is boolean {
        update = sql:queryConcat(update, `, completed = ${completed}`);
    }
    update = sql:queryConcat(update, ` WHERE id = ${todoId}::uuid AND user_id = ${userId}
        RETURNING id, user_id as "userId", title, completed, created_at as "createdAt", updated_at as "updatedAt"`);
    TodoRow|sql:Error row = dbClient->queryRow(update);
    if row is sql:NoRowsError {
        return ();
    }
    if row is sql:Error {
        return row;
    }
    return row;
}

# Deletes one of the caller's todos.
#
# + userId - the caller's assertion `sub`
# + todoId - the todo to delete
# + return - `true` when a row was deleted, `false` when it did not exist or belonged
#            to another caller, or an error
public function deleteTodo(string userId, string todoId) returns boolean|error {
    postgresql:Client dbClient = check requireDbClient();
    sql:ParameterizedQuery delete = `DELETE FROM todos WHERE id = ${todoId}::uuid AND user_id = ${userId}`;
    sql:ExecutionResult result = check dbClient->execute(delete);
    int? affected = result.affectedRowCount;
    return affected is int && affected > 0;
}
