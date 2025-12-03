import React, { useEffect, useState } from "react";
import { Grid, Box, CircularProgress, Alert, Paper } from "@mui/material";
import { getNacionalResults } from "../data/api";
import Hemicycle from "../components/Hemicycle";
import PactCards from "../components/kpi/PactCards";

export default function NationalView({ dataType, pactColors }) {
  const [data, setData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await getNacionalResults(dataType);
        if (res.data && res.data.diputados) {
          setSummaryData(res.data.resumen);
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
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #e0e0e0",
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "white",
        mt: 2,
        display: "flex",
      }}>
      <Grid container>
        <Grid
          item
          xs={12}
          lg={8}
          sx={{
            p: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 500,
          }}>
          <Hemicycle diputados={data} pactColors={pactColors} />
          <Box sx={{ width: "100%" }}></Box>
        </Grid>
        <Grid
          item
          xs={12}
          lg={4}
          sx={{
            p: 2,
          }}>
          <PactCards summaryData={summaryData} pactColors={pactColors} />
        </Grid>
      </Grid>
    </Paper>
  );
}
