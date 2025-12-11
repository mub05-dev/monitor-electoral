import React from "react";
import { Paper, Typography, Box, Tooltip, Stack } from "@mui/material";

const DistrictGenderChart = ({ distritos }) => {
  if (!distritos || distritos.length === 0) return null;

  const COLOR_H = "#42a5f5";
  const COLOR_M = "#ec407a";

  const maxSeats = Math.max(...distritos.map((d) => d.electos.total));

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: "1px solid #e0e0e0",
        borderRadius: 3,
        bgcolor: "white",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}>
      <Box
        mb={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center">
        <Typography variant="h6" fontWeight="800" color="text.primary">
          Paridad por Distrito
        </Typography>

        <Stack direction="row" spacing={2}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box
              sx={{ width: 12, height: 12, bgcolor: COLOR_H, borderRadius: 1 }}
            />
            <Typography
              variant="caption"
              fontWeight="bold"
              color="text.secondary">
              Hombres
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box
              sx={{ width: 12, height: 12, bgcolor: COLOR_M, borderRadius: 1 }}
            />
            <Typography
              variant="caption"
              fontWeight="bold"
              color="text.secondary">
              Mujeres
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between", 
          height: 280,
          pt: 2,
          overflowX: "auto",
          gap: 0.5,
        }}>
        {distritos.map((d) => {
          const total = d.electos.total;
          const heightPercent = (total / maxSeats) * 100;
          const pctH = (d.electos.hombres / total) * 100;
          const pctM = (d.electos.mujeres / total) * 100;

          return (
            <Box
              key={d.distrito}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "100%",
                justifyContent: "flex-end",
                minWidth: "25px", 
              }}>
              <Tooltip
                title={
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="subtitle2">
                      Distrito {d.distrito}
                    </Typography>
                    <Typography variant="body2">
                      {d.electos.hombres} Hombres - {d.electos.mujeres} Mujeres
                    </Typography>
                    <Typography variant="caption">Total: {total}</Typography>
                  </Box>
                }
                arrow
                placement="top">
                <Box
                  sx={{
                    width: "60%",
                    minWidth: "20px",
                    maxWidth: "32px",

                    height: `${heightPercent}%`,
                    bgcolor: "#f5f5f5",
                    borderRadius: 4,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column-reverse",
                    transition: "all 0.3s",
                    "&:hover": { opacity: 0.8, transform: "scaleY(1.02)" },
                  }}>
                  <Box
                    sx={{ height: `${pctH}%`, bgcolor: COLOR_H, width: "100%" }}
                  />
                  <Box
                    sx={{ height: `${pctM}%`, bgcolor: COLOR_M, width: "100%" }}
                  />
                </Box>
              </Tooltip>
              <Box mt={1} textAlign="center">
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  display="block"
                  lineHeight={1}
                  color="text.secondary">
                  D{d.distrito}
                </Typography>
                <Typography
                  variant="caption"
                  fontSize={9}
                  color="text.disabled">
                  ({total})
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

export default DistrictGenderChart;
