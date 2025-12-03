import React from "react";
import {
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Typography,
  Divider,
} from "@mui/material";
import CalculateIcon from "@mui/icons-material/Calculate";
import PieChartIcon from "@mui/icons-material/PieChart";
import TableChartIcon from "@mui/icons-material/TableChart";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { distritosData } from "../const/distritos";

export default function SimulationControls({
  district,
  setDistrict,
  onCalculate,
  isSimulating,
  currentTab,
  onTabChange,
  stats,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #e0e0e0",
        borderRadius: 3,
        overflow: "hidden",
        mb: 3,
        bgcolor: "white",
        position: "sticky", // Hacemos que se pegue al subir
        top: 80, // Ajusta esto según la altura de tu Navbar principal
        zIndex: 90,
      }}>
      {/* FILA 1: CONTROL MAESTRO (Selector y Botón) */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
          bgcolor: "#f8f9fa",
          borderBottom: "1px solid #e0e0e0",
        }}>
        <FormControl size="small" sx={{ minWidth: 300, bgcolor: "white" }}>
          <InputLabel>Seleccionar Distrito</InputLabel>
          <Select
            value={district}
            label="Seleccionar Distrito"
            onChange={(e) => setDistrict(e.target.value)}>
            {distritosData.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          onClick={onCalculate}
          disabled={isSimulating}
          startIcon={
            isSimulating ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <CalculateIcon />
            )
          }
          sx={{ px: 4, height: 40, fontWeight: "bold", textTransform: "none" }}>
          {isSimulating ? "Calculando..." : "Simular D'Hondt"}
        </Button>

        {/* KPI Rápido (Opcional, se ve muy bien aquí) */}
        <Box sx={{ ml: "auto", display: { xs: "none", md: "block" } }}>
          <Typography variant="caption" color="text.secondary">
            Simulación basada en proyección D'Hondt
          </Typography>
        </Box>
      </Box>

      {/* FILA 2: PESTAÑAS DE VISTA (Tabs Internos) */}
      <Box sx={{ px: 2 }}>
        <Tabs
          value={currentTab}
          onChange={onTabChange}
          textColor="primary"
          indicatorColor="primary"
          sx={{ minHeight: 48 }}>
          <Tab
            icon={<PieChartIcon fontSize="small" />}
            iconPosition="start"
            label="Impacto Nacional (Hemiciclo)"
            sx={{ textTransform: "none", fontWeight: 600, minHeight: 48 }}
          />
          <Tab
            icon={<TableChartIcon fontSize="small" />}
            iconPosition="start"
            label="Detalle de Candidatos"
            sx={{ textTransform: "none", fontWeight: 600, minHeight: 48 }}
          />
          <Tab
            icon={<EmojiEventsIcon fontSize="small" />}
            iconPosition="start"
            label="Electos (Resultados)"
            disabled={!stats || stats.electos === 0} // Se habilita solo al calcular
            sx={{ textTransform: "none", fontWeight: 600, minHeight: 48 }}
          />
        </Tabs>
      </Box>
    </Paper>
  );
}
