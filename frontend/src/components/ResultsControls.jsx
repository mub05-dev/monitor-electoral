import React from "react";
import {
  Paper, Box, FormControl, InputLabel, Select, MenuItem, Tabs, Tab, Button,
  CircularProgress, Chip, Skeleton
} from "@mui/material";
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'; 
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; 
import HandshakeIcon from '@mui/icons-material/Handshake'; // Icono nuevo
import HowToVoteIcon from '@mui/icons-material/HowToVote'; 
import { distritosData } from "../const/distritos";

export default function ResultsControls({
  district, setDistrict, currentTab, onTabChange, stats, loading,
  onLoadResults, isLoadingResults, hasResults
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #e0e0e0", borderRadius: 3, overflow: "hidden", mb: 3,
        bgcolor: "white", position: 'relative',
      }}
    >
      {/* SECCIÓN SUPERIOR (SIN CAMBIOS) */}
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
              <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained" color="success" onClick={onLoadResults}
          disabled={loading || isLoadingResults}
          startIcon={isLoadingResults ? <CircularProgress size={20} color="inherit" /> : <HowToVoteIcon />}
          sx={{ px: 3, fontWeight: 'bold', textTransform: 'none', bgcolor: hasResults ? 'success.dark' : 'success.main' }}
        >
          {isLoadingResults ? "Calculando..." : "Ver Resultados Oficiales"}
        </Button>

        <Box sx={{ ml: 'auto', display: 'flex', gap: 2, alignItems: 'center' }}>
            {loading ? (
                <> <Skeleton variant="rounded" width={120} height={24} /> </>
            ) : (
                stats && (
                    <>
                        <Chip label={`${stats.total} Candidatos`} size="small" sx={{ bgcolor: 'white' }} />
                        {stats.electos > 0 && (
                            <Chip label={`${stats.electos} Electos`} size="small" color="success" icon={<EmojiEventsIcon />} />
                        )}
                    </>
                )
            )}
        </Box>
      </Box>

      {/* SECCIÓN TABS - AGREGAMOS LA TERCERA OPCIÓN */}
      <Box sx={{ px: 2 }}>
        <Tabs 
            value={currentTab} onChange={onTabChange}
            textColor="primary" indicatorColor="primary" sx={{ minHeight: 48 }}
        >
            <Tab icon={<FormatListBulletedIcon fontSize="small"/>} iconPosition="start" label="Nómina Local" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab icon={<EmojiEventsIcon fontSize="small"/>} iconPosition="start" label="Resultados Local" disabled={!hasResults} sx={{ textTransform: 'none', fontWeight: 600 }} />
            
            {/* NUEVA PESTAÑA */}
            <Tab 
                icon={<HandshakeIcon fontSize="small"/>} 
                iconPosition="start" 
                label="Simular Nacional" 
                sx={{ textTransform: 'none', fontWeight: 600, color: '#1976d2' }} 
            />
        </Tabs>
      </Box>
    </Paper>
  );
}