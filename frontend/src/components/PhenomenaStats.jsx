import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Avatar,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import { getPhenomenaStats } from "../data/api";

// --- SUB-COMPONENTE FILA ---
const CandidateRow = ({ candidate, type }) => {
  const isCortado = type === "cortado";
  const color = isCortado ? "#d32f2f" : "#2e7d32";
  const bgColor = isCortado ? "#fdecea" : "#e8f5e9";

  return (
    <Box
      sx={{
        p: 1.5,
        mb: 1,
        borderRadius: 2,
        bgcolor: "white",
        border: "1px solid",
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "transform 0.2s",
        "&:hover": { transform: "translateX(4px)", borderColor: color },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          src={candidate.photo_url}
          sx={{ width: 48, height: 48, border: `2px solid ${color}` }}
        />
        <Box>
          <Typography variant="subtitle2" fontWeight={700} lineHeight={1.1}>
            {candidate.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {candidate.pact_name} • D{candidate.distrito}
          </Typography>
          <Chip
            label={candidate.display_party}
            size="small"
            sx={{
              height: 20,
              fontSize: "0.65rem",
              mt: 0.5,
              bgcolor: bgColor,
              color: color,
              fontWeight: 700,
            }}
          />
        </Box>
      </Stack>

      <Box textAlign="right">
        <Typography variant="h6" fontWeight={800} color={color} lineHeight={1}>
          {new Intl.NumberFormat("es-CL").format(candidate.votes)}
        </Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          votos
        </Typography>
      </Box>
    </Box>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function PhenomenaStats() {
  const [data, setData] = useState({ arrastrados: [], cortados: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getPhenomenaStats("real", "", 10);
        setData(res.data);
      } catch (err) {
        setError("No se pudieron cargar las estadísticas.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <Box p={5} textAlign="center">
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    // Box contenedor simple, igual que GenderView
    <Box sx={{ mt: 4 }}>
      <Typography
        variant="h5"
        fontWeight={800}
        gutterBottom
        sx={{ mb: 3, color: "#333" }}
      >
        Fenómenos del Sistema D'Hondt
      </Typography>

      {/* GRID CONTAINER MAESTRO
         - spacing={3}: Iguala el margen negativo del componente de arriba.
         - alignItems="stretch": Iguala alturas.
      */}
      <Grid container spacing={3} alignItems="stretch">
        
        {/* COLUMNA 1: IZQUIERDA (50%) */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: "#fff5f5",
              borderRadius: 4,
              height: "100%", // Llena toda la altura de la columna
              border: "1px solid #ffcdd2",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <PersonOffIcon color="error" />
              <Typography variant="h6" fontWeight={700} color="error.main">
                Grandes Perdedores
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" paragraph>
              Candidatos con <b>alta votación</b> que NO fueron electos debido
              al rendimiento de su lista.
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {data.cortados.map((c) => (
              <CandidateRow key={c._id} candidate={c} type="cortado" />
            ))}
          </Paper>
        </Grid>

        {/* COLUMNA 2: DERECHA (50%) */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: "#f0fdf4",
              borderRadius: 4,
              height: "100%", // Llena toda la altura de la columna
              border: "1px solid #c8e6c9",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <HowToVoteIcon color="success" />
              <Typography variant="h6" fontWeight={700} color="success.main">
                Electos con Mínima Votación
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" paragraph>
              Candidatos electos con <b>baja votación</b> gracias al "arrastre"
              de compañeros.
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {data.arrastrados.map((c) => (
              <CandidateRow key={c._id} candidate={c} type="arrastrado" />
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}