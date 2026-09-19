// One handler per todo-api operation the app calls, shaped from
// ../src/generated/todo-api.ts — the same contract mock/authz/gateway.ts
// reads to decide whether a caller may call the operation at all. This file
// answers only the second question: which rows are the caller's.
//
// State lives in module scope, in the PAGE's own JS context (setupWorker), so
// a create/edit/delete persists across in-app navigation but resets on any
// full page load — a reload, a typed URL, sign-out/sign-in. That is what
// makes a walk repeatable, and it is also why a row created a moment ago can
// vanish mid-scenario if the run reloads.
//
// Seed rows match wireframes.dsl's TodoList table exactly, so the running
// mock reproduces the wireframe the reviewer compares it against.
import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/todo-api";

type Todo = components["schemas"]["Todo"];

let nextId = 4;
let todos: Todo[] = [
  {
    id: "1",
    title: "Buy groceries",
    completed: false,
    createdAt: "2026-09-15T09:00:00Z",
    updatedAt: "2026-09-15T09:00:00Z",
  },
  {
    id: "2",
    title: "Finish report",
    completed: false,
    createdAt: "2026-09-16T09:00:00Z",
    updatedAt: "2026-09-16T09:00:00Z",
  },
  {
    id: "3",
    title: "Call the bank",
    completed: true,
    createdAt: "2026-09-17T09:00:00Z",
    updatedAt: "2026-09-17T09:00:00Z",
  },
];

export const handlers = [
  // All of it is the caller's own — there is no every-row operation in this
  // contract at all, so nothing here filters by identity; the gateway layer
  // already refused a caller with no todos:read.
  http.get("/api/me/todos", () =>
    HttpResponse.json({ count: todos.length, next: null, previous: null, data: todos }),
  ),

  http.post("/api/me/todos", async ({ request }) => {
    const input = (await request.json()) as { title?: string };
    if (!input?.title) {
      return HttpResponse.json(
        { code: 400, message: "title is required" },
        { status: 400 },
      );
    }
    const now = new Date().toISOString();
    const created: Todo = {
      id: String(nextId++),
      title: input.title,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    todos = [...todos, created];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch("/api/me/todos/:todoId", async ({ request, params }) => {
    const idx = todos.findIndex((t) => t.id === params.todoId);
    if (idx === -1) {
      return HttpResponse.json({ code: 404, message: "no such todo" }, { status: 404 });
    }
    const input = (await request.json()) as { title?: string; completed?: boolean };
    const updated: Todo = {
      ...todos[idx],
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.completed !== undefined ? { completed: input.completed } : {}),
      updatedAt: new Date().toISOString(),
    };
    todos = [...todos.slice(0, idx), updated, ...todos.slice(idx + 1)];
    return HttpResponse.json(updated);
  }),

  http.delete("/api/me/todos/:todoId", ({ params }) => {
    const before = todos.length;
    todos = todos.filter((t) => t.id !== params.todoId);
    return before === todos.length
      ? HttpResponse.json({ code: 404, message: "no such todo" }, { status: 404 })
      : new HttpResponse(null, { status: 204 });
  }),
];
