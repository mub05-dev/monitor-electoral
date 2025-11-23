import React, { useEffect, useState } from "react";
import { Grid, Box, CircularProgress, Alert, Typography } from "@mui/material";
import { getNacionalResults } from "../data/api";
import Hemicycle from "../components/Hemicycle";
import PactCards from "../components/kpi/PactCards";

export default function NationalView({ dataType, pactColors }) {
  const [data, setData] = useState([]);
  const [summaryData,setSummaryData] = useState([])
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await getNacionalResults(dataType);
        if (res.data && res.data.diputados) {
          setSummaryData(res.data.resumen)
          setData(res.data.diputados);
        }
      } catch (e) {
        setError("Error cargando datos nacionales.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dataType]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} lg={8}>
        <Hemicycle diputados={data} pactColors={pactColors} />
      </Grid>
      <Grid item xs={12} lg={4}>
        <Box mb={2}>
          <Typography variant="h6" fontWeight={700} color="text.secondary">
            Resumen por Pacto
          </Typography>
        </Box>
        <PactCards summaryData={summaryData} pactColors={pactColors} />
      </Grid>
    </Grid>
  );
}
