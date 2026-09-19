// The app chrome every gated screen renders inside — wireframes.dsl's
// `navbar "Todo" "Sign out"`, drawn on both TodoList and TodoDetail. There is
// no `sidebar` line in the DSL (a two-screen app with one entry point), so the
// rail carries the app's one reachable screen; TodoDetail is reached only by
// clicking a row, never from the rail.
import { type JSX } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  AppShell as OxygenAppShell,
  Header,
  Sidebar,
  Footer,
  UserMenu,
  ColorSchemeToggle,
  Divider,
} from "@wso2/oxygen-ui";
import { ListTodo, LogOut } from "@wso2/oxygen-ui-icons-react";
import { APP_NAME } from "../appName";
import { useAuthz } from "../authz/gates";
import { signOut } from "../authz/session";
import { Can } from "../authz/gates";

export function AppShell(): JSX.Element {
  const { pathname } = useLocation();
  const { username } = useAuthz();
  const active = pathname.startsWith("/todos") ? "todo-list" : "";

  return (
    <OxygenAppShell>
      <OxygenAppShell.Navbar>
        <Header>
          <Header.Toggle />
          <Header.Brand>
            <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <ColorSchemeToggle />
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <UserMenu>
              <UserMenu.Trigger name={username || "Signed in"} showName />
              <UserMenu.Header name={username || "Signed in"} email="" />
              <UserMenu.Divider />
              <UserMenu.Logout icon={<LogOut size={16} />} label="Sign out" onClick={signOut} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </OxygenAppShell.Navbar>

      <OxygenAppShell.Sidebar>
        <Sidebar activeItem={active}>
          <Sidebar.Nav>
            <Sidebar.Category>
              <Can op="GET /me/todos">
                <Sidebar.Item id="todo-list" link={<Link to="/todos" />}>
                  <Sidebar.ItemIcon>
                    <ListTodo size={18} />
                  </Sidebar.ItemIcon>
                  <Sidebar.ItemLabel>My Todos</Sidebar.ItemLabel>
                </Sidebar.Item>
              </Can>
            </Sidebar.Category>
          </Sidebar.Nav>
        </Sidebar>
      </OxygenAppShell.Sidebar>

      <OxygenAppShell.Main>
        <Outlet />
      </OxygenAppShell.Main>

      <OxygenAppShell.Footer>
        <Footer>
          <Footer.Copyright>&copy; WSO2 LLC</Footer.Copyright>
        </Footer>
      </OxygenAppShell.Footer>
    </OxygenAppShell>
  );
}
