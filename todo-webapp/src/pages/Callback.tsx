// Thunder's OAuth redirect lands here. handleCallback() completes the PKCE
// exchange once, then this page sends the user on to the app root, where
// SignedIn (src/App.tsx) picks the landing screen.
import { useEffect, useState, type JSX } from "react";
import { Navigate } from "react-router-dom";
import { Box, Stack, Typography } from "@wso2/oxygen-ui";
import { handleCallback } from "../authz/session";
import { APP_NAME } from "../appName";

export function CallbackPage(): JSX.Element {
  const [done, setDone] = useState(false);

  useEffect(() => {
    void handleCallback().finally(() => setDone(true));
  }, []);

  if (done) return <Navigate to="/" replace />;

  return (
    <Box sx={{ p: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h5" component="h1">
          {APP_NAME}
        </Typography>
        <Typography>Completing sign-in…</Typography>
      </Stack>
    </Box>
  );
}
