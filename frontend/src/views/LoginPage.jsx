import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Stack,
  useTheme,
  Fade,
  Divider,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

// Iconos
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

export default function LoginPage() {
  const { authentication, user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await authentication(username, password);
    if (success) {
      navigate("/");
    } else {
      setError(true);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Fondo sobrio y elegante
        background:
          "radial-gradient(circle at 50% 10%, #f0f4f8 0%, #d9e2ec 100%)",
      }}>
      {/* Fuentes formales */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&family=Lato:wght@300;400;700&display=swap');
        `}
      </style>

      <Fade in={true} timeout={1200}>
        <Paper
          elevation={4}
          sx={{
            p: 6,
            maxWidth: 420,
            width: "90%",
            textAlign: "center",
            borderRadius: 1,
            bgcolor: "#ffffff",
            borderTop: `6px solid #102a43`,
          }}>
          {/* FILA 1: ÍCONO */}
          <Box display="flex" justifyContent="center" mb={3}>
            <Box
              p={1.5}
              bgcolor="#102a43"
              borderRadius={2}
              display="flex"
              boxShadow="0 4px 12px rgba(16, 42, 67, 0.2)">
              <HowToVoteIcon sx={{ fontSize: 36, color: "#fff" }} />
            </Box>
          </Box>

          {/* FILA 2: TÍTULO PRINCIPAL */}
          <Typography
            variant="h5"
            sx={{
              fontFamily: "'Merriweather', serif",
              fontWeight: 900,
              color: "#102a43",
              letterSpacing: "-0.5px",
              mb: 1,
            }}>
            Bienvenido a Monitor Electoral
          </Typography>

          {/* FILA 3: DESCRIPCIÓN */}
          <Typography
            variant="body1"
            sx={{
              fontFamily: "'Lato', sans-serif",
              color: "#486581",
              fontSize: "1.05rem",
              lineHeight: 1.5,
              mb: 3,
            }}>
            Resultados elecciones 2025 y <br /> simulación D'Hondt
          </Typography>

          <Divider sx={{ mb: 4, borderColor: "rgba(0,0,0,0.06)" }} />

          {error && (
            <Fade in={!!error}>
              <Alert
                severity="error"
                icon={<VerifiedUserIcon fontSize="inherit" />}
                sx={{
                  mb: 3,
                  borderRadius: 1,
                  fontSize: "0.85rem",
                  fontFamily: "'Lato', sans-serif",
                  alignItems: "center",
                }}>
                {error}
              </Alert>
            </Fade>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Usuario"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                  style: {
                    fontFamily: "'Lato', sans-serif",
                    fontSize: "0.95rem",
                  },
                }}
                InputLabelProps={{
                  style: { fontFamily: "'Lato', sans-serif" },
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
              />

              <TextField
                fullWidth
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small">
                        {showPassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                  style: {
                    fontFamily: "'Lato', sans-serif",
                    fontSize: "0.95rem",
                  },
                }}
                InputLabelProps={{
                  style: { fontFamily: "'Lato', sans-serif" },
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                disableElevation
                sx={{
                  mt: 2,
                  py: 1.5,
                  borderRadius: 1,
                  fontFamily: "'Lato', sans-serif",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  letterSpacing: "0.5px",
                  bgcolor: "#102a43",
                  "&:hover": { bgcolor: "#243b53" },
                }}>
                Ingresar
              </Button>
            </Stack>
          </form>

          <Box mt={5}>
            <Typography
              variant="caption"
              display="block"
              color="#829ab1"
              fontFamily="'Lato', sans-serif">
              © 2025 Monitor Electoral
            </Typography>
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
}
