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
    <Box
      sx={{ height: "100%", display: "flex", flexDirection: "column", p: 3 }}>
      <Box
        sx={{ flexGrow: 1, overflowY: "auto", maxHeight: { lg: 500 }, pr: 1 }}>
        <Stack
          spacing={0}
          divider={<Divider sx={{ borderStyle: "dashed", my: 1 }} />}>
          {summaryData.map((pact) => {
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
                  py: 1,
                }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 4,
                      height: 36,
                      bgcolor: color,
                      borderRadius: 2,
                      flexShrink: 0,
                    }}
                  />
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      lineHeight={1.2}>
                      {pact.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatCompact(pact.votes)} votos
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right", minWidth: 50 }}>
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
                    sx={{ fontSize: "0.6rem", textTransform: "uppercase" }}>
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
