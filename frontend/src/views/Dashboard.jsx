import React, { useState } from "react";
import {
  Box,
  Container,
  Tabs,
  Tab,
  Paper,
  Switch,
  FormControlLabel,
  Typography,
  useTheme,
} from "@mui/material";
import Navbar from "../components/layout/Navbar";
import NationalView from "./NationalView";
import DistrictView from "./DistrictView";
import PublicIcon from "@mui/icons-material/Public";
import MapIcon from "@mui/icons-material/Map";

export default function Dashboard() {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState(0);
  const [isRealData, setIsRealData] = useState(false);

  const dataType = isRealData ? "real" : "simulacion";
  const pactColors = theme.palette.pactColors;

  return (
    <Box sx={{ pb: 8, minHeight: "100vh", bgcolor: "#f4f6f8" }}>
      <Navbar />
      <Container maxWidth="xl">
        <Paper
          sx={{
            mb: 4,
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}>
          <Tabs
            value={viewMode}
            onChange={(e, v) => setViewMode(v)}
            indicatorColor="primary"
            textColor="primary">
            <Tab
              icon={<PublicIcon />}
              label="Panorama Nacional"
              iconPosition="start"
            />
            <Tab
              icon={<MapIcon />}
              label="Detalle por Distrito"
              iconPosition="start"
            />
          </Tabs>
          <FormControlLabel
            control={
              <Switch
                checked={isRealData}
                onChange={(e) => setIsRealData(e.target.checked)}
                color="success"
              />
            }
            label={
              <Typography
                variant="body2"
                fontWeight="bold"
                color={isRealData ? "success.main" : "text.secondary"}>
                {isRealData
                  ? "🟢 DATOS REALES (LIVE)"
                  : "🔵 SIMULACIÓN (ENCUESTAS)"}
              </Typography>
            }
            sx={{
              border: "1px solid #e0e0e0",
              pr: 2,
              borderRadius: 2,
              ml: "auto",
            }}
          />
        </Paper>
        <Box>
          {viewMode === 0 ? (
            <NationalView dataType={dataType} pactColors={pactColors} />
          ) : (
            <DistrictView dataType={dataType} pactColors={pactColors} />
          )}
        </Box>
      </Container>
    </Box>
  );
}
