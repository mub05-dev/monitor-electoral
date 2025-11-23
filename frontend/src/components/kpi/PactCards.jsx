import React from "react";
import { Grid, Paper, Box, Typography } from "@mui/material";

// Función de formateo compacta (M / K)
const formatCompact = (num) => {
  if (!num) return "0";

  if (num >= 1000000) {
    // Ejemplo: 3244272 -> 3.2 M
    return (num / 1000000).toFixed(1) + " M";
  } else if (num >= 1000) {
    // Ejemplo: 682000 -> 682 K
    return (num / 1000).toFixed(0) + " K";
  }

  return num.toString();
};

const PactCards = ({ summaryData, pactColors }) => {

  console.log('summary', summaryData)
  if (!summaryData) return null;

  return (
    <Grid container spacing={2}>
      {summaryData.map((pact) => {
        // Resolver color: busca por ID (ej: "C") o por clave especial (ej: "X" para indep)
        const colorKey =
          pact.id === "others" || pact.id === "indep"
            ? pact.color_key || "default"
            : pact.id;
        const color = pactColors[colorKey] || "#999";

        return (
          <Grid item xs={12} sm={6} md={12} key={pact.id}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                borderLeft: `6px solid ${color}`,
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateX(4px)",
                },
              }}>
              {/* Izquierda: Nombre y Votos */}
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  lineHeight={1.1}>
                  {pact.name}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.75rem", mt: 0.5, display: "block" }}>
                  {/* Aquí aplicamos el formato solicitado */}
                  {formatCompact(pact.votes)} votos
                </Typography>
              </Box>

              {/* Derecha: Escaños */}
              <Box sx={{ textAlign: "right", pl: 2 }}>
                <Typography
                  variant="h5"
                  fontWeight={800}
                  color="text.primary"
                  lineHeight={1}>
                  {pact.seats}
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{ fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Electos
                </Typography>
              </Box>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default PactCards;
