import React from "react";
import {
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Chip,
  Skeleton
} from "@mui/material";
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import HowToVoteIcon from '@mui/icons-material/HowToVote'; 
import { distritosData } from "../const/distritos"; // Ajusta tu ruta

export default function ResultsControls({
  district,
  setDistrict,
  currentTab,
  onTabChange,
  stats,
  loading, // Carga inicial (cambio de distrito)
  onLoadResults, // Función para el botón
  isLoadingResults, // Carga del botón
  hasResults // Si ya se cargaron los resultados
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
        position: 'sticky',
        top: 80,
        zIndex: 90
      }}
    >
      {/* FILA 1: CONTROL MAESTRO */}
      <Box sx={{ p: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: 'wrap', bgcolor: '#f0fdf4', borderBottom: '1px solid #e0e0e0' }}>
        
        <FormControl size="small" sx={{ minWidth: 300, bgcolor: 'white' }}>
          <InputLabel>Seleccionar Distrito</InputLabel>
          <Select
            value={district}
            label="Seleccionar Distrito"
            onChange={(e) => setDistrict(e.target.value)}
            disabled={loading || isLoadingResults}
          >
            {distritosData.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* BOTÓN DE ACCIÓN MANUAL */}
        <Button
          variant="contained"
          color="success"
          onClick={onLoadResults}
          disabled={loading || isLoadingResults || hasResults}
          startIcon={isLoadingResults ? <CircularProgress size={20} color="inherit" /> : <HowToVoteIcon />}
          sx={{ px: 3, fontWeight: 'bold', textTransform: 'none', bgcolor: hasResults ? 'success.dark' : 'success.main' }}
        >
          {isLoadingResults ? "Cargando..." : (hasResults ? "Resultados Cargados" : "Ver Resultados Oficiales")}
        </Button>

        {/* KPIs con SKELETON */}
        <Box sx={{ ml: 'auto', display: 'flex', gap: 2, alignItems: 'center' }}>
            {loading ? (
                <>
                    <Skeleton variant="rounded" width={120} height={24} />
                    <Skeleton variant="rounded" width={100} height={24} />
                </>
            ) : (
                stats && (
                    <>
                        <Chip label={`${stats.total} Candidatos`} size="small" sx={{ bgcolor: 'white' }} />
                        {stats.electos > 0 && (
                            <Chip 
                                label={`${stats.electos} Electos`} 
                                size="small" 
                                color="success" 
                                icon={<EmojiEventsIcon />} 
                            />
                        )}
                    </>
                )
            )}
        </Box>
      </Box>

      {/* FILA 2: PESTAÑAS */}
      <Box sx={{ px: 2 }}>
        <Tabs 
            value={currentTab} 
            onChange={onTabChange}
            textColor="primary"
            indicatorColor="primary"
            sx={{ minHeight: 48 }}
        >
            <Tab 
                icon={<FormatListBulletedIcon fontSize="small"/>} 
                iconPosition="start" 
                label="Nómina Completa" 
                sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }} 
            />
            <Tab 
                icon={<EmojiEventsIcon fontSize="small"/>} 
                iconPosition="start" 
                label="Resultados por Pacto" 
                disabled={!hasResults} // Solo habilitado tras cargar
                sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }} 
            />
        </Tabs>
      </Box>
    </Paper>
  );
}