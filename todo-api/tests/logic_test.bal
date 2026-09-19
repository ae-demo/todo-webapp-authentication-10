// Unit tests for the pure request/response and validation logic that does not
// need a database or an HTTP round trip: the pieces that decide 404-vs-500
// shape and page-link construction. Ownership scoping itself lives in the SQL
// text in db.bal (`WHERE id = ... AND user_id = ...`) and needs a live
// todo-db to exercise end to end -- not available in this sandbox (no
// TODO_DB_* credentials); see the report for what that leaves unverified.

import ballerina/test;
import ballerina/time;

@test:Config {}
function testIsValidTodoIdAcceptsAWellFormedUuid() {
    test:assertTrue(isValidTodoId("123e4567-e89b-12d3-a456-426614174000"));
}

@test:Config {}
function testIsValidTodoIdRejectsGarbage() {
    test:assertFalse(isValidTodoId("not-a-uuid"));
    test:assertFalse(isValidTodoId(""));
    test:assertFalse(isValidTodoId("123e4567-e89b-12d3-a456"));
    test:assertFalse(isValidTodoId("'; DROP TABLE todos; --"));
}

@test:Config {}
function testPageUriOmitsCompletedWhenNoFilterIsActive() {
    string uri = pageUri(20, 40, ());
    test:assertEquals(uri, "/me/todos?limit=20&offset=40");
}

@test:Config {}
function testPageUriKeepsTheCompletedFilter() {
    string uri = pageUri(20, 0, true);
    test:assertEquals(uri, "/me/todos?limit=20&offset=0&completed=true");
}

@test:Config {}
function testToTodoFormatsTimestampsAsRfc3339() returns error? {
    time:Utc created = check time:utcFromString("2026-01-01T00:00:00.000Z");
    time:Utc updated = check time:utcFromString("2026-01-02T00:00:00.000Z");
    TodoRow row = {id: "abc", userId: "user-1", title: "Buy milk", completed: false, createdAt: created, updatedAt: updated};

    Todo todo = check toTodo(row);

    test:assertEquals(todo.id, "abc");
    test:assertEquals(todo.title, "Buy milk");
    test:assertEquals(todo.completed, false);
    test:assertEquals(todo.createdAt, "2026-01-01T00:00:00Z");
    test:assertEquals(todo.updatedAt, "2026-01-02T00:00:00Z");
}

@test:Config {}
function testFromRowsPreservesOrderAndCount() returns error? {
    time:Utc t = check time:utcFromString("2026-01-01T00:00:00.000Z");
    TodoRow[] rows = [
        {id: "1", userId: "user-1", title: "First", completed: false, createdAt: t, updatedAt: t},
        {id: "2", userId: "user-1", title: "Second", completed: true, createdAt: t, updatedAt: t}
    ];

    Todo[] todos = check fromRows(rows);

    test:assertEquals(todos.length(), 2);
    test:assertEquals(todos[0].id, "1");
    test:assertEquals(todos[1].completed, true);
}

@test:Config {}
function testHasScopeIsAWholeStringMatch() {
    GatewayCaller caller = {userId: "user-1", username: "", scopes: ["todos:read-all"], orgHandle: ""};
    // The prefix trap `string:includes` would fall into: "todos:read" is a
    // substring of "todos:read-all" but is not the same handle.
    test:assertFalse(hasScope(caller, "todos:read"));
    test:assertTrue(hasScope(caller, "todos:read-all"));
}
