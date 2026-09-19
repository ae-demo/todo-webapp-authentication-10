screen TodoList "The signed-in user's full todo list"
  navbar "Todo" "Sign out"
  heading "My Todos"
  row
    input "Add a new todo…"
    right
    button "Add" primary
  divider
  list "Buy groceries | Finish report | Call the bank"
  table "Todo | Status | " -> TodoDetail
    row "Buy groceries | Open | "
    row "Finish report | Open | "
    row "Call the bank | Done | "

screen TodoDetail "Edit a single todo"
  navbar "Todo" "Sign out"
  heading "Edit Todo"
  input "Title"
  checkbox "Completed"
  row
    button "Cancel" -> TodoList
    right
    button "Delete" danger
    button "Save" primary -> TodoList

flow "Manage my todos"
  role "User"
  description "A signed-in user views, adds, edits, completes and deletes their own todos"
  TodoList
  TodoDetail
