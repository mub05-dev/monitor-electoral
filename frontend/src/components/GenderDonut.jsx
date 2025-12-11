import React from "react";
import { Box, Paper, Typography, Stack } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";

const GenderDonut = ({ title, men, women }) => {
  const safeMen = men || 0;
  const safeWomen = women || 0;
  const total = safeMen + safeWomen;

  if (total === 0) return null;

  const pctMen = (safeMen / total) * 100;
  const pctWomenDisplay = ((safeWomen / total) * 100).toFixed(1);

  const COLOR_H = "#42a5f5";
  const COLOR_M = "#ec407a";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: "100%",
        border: "1px solid #e0e0e0",
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
      <Box sx={{ width: "100%", textAlign: "left", mb: 1 }}>
        <Typography variant="overline" fontWeight="bold" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4" fontWeight="800" color="text.primary">
          {total.toLocaleString("es-CL")}
        </Typography>
      </Box>
      <Box
        sx={{
          position: "relative",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: `conic-gradient(${COLOR_H} 0% ${pctMen}%, ${COLOR_M} ${pctMen}% 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          my: 2,
        }}>
        <Box
          sx={{
            width: 150,
            height: 150,
            bgcolor: "white",
            borderRadius: "50%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <Typography
            variant="h4"
            fontWeight="900"
            color={COLOR_M}
            sx={{ lineHeight: 1 }}>
            {pctWomenDisplay}%
          </Typography>
          <Typography
            variant="caption"
            fontWeight="bold"
            color="text.secondary">
            MUJERES
          </Typography>
        </Box>
      </Box>

      <Stack
        direction="row"
        spacing={4}
        sx={{ width: "100%", justifyContent: "center" }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CircleIcon sx={{ fontSize: 10, color: COLOR_H }} />
            <Typography
              variant="caption"
              fontWeight="bold"
              color="text.secondary">
              HOMBRES
            </Typography>
          </Stack>
          <Typography variant="h6" fontWeight="bold" align="center">
            {safeMen.toLocaleString("es-CL")}
          </Typography>
        </Box>

        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CircleIcon sx={{ fontSize: 10, color: COLOR_M }} />
            <Typography
              variant="caption"
              fontWeight="bold"
              color="text.secondary">
              MUJERES
            </Typography>
          </Stack>
          <Typography variant="h6" fontWeight="bold" align="center">
            {safeWomen.toLocaleString("es-CL")}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

export default GenderDonut;
