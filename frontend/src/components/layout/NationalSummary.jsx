import React from "react";
import { Box, Paper, Typography, Grid } from "@mui/material";
import PactCards from "../../components/kpi/PactCards";

const NationalSummary = ({ 
  summaryData, 
  pactColors, 
  children // Aquí viene tu componente <Hemicycle>
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 4 },
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        boxShadow: "0px 4px 24px rgba(0,0,0,0.05)",
        overflow: "hidden" // Evita desbordes extraños
      }}
    >
      {/* 1. TÍTULO: Full Width (Fuera de la Grid) */}
      <Box sx={{ mb: 4, borderBottom: '1px solid #eee', pb: 2 }}>
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontFamily: '"Merriweather", "Playfair Display", serif',
            fontWeight: 800,
            color: "#1a1a1a",
          }}
        >
          Resumen nacional por pacto
        </Typography>
      </Box>

      <Grid container spacing={4} alignItems="center">
        
        {/* COLUMNA IZQUIERDA: Hemiciclo */}
        <Grid item xs={12} md={7} lg={8}>
          <Box
            sx={{
              width: '100%',
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 300,
              // Ajustes para contener tu gráfico si es muy grande:
              '& > div': { 
                  maxWidth: '100%',
                  transform: 'scale(1)', // Ajusta esto si se ve gigante
                  transformOrigin: 'top center'
              }
            }}
          >
            {/* Renderizamos directamente el hijo (Tu Hemicycle) */}
            {/* Eliminé el texto manual de "155 Diputados" para que no se duplique con el tuyo */}
            {children} 
          </Box>
        </Grid>

        {/* COLUMNA DERECHA: Lista de Pactos */}
        <Grid item xs={12} md={5} lg={4}>
          <PactCards summaryData={summaryData} pactColors={pactColors} />
        </Grid>

      </Grid>
    </Paper>
  );
};

export default NationalSummary;