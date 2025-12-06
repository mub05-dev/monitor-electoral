import React, { useMemo } from "react";
import { Box, Tooltip, Typography, Avatar, Stack } from "@mui/material";

const Hemicycle = ({ diputados, pactColors }) => {
  const width = 900;
  const height = 450;
  const centerX = width / 2;
  const centerY = height - 40;

  const rows = 5;
  const rowCapacities = [24, 28, 32, 35, 36];

  const sortedDots = useMemo(() => {
    const points = [];

    for (let r = 0; r < rows; r++) {
      const rowRadius = 180 + r * 45;
      const seatsInRow = rowCapacities[r];
      const angleStep = Math.PI / (seatsInRow - 1);

      for (let i = 0; i < seatsInRow; i++) {
        const angle = Math.PI - i * angleStep;
        const x = centerX + rowRadius * Math.cos(angle);
        const y = centerY - rowRadius * Math.sin(angle);

        points.push({ x, y, angle, r: 12 });
      }
    }

    points.sort((a, b) => {
      if (Math.abs(a.angle - b.angle) < 0.01) return a.x - b.x;
      return b.angle - a.angle;
    });

    return points;
  }, []);

  const chartData = sortedDots
    .map((dot, index) => ({ ...dot, data: diputados[index] || null }))
    .filter((d) => d.data);

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: width,
          margin: "0 auto",
        }}
      >
        {/* --- SECCIÓN BORRADA: EL TÍTULO YA NO VA AQUÍ --- */}
        
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          style={{ overflow: "visible" }}
        >
          {chartData.map((dot, index) => {
            const pactId = dot.data.pact_id || "default";
            const color = pactColors[pactId] || "#ccc";

            const TooltipContent = (
              <Stack direction="row" spacing={2} alignItems="center" p={0.5}>
                <Avatar
                  src={dot.data.photo_url}
                  sx={{ width: 50, height: 50 }}
                />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {dot.data.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ opacity: 0.9 }}
                  >
                    {dot.data.display_party} • Distrito {dot.data.distrito_num}
                  </Typography>
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
                }}
              >
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

          <text
            x={centerX}
            y={centerY - 30}
            textAnchor="middle"
            fontSize="72"
            fontWeight="800"
            fill="#333"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {diputados.length}
          </text>

          <text
            x={centerX}
            y={centerY + 15}
            textAnchor="middle"
            fontSize="18"
            fill="#666"
            fontWeight="600"
            style={{ fontFamily: "Inter, sans-serif", letterSpacing: 4 }}
          >
            DIPUTADOS
          </text>
        </svg>
      </Box>
    </Box>
  );
};

export default Hemicycle;