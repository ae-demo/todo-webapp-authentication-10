// AUTO-GENERATED FILE, then wired for the gateway assertion and filled in.
// Base shape from the OpenAPI tool; resource bodies and the interceptor wiring
// are hand-written per the `ballerina` and `api-management` skills.

import ballerina/http;
import ballerina/time;

listener http:Listener ep0 = new (9090);

service http:InterceptableService / on ep0 {

    public function createInterceptors() returns AssertionInterceptor => new;

    # The caller's todos
    #
    # + completed - filter by completion status
    # + return - returns can be any of following types
    # http:Ok (a page of the caller's todos)
    # http:Unauthorized (not signed in)
    resource function get me/todos(http:RequestContext ctx, boolean? completed, int 'limit = 20, int offset = 0)
            returns inline_response_200|ErrorUnauthorized|http:InternalServerError {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return toUnauthorized(caller);
        }
        int pageLimit = 'limit > 100 ? 100 : 'limit;

        int|error total = countTodos(caller.userId, completed);
        if total is error {
            return internalError(total);
        }
        TodoRow[]|error rows = listTodos(caller.userId, completed, pageLimit, offset);
        if rows is error {
            return internalError(rows);
        }

        Todo[]|error data = fromRows(rows);
        if data is error {
            return internalError(data);
        }

        string? next = ();
        if offset + pageLimit < total {
            next = pageUri(pageLimit, offset + pageLimit, completed);
        }
        string? previous = ();
        if offset > 0 {
            int previousOffset = offset - pageLimit;
            previous = pageUri(pageLimit, previousOffset < 0 ? 0 : previousOffset, completed);
        }
        inline_response_200 page = {count: total, next: next, previous: previous, data: data};
        return page;
    }

    # Add a todo to the caller's list
    #
    # + return - returns can be any of following types
    # http:Created (the created todo)
    # http:BadRequest (invalid todo)
    # http:Unauthorized (not signed in)
    resource function post me/todos(http:RequestContext ctx, @http:Payload TodoCreate payload)
            returns Todo|ErrorBadRequest|ErrorUnauthorized|http:InternalServerError {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return toUnauthorized(caller);
        }
        string title = payload.title.trim();
        if title == "" {
            return <ErrorBadRequest>{body: {code: 400, message: "title must not be blank"}};
        }

        TodoRow|error created = createTodo(caller.userId, title);
        if created is error {
            return internalError(created);
        }
        Todo|error todo = toTodo(created);
        if todo is error {
            return internalError(todo);
        }
        return todo;
    }

    # Edit or (un)complete one of the caller's todos
    #
    # + return - returns can be any of following types
    # http:Ok (the updated todo)
    # http:BadRequest (invalid update)
    # http:Unauthorized (not signed in)
    # http:NotFound (no such todo for this caller)
    resource function patch me/todos/[string todoId](http:RequestContext ctx, @http:Payload TodoUpdate payload)
            returns Todo|ErrorBadRequest|ErrorUnauthorized|ErrorNotFound|http:InternalServerError {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return toUnauthorized(caller);
        }
        string? newTitle = payload?.title;
        if newTitle is string && newTitle.trim() == "" {
            return <ErrorBadRequest>{body: {code: 400, message: "title must not be blank"}};
        }
        boolean? newCompleted = payload?.completed;
        if newTitle is () && newCompleted is () {
            return <ErrorBadRequest>{body: {code: 400, message: "nothing to update"}};
        }
        if !isValidTodoId(todoId) {
            return <ErrorNotFound>{body: {code: 404, message: "no such todo"}};
        }

        TodoRow?|error updated = updateTodo(caller.userId, todoId, newTitle, newCompleted);
        if updated is error {
            return internalError(updated);
        }
        if updated is () {
            return <ErrorNotFound>{body: {code: 404, message: "no such todo"}};
        }
        Todo|error todo = toTodo(updated);
        if todo is error {
            return internalError(todo);
        }
        return todo;
    }

    # Delete one of the caller's todos
    #
    # + return - returns can be any of following types
    # http:NoContent (deleted)
    # http:Unauthorized (not signed in)
    # http:NotFound (no such todo for this caller)
    resource function delete me/todos/[string todoId](http:RequestContext ctx)
            returns http:NoContent|ErrorUnauthorized|ErrorNotFound|http:InternalServerError {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return toUnauthorized(caller);
        }
        if !isValidTodoId(todoId) {
            return <ErrorNotFound>{body: {code: 404, message: "no such todo"}};
        }

        boolean|error deleted = deleteTodo(caller.userId, todoId);
        if deleted is error {
            return internalError(deleted);
        }
        if !deleted {
            return <ErrorNotFound>{body: {code: 404, message: "no such todo"}};
        }
        return http:NO_CONTENT;
    }
}

# Projects the gateway's 401 payload onto the contract's `ErrorUnauthorized` shape.
#
# + unauthorized - the 401 `requireGatewayCaller` returned
# + return - the same refusal, shaped for this contract's error body
function toUnauthorized(http:Unauthorized unauthorized) returns ErrorUnauthorized {
    return {body: {code: 401, message: "not signed in"}};
}

# Wraps an unexpected persistence failure as a 500. Never returned for a row
# that simply does not exist or does not belong to the caller — that is a 404,
# resolved before this is reached.
#
# + err - the underlying error
# + return - the mapped response
function internalError(error err) returns http:InternalServerError {
    return <http:InternalServerError>{body: {code: 500, message: "internal error"}};
}

# Projects a stored row into the contract's `Todo` shape.
#
# + row - the stored row
# + return - the API-shaped todo, or an error when a timestamp cannot be formatted
function toTodo(TodoRow row) returns Todo|error {
    string createdAt = time:utcToString(row.createdAt);
    string updatedAt = time:utcToString(row.updatedAt);
    return {id: row.id, title: row.title, completed: row.completed, createdAt: createdAt, updatedAt: updatedAt};
}

# Projects a page of stored rows into the contract's `Todo` shape.
#
# + rows - the stored rows
# + return - the API-shaped todos, or an error when a timestamp cannot be formatted
function fromRows(TodoRow[] rows) returns Todo[]|error {
    Todo[] result = [];
    foreach TodoRow row in rows {
        Todo todo = check toTodo(row);
        result.push(todo);
    }
    return result;
}

# Builds the relative URI of another page of `GET /me/todos`, preserving the
# `completed` filter.
#
# + pageLimit - the page size
# + pageOffset - the page offset
# + completed - the active filter, or `()`
# + return - the relative URI
function pageUri(int pageLimit, int pageOffset, boolean? completed) returns string {
    string uri = string `/me/todos?limit=${pageLimit}&offset=${pageOffset}`;
    if completed is boolean {
        uri = uri + "&completed=" + completed.toString();
    }
    return uri;
}

public type Todo record {
    # todo identifier
    string id;
    # the task text
    string title;
    # whether the todo is done
    boolean completed;
    string createdAt;
    string updatedAt;
};

public type ErrorNotFound record {|
    *http:NotFound;
    Error body;
|};

public type inline_response_200 record {
    # total matching items
    int count;
    # relative URI of the next page
    string? next?;
    # relative URI of the previous page
    string? previous?;
    Todo[] data;
};

public type Error record {
    # HTTP or application error code
    int code;
    # short human-readable label
    string message;
    # detailed explanation
    string description?;
    # URI to documentation
    string moreInfo?;
};

public type ErrorBadRequest record {|
    *http:BadRequest;
    Error body;
|};

public type TodoCreate record {
    # the task text
    string title;
};

public type TodoUpdate record {
    # updated task text
    string title?;
    # updated completion status
    boolean completed?;
};

public type ErrorUnauthorized record {|
    *http:Unauthorized;
    Error body;
|};
