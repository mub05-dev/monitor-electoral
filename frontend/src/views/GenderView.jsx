import React, { useEffect, useState } from "react";
import { Grid, Box, CircularProgress, Alert, Typography } from "@mui/material";
import GenderDonut from "../components/GenderDonut";
import DistrictGenderChart from "../components/DistrictGenderChart";

export default function GenderView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:5000/stats/genero");
        const json = await response.json();
        setData(json);
      } catch (e) {
        setError("Error cargando estadísticas");
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading)
    return (
      <Box p={5} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  const { candidatos, electos } = data.nacional;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography
        variant="h5"
        fontWeight={800}
        gutterBottom
        sx={{ mb: 3, color: "#333" }}>
        Análisis de Paridad
      </Typography>

      <Grid container spacing={3} alignItems="stretch">
        {/* FILA 1: DONUTS (Mitad y Mitad) */}
        <Grid item xs={12} md={6} lg={3}>
          <GenderDonut
            title="Total Candidatos"
            men={candidatos.hombres}
            women={candidatos.mujeres}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <GenderDonut
            title="Diputados Electos"
            men={electos.hombres}
            women={electos.mujeres}
          />
        </Grid>

        {/* FILA 2: DISTRITOS (Ancho Completo) */}
        <Grid item xs={12} md={12} lg={6}>
          <DistrictGenderChart distritos={data.distritos} />
        </Grid>
      </Grid>
    </Box>
  );
}
