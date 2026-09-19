// wireframes.dsl screen TodoList: navbar, heading, an add-todo row, a divider,
// a compact list of titles, and the full Todo/Status table that navigates to
// TodoDetail per row. Loads GET /me/todos; adding a todo calls POST /me/todos.
import { useCallback, useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListingTable,
  PageContent,
  PageTitle,
  Stack,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { Plus } from "@wso2/oxygen-ui-icons-react";
import { todoApi } from "../api";
import type { components } from "../generated/todo-api";

type Todo = components["schemas"]["Todo"];

export function TodoListPage(): JSX.Element {
  const navigate = useNavigate();
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const { data, error: apiError } = await todoApi.GET("/me/todos", {});
    if (apiError) {
      setError("Could not load your todos. Please try again.");
      return;
    }
    setTodos(data?.data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd(): Promise<void> {
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    setError(null);
    const { error: apiError } = await todoApi.POST("/me/todos", {
      body: { title },
    });
    setAdding(false);
    if (apiError) {
      setError("Could not add that todo. Please try again.");
      return;
    }
    setNewTitle("");
    await load();
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>My Todos</PageTitle.Header>
      </PageTitle>

      <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: "center" }}>
        <Box sx={{ flexGrow: 1 }}>
          <TextField
            fullWidth
            placeholder="Add a new todo…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleAdd();
            }}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          disabled={adding || newTitle.trim().length === 0}
          onClick={() => void handleAdd()}
        >
          Add
        </Button>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      {todos === null ? (
        <Typography color="text.secondary">Loading your todos…</Typography>
      ) : (
        <>
          <List dense sx={{ mb: 3 }}>
            {todos.map((todo) => (
              <ListItem key={todo.id} disableGutters>
                <ListItemText primary={todo.title} />
              </ListItem>
            ))}
          </List>

          <ListingTable.Container>
            <ListingTable>
              <ListingTable.Head>
                <ListingTable.Row>
                  <ListingTable.Cell>Todo</ListingTable.Cell>
                  <ListingTable.Cell>Status</ListingTable.Cell>
                  <ListingTable.Cell />
                </ListingTable.Row>
              </ListingTable.Head>
              <ListingTable.Body>
                {todos.length === 0 ? (
                  <ListingTable.Row>
                    <ListingTable.Cell colSpan={3}>
                      <ListingTable.EmptyState
                        title="No todos yet"
                        description="Add your first todo above."
                      />
                    </ListingTable.Cell>
                  </ListingTable.Row>
                ) : (
                  todos.map((todo) => (
                    <ListingTable.Row
                      key={todo.id}
                      clickable
                      onClick={() => navigate(`/todos/${todo.id}`, { state: { todo } })}
                    >
                      <ListingTable.Cell>{todo.title}</ListingTable.Cell>
                      <ListingTable.Cell>
                        <Chip
                          label={todo.completed ? "Done" : "Open"}
                          color={todo.completed ? "success" : "default"}
                          size="small"
                        />
                      </ListingTable.Cell>
                      <ListingTable.Cell />
                    </ListingTable.Row>
                  ))
                )}
              </ListingTable.Body>
            </ListingTable>
          </ListingTable.Container>
        </>
      )}
    </PageContent>
  );
}
