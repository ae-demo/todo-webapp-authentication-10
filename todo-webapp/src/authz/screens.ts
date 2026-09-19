/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Adapted from thunder-authentication's screens.example.ts pattern for THIS
// app's two wireframe screens. THIS IS THE ONLY FILE THAT KNOWS ABOUT
// SCREENS — each row names only the API operation the screen LOADS; the gate
// follows automatically from that.
//
// wireframes.dsl draws exactly one flow, "Manage my todos", role User:
// TodoList -> TodoDetail. There is no public screen (the flow carries a role
// line), so every row here is gated.
//
// TodoList loads the caller's list: GET /me/todos.
// TodoDetail has no single-item GET in todo-api's contract — the row data it
// edits arrives via in-app navigation state from the list already loaded — so
// its `loads` names the operation its Save action performs: PATCH
// /me/todos/{todoId}. That is what makes the route guard, the rail (were it
// listed there) and the Save button's enablement agree with one fact, exactly
// as a write-only form's `loads` does.

import { canCall } from "./core";
import { OPERATIONS, isOperationKey, type OperationKey } from "./operations.gen";

export interface ScreenRoute {
  readonly key: string;
  readonly label: string;
  readonly path: string;
  readonly loads: OperationKey | null;
  readonly public?: boolean;
}

export const SCREEN_ROUTES: readonly ScreenRoute[] = [
  { key: "todo-list", label: "My Todos", path: "/todos", loads: "GET /me/todos" },
  {
    key: "todo-detail",
    label: "Edit Todo",
    path: "/todos/:todoId",
    loads: "PATCH /me/todos/{todoId}",
  },
];

// FAIL LOUDLY at module load — see thunder-authentication's screens.example.ts
// for why this cannot be softened to a warning.
for (const screen of SCREEN_ROUTES) {
  if (screen.loads !== null && !isOperationKey(screen.loads)) {
    throw new Error(
      `src/authz/screens.ts: screen "${screen.label}" loads "${screen.loads}", which ` +
        `no contract declares. Re-run \`npm run gen\`, or name the operation the ` +
        `way openapi.yaml spells it.`,
    );
  }
}

export function reachableScreens(
  scopes: ReadonlySet<string>,
  signedIn: boolean,
): readonly ScreenRoute[] {
  return SCREEN_ROUTES.filter((screen) => {
    if (screen.public) return true;
    if (screen.loads === null) return signedIn;
    return canCall(OPERATIONS[screen.loads], scopes, signedIn);
  });
}

export function hasScopedReach(scopes: ReadonlySet<string>, signedIn: boolean): boolean {
  return reachableScreens(scopes, signedIn).some(
    (screen) => !screen.public && screen.loads !== null,
  );
}
