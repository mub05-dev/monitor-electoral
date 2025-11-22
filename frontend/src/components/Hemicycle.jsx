import React, { useMemo } from 'react';
import { Box, Tooltip, Typography, Paper, Avatar, Stack, Grid, Chip } from '@mui/material';

// Mapeo de nombres completos de pactos (Opcional, para la leyenda)
const PACT_NAMES = {
  C: "Unidad por Chile",
  B: "Verdes, Regionalistas y Humanistas",
  I: "Partido de la Gente",
  J: "Chile Grande y Unido",
  K: "Cambio por Chile",
  A: "Partido Ecologista Verde",
  D: "Independientes",
  E: "Amarillos",
  F: "PTR",
  G: "Alianza Verde",
  H: "Partido Popular",
  default: "Otros",
};

const Hemicycle = ({ diputados, pactColors }) => {
  const width = 900;
  const height = 450;
  const centerX = width / 2;
  const centerY = height - 40;

  // Configuración geométrica
  const rows = 5;
  const rowCapacities = [24, 28, 32, 35, 36]; // Suma 155 exacta

  // 1. Generar y Ordenar Puntos Geométricos
  const sortedDots = useMemo(() => {
    const points = [];

    // Generar puntos por filas
    for (let r = 0; r < rows; r++) {
      const rowRadius = 180 + r * 45;
      const seatsInRow = rowCapacities[r];
      const angleStep = Math.PI / (seatsInRow - 1);

      for (let i = 0; i < seatsInRow; i++) {
        const angle = Math.PI - i * angleStep; // Ángulo en radianes (PI a 0)

        // Coordenadas cartesianas
        const x = centerX + rowRadius * Math.cos(angle);
        const y = centerY - rowRadius * Math.sin(angle);

        points.push({ x, y, angle, r: 12 });
      }
    }

    // CLAVE: Ordenar puntos por ángulo (de mayor a menor / Izq a Der)
    // Si tienen ángulo similar, desempatar por radio (llenar de adentro hacia afuera)
    points.sort((a, b) => {
      if (Math.abs(a.angle - b.angle) < 0.01) {
        return a.x - b.x; // Ajuste fino para alineación
      }
      return b.angle - a.angle; // Orden principal: Ángulo descendente
    });

    return points;
  }, []);

  // 2. Fusionar con datos de diputados (ya vienen ordenados políticamente desde el backend)
  const chartData = sortedDots
    .map((dot, index) => ({
      ...dot,
      data: diputados[index] || null, // Asignar diputado si existe
    }))
    .filter((d) => d.data); // Filtrar si hay menos diputados que asientos

  // Generar pactos únicos para leyenda
  const uniquePacts = [...new Set(diputados.map((d) => d.pact_id || "X"))];
  // Ordenar leyenda según el orden visual (Izquierda a Derecha)
  // Usamos el orden de PACTO_ORDER definido implícitamente por cómo vienen los datos
  // Simplemente tomamos el orden de aparición en el array de diputados
  const legendPacts = uniquePacts.sort((a, b) => {
    const idxA = diputados.findIndex((d) => (d.pact_id || "X") === a);
    const idxB = diputados.findIndex((d) => (d.pact_id || "X") === b);
    return idxA - idxB;
  });

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mb: 4,
        borderRadius: 4,
        border: "1px solid #e0e0e0",
        bgcolor: "#fff",
      }}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: width,
          margin: "0 auto",
        }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", overflow: "visible" }}>
          {chartData.map((dot, index) => {
            const pactId = dot.data.pact_id || "default";
            const color = pactColors[pactId] || "#ccc";

            // Tooltip con Foto
            const TooltipContent = (
              <Stack direction="row" spacing={2} alignItems="center" p={0.5}>
                <Avatar
                  src={dot.data.photo_url}
                  sx={{
                    width: 50,
                    height: 50,
                    border: "2px solid rgba(255,255,255,0.2)",
                  }}
                />
                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="inherit">
                    {dot.data.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    display="block"
                    color="inherit"
                    sx={{ opacity: 0.9 }}>
                    {dot.data.display_party} • Distrito {dot.data.distrito_num}
                  </Typography>
                  <Chip
                    label="Electo"
                    size="small"
                    sx={{
                      height: 16,
                      fontSize: "0.6rem",
                      mt: 0.5,
                      bgcolor: "rgba(255,255,255,0.2)",
                      color: "#fff",
                    }}
                  />
                </Box>
              </Stack>
            );

            return (
              <Tooltip
                key={index}
                title={TooltipContent}
                arrow
                placement="top"
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: "#212121",
                      "& .MuiTooltip-arrow": { color: "#212121" },
                      boxShadow: 3,
                    },
                  },
                }}>
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={dot.r}
                  fill={color}
                  stroke="white"
                  strokeWidth={2}
                  style={{ cursor: "pointer", transition: "all 0.2s ease-out" }}
                  onMouseEnter={(e) => {
                    e.target.setAttribute("r", 18);
                    e.target.setAttribute("stroke-width", 4);
                    // Mover al frente para que no lo tapen otros
                    e.target.parentNode.appendChild(e.target);
                  }}
                  onMouseLeave={(e) => {
                    e.target.setAttribute("r", 12);
                    e.target.setAttribute("stroke-width", 2);
                  }}
                />
              </Tooltip>
            );
          })}

          {/* Texto Central */}
          <text
            x={centerX}
            y={centerY - 30}
            textAnchor="middle"
            fontSize="72"
            fontWeight="800"
            fill="#333"
            style={{ fontFamily: "Inter, sans-serif", letterSpacing: -2 }}>
            {diputados.length}
          </text>
          <text
            x={centerX}
            y={centerY + 15}
            textAnchor="middle"
            fontSize="18"
            fill="#666"
            fontWeight="600"
            style={{ fontFamily: "Inter, sans-serif", letterSpacing: 4 }}>
            DIPUTADOS
          </text>
        </svg>
      </Box>

      {/* LEYENDA ORDENADA */}
      <Box sx={{ mt: 4, pt: 3, borderTop: "1px dashed #eee" }}>
        <Grid container spacing={3} justifyContent="center">
          {legendPacts.map((pid) => {
            const color = pactColors[pid] || "#999";
            return (
              <Grid item key={pid}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      bgcolor: color,
                    }}
                  />
                  <Typography
                    variant="body2"
                    color="text.primary"
                    fontWeight={500}>
                    {PACT_NAMES[pid] || pid}
                  </Typography>
                </Stack>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Paper>
  );
};

export default Hemicycle;
