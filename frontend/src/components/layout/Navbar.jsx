import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Stack,
  Container,
  Box,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../../auth/AuthContext";

export default function Navbar() {
  const { logout, user } = useAuth();

  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ flexGrow: 1 }}>
            <AssessmentIcon sx={{ fontSize: 32, color: "#4caf50" }} />
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.1}>
                Monitor Electoral
              </Typography>
              <Typography
                variant="caption"
                sx={{ opacity: 0.7, letterSpacing: 1 }}>
                ELECCIONES 2025
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <Typography
              variant="body2"
              sx={{ display: { xs: "none", md: "block" } }}>
              Hola, <b>{user?.name}</b>
            </Typography>
            <Button
              color="inherit"
              variant="outlined"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={logout}
              sx={{ borderColor: "rgba(255,255,255,0.3)" }}>
              Salir
            </Button>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
