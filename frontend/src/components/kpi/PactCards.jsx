import React from "react";
import { Box, Typography, Stack, Divider } from "@mui/material";

const formatCompact = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + " M";
  else if (num >= 1000) return (num / 1000).toFixed(0) + " K";
  return num.toString();
};

const PactCards = ({ summaryData, pactColors }) => {
  if (!summaryData) return null;

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ flexGrow: 1, overflowY: "auto", pr: 1 }}>
        <Stack
          spacing={0}
          divider={
            <Divider
              sx={{
                borderStyle: "dashed",
                borderColor: "rgba(0, 0, 0, 0.1)", // Gris muy suave
                my: 1,
              }}
            />
          }
        >
          {summaryData.map((pact) => {
            // Lógica para determinar el color
            const colorKey =
              pact.id === "others" || pact.id === "indep"
                ? pact.color_key || "default"
                : pact.id;
            const color = pactColors[colorKey] || "#999";

            return (
              <Box
                key={pact.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 0.5, // Reducimos padding para que se vea compacto
                }}
              >
                {/* Lado Izquierdo: Barra de color + Texto */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {/* Barra vertical de color */}
                  <Box
                    sx={{
                      width: 4,
                      height: 32,
                      bgcolor: color,
                      borderRadius: 4, 
                      flexShrink: 0,
                    }}
                  />
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ 
                        fontWeight: 700, 
                        color: "text.primary",
                        fontSize: "0.95rem"
                      }}
                    >
                      {pact.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.75rem" }}
                    >
                      {formatCompact(pact.votes)} votos
                    </Typography>
                  </Box>
                </Box>

                {/* Lado Derecho: Número grande + Label */}
                <Box sx={{ textAlign: "right", minWidth: 60 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800, // Extra bold para el número
                      color: "text.primary",
                      lineHeight: 1,
                      mb: 0.5
                    }}
                  >
                    {pact.seats}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: "text.secondary",
                      fontSize: "0.6rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      opacity: 0.8
                    }}
                  >
                    Electos
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
};

export default PactCards;