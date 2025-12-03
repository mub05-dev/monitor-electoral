import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Alert } from "@mui/material";

// Servicios
import { getAllCandidates, getDhondtResults } from "../data/api";

// Componentes Hijos
// import MethodologyCard from "../components/kpi/MethodologyCard";
// import SimulationControls from "../components/simulation/SimulationControls";
// import DistrictTable from "../components/simulation/DistrictTable";
import NationalView from "./NationalView"; // Reutilizamos la vista nacional
import SimulationControls from "../components/SimulationControls";
import DistrictTable from "../components/DistrictTable";

export default function SimulationView({ pactColors }) {
  // ESTADOS
  const [district, setDistrict] = useState("10"); // Distrito seleccionado
  const [currentTab, setCurrentTab] = useState(0); // 0: Nacional, 1: Detalle

  // DATA
  const [candidates, setCandidates] = useState([]);
  const [pactNames, setPactNames] = useState({});
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);

  const totalCandidates = candidates.length;
  const totalElected = candidates.filter((c) => c.isElected).length;

  // 1. CARGA INICIAL (Solo candidatos al cambiar distrito)
  useEffect(() => {
    loadDistrictData();
  }, [district]);

  const loadDistrictData = async () => {
    setLoading(true);
    setError(null);
    setCurrentTab(1); // Al cambiar distrito, volvemos a la lista completa
    try {
      const res = await getAllCandidates(district, "simulacion");
      // Limpiamos banderas de electos anteriores
      const rawCandidates = (res.data.candidates || []).map((c) => ({
        ...c,
        isElected: false,
      }));
      setCandidates(rawCandidates);
      const pactsObj = {};
      if (res.data.pacts) {
        res.data.pacts.forEach(p => {
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

  // 2. ACCIÓN: SIMULAR D'HONDT
  const handleCalculate = async () => {
    setCalculating(true);
    try {
      // Obtenemos los ganadores del backend
      const res = await getDhondtResults(district, "simulacion");
      console.log("res", res);
      const electedList = res.data.elected || [];
      const electedNames = new Set(electedList.map((e) => e.name));
      const updatedCandidates = candidates.map((c) => ({
        ...c,
        isElected: electedNames.has(c.name),
      }));

      // Ordenamos: Electos primero, luego por votos
      updatedCandidates.sort((a, b) => {
        if (a.isElected === b.isElected) return b.votes - a.votes;
        return a.isElected ? -1 : 1;
      });

      setCandidates(updatedCandidates);

      // Opcional: Cambiar automáticamente al tab de detalle para ver el resultado
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
      {/* <MethodologyCard /> */}
      <SimulationControls
        district={district}
        setDistrict={setDistrict}
        onCalculate={handleCalculate}
        isSimulating={calculating}
        currentTab={currentTab}
        onTabChange={(e, v) => setCurrentTab(v)}
        stats={{ total: totalCandidates, electos: totalElected }}
      />

      {/* 3. CONTENIDO SEGÚN PESTAÑA */}
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
            {/* TAB 0: IMPACTO NACIONAL (Hemiciclo) */}
            {currentTab === 0 && (
              <Box>
                <NationalView dataType="simulacion" pactColors={pactColors} />
              </Box>
            )}

            {(currentTab === 1 || currentTab === 2) && (
              <DistrictTable
                candidates={displayedCandidates}
                title={
                  currentTab === 2 ? "Resultados por Pacto" : "Nómina Completa"
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
