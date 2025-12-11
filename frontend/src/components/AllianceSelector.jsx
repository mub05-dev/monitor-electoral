import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
} from "@mui/material";
import HandshakeIcon from "@mui/icons-material/Handshake";

export default function AllianceSelector({
  scenario,
  setScenario,
  onSimulate,
  loading,
}) {
  const handleChange = (event) => {
    const val = event.target.value;
    setScenario(val);
    if (val) {
      onSimulate(val);
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: "#f5fbfd",
        borderRadius: 2,
        border: "1px dashed #90caf9",
        mb: 3,
      }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <HandshakeIcon color="primary" />
        <Typography variant="h6" color="primary" fontWeight="bold">
          Proyección Nacional por Alianzas
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ mb: 2, color: "#555" }}>
        Selecciona un escenario para recalcular la composición del{" "}
        <strong>Congreso Nacional completo</strong> (todos los distritos) bajo
        supuestos de unidad.
      </Typography>

      <FormControl fullWidth size="small" sx={{ bgcolor: "white" }}>
        <InputLabel id="scenario-label">
          Seleccionar Escenario Nacional
        </InputLabel>
        <Select
          labelId="scenario-label"
          value={scenario}
          label="Seleccionar Escenario Nacional"
          onChange={handleChange}
          disabled={loading}>
          <MenuItem value="">
            <em>Seleccione una opción...</em>
          </MenuItem>
          <MenuItem value="derecha_unida">
            <strong>Derechas Unidas </strong> (J+K)
          </MenuItem>
          <MenuItem value="izquierda_unida">
            <strong>Izquierdas Unidas </strong> (A+B+C+D+F+G+H)
          </MenuItem>
        </Select>
      </FormControl>

      {scenario === "derecha_unida" && (
        <Alert severity="info" sx={{ mt: 2, fontSize: "0.85rem" }}>
          Simulando fusión de listas J y K en los 28 distritos del país.
        </Alert>
      )}
      {scenario === "izquierda_unida" && (
        <Alert severity="info" sx={{ mt: 2, fontSize: "0.85rem" }}>
          Simulando fusión de listas A, B, C, D, F, G y H a nivel nacional.
        </Alert>
      )}
    </Box>
  );
}
