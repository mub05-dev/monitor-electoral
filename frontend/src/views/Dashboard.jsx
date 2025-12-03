import React, { useState } from "react";
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Typography,
  Alert,
  Fade,
  useTheme,
} from "@mui/material";

import HowToVoteIcon from "@mui/icons-material/HowToVote";
import ScienceIcon from "@mui/icons-material/Science";
import BarChartIcon from "@mui/icons-material/BarChart";
import HomeIcon from "@mui/icons-material/Home";

import Navbar from "../components/layout/Navbar";
import NationalView from "./NationalView";
import DistrictView from "./DistrictView";
import GenderView from "./GenderView";
import ParticipationCard from "../components/ParticipationCard";
import SimulationView from "./SimulationView";

export default function Dashboard() {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const pactColors = theme.palette.pactColors;

  return (
    <Box sx={{ pb: 8, minHeight: "100vh", bgcolor: "#f4f6f8" }}>
      <Navbar />
      <Paper
        elevation={0}
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid #e0e0e0",
          position: "sticky",
          top: 0,
          zIndex: 100,
          px: { xs: 2, md: 4 },
        }}>
        <Container maxWidth="xl" disableGutters>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.95rem",
                minHeight: 64,
                gap: 1,
              },
              "& .Mui-selected": {
                color: theme.palette.primary.main,
              },
            }}>
            <Tab icon={<HomeIcon />} iconPosition="start" label="Home" />
            <Tab
              icon={<ScienceIcon />}
              iconPosition="start"
              label="Simulación (Encuestas)"
            />
            <Tab
              icon={<HowToVoteIcon />}
              iconPosition="start"
              label="Resultados 2025"
            />
            <Tab
              icon={<BarChartIcon />}
              iconPosition="start"
              label="Estadísticas"
            />
          </Tabs>
        </Container>
      </Paper>
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {currentTab === 0 && (
          <Fade in={true} timeout={500}>
            <Box>
              <ParticipationCard />
              <NationalView dataType="real" pactColors={pactColors} />
            </Box>
          </Fade>
        )}
        {currentTab === 1 && (
          <Fade in={true} timeout={500}>
            <Box>
              <SimulationView pactColors={pactColors}/>
            </Box>
          </Fade>
        )}
        {currentTab === 2 && (
          <Fade in={true} timeout={500}>
            <Box>
              <DistrictView dataType="real" pactColors={pactColors} />
            </Box>
          </Fade>
        )}
        {currentTab === 3 && (
          <Fade in={true} timeout={500}>
            <Box>
              <GenderView />
            </Box>
          </Fade>
        )}
      </Container>
    </Box>
  );
}
