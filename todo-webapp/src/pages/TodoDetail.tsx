// wireframes.dsl screen TodoDetail: navbar, heading, a title input, a
// completed checkbox, and a Cancel/Delete/Save row. todo-api has no
// single-item GET, so the row data arrives via navigation state from the
// TodoList row that was clicked; a direct/refreshed URL re-derives it from
// GET /me/todos (the same list operation TodoList itself calls) and 404s if
// the id is not in the caller's own list. Save calls PATCH
// /me/todos/{todoId}; Delete calls DELETE /me/todos/{todoId}.
import { useEffect, useState, type JSX } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  PageContent,
  PageTitle,
  Stack,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { todoApi } from "../api";
import { Can } from "../authz/gates";
import type { components } from "../generated/todo-api";

type Todo = components["schemas"]["Todo"];

export function TodoDetailPage(): JSX.Element {
  const { todoId } = useParams<{ todoId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [todo, setTodo] = useState<Todo | null>((location.state as { todo?: Todo } | null)?.todo ?? null);
  const [title, setTitle] = useState(todo?.title ?? "");
  const [completed, setCompleted] = useState(todo?.completed ?? false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (todo || !todoId) return;
    // No single-item GET in the contract — re-derive from the caller's own
    // list, exactly as TodoList loaded it.
    void (async () => {
      const { data, error: apiError } = await todoApi.GET("/me/todos", {});
      if (apiError) {
        setError("Could not load this todo. Please try again.");
        return;
      }
      const found = (data?.data ?? []).find((t) => t.id === todoId) ?? null;
      if (!found) {
        setNotFound(true);
        return;
      }
      setTodo(found);
      setTitle(found.title);
      setCompleted(found.completed);
    })();
  }, [todo, todoId]);

  async function handleSave(): Promise<void> {
    if (!todoId) return;
    setSaving(true);
    setError(null);
    const { error: apiError } = await todoApi.PATCH("/me/todos/{todoId}", {
      params: { path: { todoId } },
      body: { title: title.trim(), completed },
    });
    setSaving(false);
    if (apiError) {
      setError("Could not save your changes. Please try again.");
      return;
    }
    navigate("/todos");
  }

  async function handleDelete(): Promise<void> {
    if (!todoId) return;
    setDeleting(true);
    setError(null);
    const { error: apiError } = await todoApi.DELETE("/me/todos/{todoId}", {
      params: { path: { todoId } },
    });
    setDeleting(false);
    if (apiError) {
      setError("Could not delete this todo. Please try again.");
      return;
    }
    navigate("/todos");
  }

  if (notFound) {
    return (
      <PageContent>
        <PageTitle>
          <PageTitle.Header>Edit Todo</PageTitle.Header>
        </PageTitle>
        <Alert severity="warning">This todo no longer exists in your list.</Alert>
      </PageContent>
    );
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Edit Todo</PageTitle.Header>
      </PageTitle>

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      {!todo ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : (
        <Stack spacing={3} sx={{ maxWidth: 480 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />
          <FormControlLabel
            control={
              <Checkbox checked={completed} onChange={(e) => setCompleted(e.target.checked)} />
            }
            label="Completed"
          />

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={() => navigate("/todos")}>
              Cancel
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Can op="DELETE /me/todos/{todoId}">
              <Button
                variant="outlined"
                color="error"
                disabled={deleting}
                onClick={() => void handleDelete()}
              >
                Delete
              </Button>
            </Can>
            <Can op="PATCH /me/todos/{todoId}">
              <Button
                variant="contained"
                disabled={saving || title.trim().length === 0}
                onClick={() => void handleSave()}
              >
                Save
              </Button>
            </Can>
          </Stack>
        </Stack>
      )}
    </PageContent>
  );
}
