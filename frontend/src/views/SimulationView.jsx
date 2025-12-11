import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Alert } from "@mui/material";

import { getAllCandidates, getDhondtResults } from "../data/api";

// import MethodologyCard from "../components/kpi/MethodologyCard";
// import SimulationControls from "../components/simulation/SimulationControls";
// import DistrictTable from "../components/simulation/DistrictTable";
import NationalView from "./NationalView";
import SimulationControls from "../components/SimulationControls";
import DistrictTable from "../components/DistrictTable";

export default function SimulationView({ pactColors }) {
  const [district, setDistrict] = useState("10");
  const [currentTab, setCurrentTab] = useState(0);

  const [candidates, setCandidates] = useState([]);
  const [pactNames, setPactNames] = useState({});
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);

  const totalCandidates = candidates.length;
  const totalElected = candidates.filter((c) => c.isElected).length;

  useEffect(() => {
    loadDistrictData();
  }, [district]);

  const loadDistrictData = async () => {
    setLoading(true);
    setError(null);
    setCurrentTab(1);
    try {
      const res = await getAllCandidates(district, "simulacion");

      const rawCandidates = (res.data.candidates || []).map((c) => ({
        ...c,
        isElected: false,
      }));
      setCandidates(rawCandidates);
      const pactsObj = {};
      if (res.data.pacts) {
        res.data.pacts.forEach((p) => {
          pactsObj[p._id] = p.name;
        });
      }
      setPactNames(pactsObj);
    } catch (e) {
      setError("Error cargando distrito");
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const res = await getDhondtResults(district, "simulacion");
      console.log("res", res);
      const electedList = res.data.elected || [];
      const electedNames = new Set(electedList.map((e) => e.name));
      const updatedCandidates = candidates.map((c) => ({
        ...c,
        isElected: electedNames.has(c.name),
      }));

      updatedCandidates.sort((a, b) => {
        if (a.isElected === b.isElected) return b.votes - a.votes;
        return a.isElected ? -1 : 1;
      });

      setCandidates(updatedCandidates);

      setCurrentTab(1);
    } catch (e) {
      setError("Error en el cálculo D'Hondt");
    } finally {
      setCalculating(false);
    }
  };

  const displayedCandidates =
    currentTab === 2 ? candidates.filter((c) => c.isElected) : candidates;

  return (
    <Box>
      <SimulationControls
        district={district}
        setDistrict={setDistrict}
        onCalculate={handleCalculate}
        isSimulating={calculating}
        currentTab={currentTab}
        onTabChange={(e, v) => setCurrentTab(v)}
        stats={{ total: totalCandidates, electos: totalElected }}
      />

      <Box sx={{ minHeight: 400 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" p={5}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {currentTab === 0 && (
              <Box>
                <NationalView dataType="simulacion" pactColors={pactColors} />
              </Box>
            )}

            {(currentTab === 1 || currentTab === 2) && (
              <DistrictTable
                candidates={displayedCandidates}
                title={
                  currentTab === 2
                    ? "Resultados por Pacto"
                    : "Nómina Candidatos"
                }
                isElectedMode={currentTab === 2}
                pactColors={pactColors}
                pactNames={pactNames}
              />
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
