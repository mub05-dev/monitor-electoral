import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import HowToVoteIcon from "@mui/icons-material/HowToVote";

const stats = {
  totalVotos: 13256428,
  totalVotosValidos: 10603315,
  totalBlancos: 948878,
  totalNulos: 1704235,
  padron: 15618167,
};

const StatItem = ({ label, value, isLast }) => (
  <Box
    sx={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      borderRight: isLast ? "none" : "1px solid #e0e0e0",
      height: "60%",
      alignSelf: "center",
    }}
  >
    <Typography
      variant="h4"
      fontWeight="800"
      sx={{ color: "text.primary", lineHeight: 1, mb: 0.5 }}
    >
      {value}
    </Typography>
    <Typography
      variant="caption"
      fontWeight="bold"
      color="text.secondary"
      textTransform="uppercase"
      sx={{ fontSize: "0.7rem", letterSpacing: 1 }}
    >
      {label}
    </Typography>
  </Box>
);

const ParticipationCard = () => {
  const participacion = ((stats.totalVotos / stats.padron) * 100).toFixed(1);

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 4,
        border: "1px solid #e0e0e0",
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "white",
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        width: "100%",
        minHeight: 110,
      }}
    >
      <Box
        sx={{
          flex: { lg: "0 0 30%" },
          p: 3,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          borderRight: { lg: "1px solid #e0e0e0" },
        }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          fontWeight="bold"
          lineHeight={1}
        >
          Elecciones Generales
        </Typography>
        <Typography
          variant="h4"
          fontWeight="800"
          sx={{ color: "#1a1a1a", letterSpacing: -0.5 }}
        >
          Diputados 2025
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Votos Totales: <b>{stats.totalVotos.toLocaleString("es-CL")}</b>
        </Typography>
      </Box>
      <Box
        sx={{
          flex: { lg: "0 0 25%" },
          p: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          borderRight: { lg: "1px solid #e0e0e0" },
          borderTop: { xs: "1px solid #e0e0e0", lg: "none" },
        }}
      >
        <HowToVoteIcon fontSize="large" sx={{ color: "text.primary" }} />
        <Box>
          <Typography
            variant="h4"
            fontWeight="800"
            sx={{ color: "text.primary", lineHeight: 1, mb: 0.5 }}
          >
            {participacion}%
          </Typography>
          <Typography
            variant="caption"
            fontWeight="bold"
            color="text.secondary"
            textTransform="uppercase"
          >
            Participación general
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          width: "100%",
          p: 2,
          borderTop: { xs: "1px solid #e0e0e0", lg: "none" },
        }}
      >
        <StatItem 
          label="Válidos" 
          value={stats.totalVotosValidos.toLocaleString("es-CL")} 
        />
        <StatItem 
          label="Nulos" 
          value={stats.totalNulos.toLocaleString("es-CL")} 
        />
        <StatItem 
          label="Blancos" 
          value={stats.totalBlancos.toLocaleString("es-CL")} 
          isLast={true} 
        />
      </Box>
    </Paper>
  );
};

export default ParticipationCard;