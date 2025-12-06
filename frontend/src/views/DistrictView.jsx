import React, { useState, useEffect, useMemo } from "react";
import { Box, CircularProgress, Alert, Typography } from "@mui/material";

// Imports de API
import {
  getAllCandidates,
  getDhondtResults,
  getNacionalResults,
} from "../data/api";

// Imports de Componentes
import ResultsControls from "../components/ResultsControls";
import RealDistrictTable from "../components/RealDistrictTable";
import AllianceSelector from "../components/AllianceSelector";
import Hemicycle from "../components/Hemicycle";
import NationalSummary from "../components/layout/NationalSummary";

const INCENTIVE_PER_WOMAN = 500;

export default function DistrictView({ dataType = "real", pactColors }) {
  // --- ESTADOS ---
  const [district, setDistrict] = useState("10");
  const [currentTab, setCurrentTab] = useState(0);

  // Datos Distritales
  const [candidates, setCandidates] = useState([]);
  const [parties, setParties] = useState([]);
  const [pacts, setPacts] = useState([]);
  const [electedCandidates, setElectedCandidates] = useState([]);

  // Datos Nacionales (Simulación)
  const [scenario, setScenario] = useState("");
  const [nationalElected, setNationalElected] = useState([]);
  // 1. NUEVO ESTADO: Para guardar el resumen que ya viene listo del backend
  const [nationalSummaryResults, setNationalSummaryResults] = useState([]);
  const [loadingSim, setLoadingSim] = useState(false);

  // Estados de carga generales
  const [loading, setLoading] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [error, setError] = useState(null);

  const totalCandidates = candidates.length;
  const totalElected = hasResults
    ? candidates.filter((c) => c.isElected).length
    : 0;

  // Extender colores para simulación
  const extendedColors = useMemo(
    () => ({
      ...pactColors,
      SC_DER: pactColors["K"] || "#000080", // Mapeamos ID Backend -> Color
      SC_IZQ: pactColors["C"] || "#FF0000",
    }),
    [pactColors]
  );

  // Carga Base
  useEffect(() => {
    loadDistrictBase();
  }, [district, dataType]);

  const loadDistrictBase = async () => {
    setLoading(true);
    setError(null);
    setHasResults(false);
    setElectedCandidates([]);
    setCurrentTab(0);
    setScenario("");
    setNationalElected([]);
    setNationalSummaryResults([]); // Limpiamos resumen anterior
    try {
      const resCands = await getAllCandidates(district, dataType);
      const rawCandidates = resCands.data.candidates || [];
      setCandidates(rawCandidates.map((c) => ({ ...c, isElected: false })));
      setParties(resCands.data.parties || []);
      setPacts(resCands.data.pacts || []);
    } catch (e) {
      console.error(e);
      setError("Error cargando datos del distrito.");
    } finally {
      setLoading(false);
    }
  };

  // Carga Resultados Locales
  const handleLoadLocalResults = async () => {
    setLoadingResults(true);
    try {
      const resElected = await getDhondtResults(district, dataType);
      const electedList = resElected.data.elected || [];
      setElectedCandidates(electedList);

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
      setHasResults(true);
      setCurrentTab(1);
    } catch (e) {
      setError("Error al cargar resultados locales.");
    } finally {
      setLoadingResults(false);
    }
  };

  // 2. MODIFICACIÓN AQUÍ: Guardar el resumen del backend
  const handleSimulateNational = async (selectedScenario) => {
    // Permitimos llamar incluso si selectedScenario es vacío (para cargar default)
    setLoadingSim(true);
    try {
      const res = await getNacionalResults(dataType, selectedScenario);

      // Guardamos Diputados (para el Hemiciclo)
      if (res.data && res.data.diputados) {
        setNationalElected(res.data.diputados);
      }

      // Guardamos Resumen (para la lista lateral) - ¡ESTO ES LO NUEVO!
      if (res.data && res.data.resumen) {
        setNationalSummaryResults(res.data.resumen);
      }
    } catch (e) {
      console.error(e);
      setError("Error calculando proyección nacional.");
    } finally {
      setLoadingSim(false);
    }
  };

  // Memos Tabla Local (Sin cambios)
  const { partyMap, pactNamesMap } = useMemo(() => {
    const pMap = new Map(pacts.map((p) => [p._id, p]));
    const paMap = new Map(
      parties.map((p) => [
        p._id,
        { ...p, pactName: pMap.get(p.list_id)?.name || p.list_id },
      ])
    );
    const namesObj = {};
    pacts.forEach((p) => (namesObj[p._id] = p.name));
    return { partyMap: paMap, pactMap: pMap, pactNamesMap: namesObj };
  }, [parties, pacts]);

  const pactResults = useMemo(() => {
    // 1. Agrupar electos por pacto
    const electMap = new Map();
    // 2. Calcular incentivos por género
    const iPacts = new Map();
    const iParties = new Map();

    electedCandidates.forEach((c) => {
      const party = partyMap.get(c.party_id);
      if (party) {
        if (!electMap.has(party.list_id)) electMap.set(party.list_id, []);
        electMap.get(party.list_id).push(c);

        if (c.gender === "M") {
          const currentPactIncentive = iPacts.get(party.list_id) || 0;
          iPacts.set(party.list_id, currentPactIncentive + INCENTIVE_PER_WOMAN);

          const currentPartyIncentive = iParties.get(party._id) || 0;
          iParties.set(party._id, currentPartyIncentive + INCENTIVE_PER_WOMAN);
        }
      }
    });

    // 3. Mapear resultados finales
    return pacts
      .map((p) => {
        // --- LÓGICA RECUPERADA: Filtrar partidos de este pacto ---
        const pactParties = parties
          .filter((py) => py.list_id === p._id) // Filtramos por ID de lista
          .map((py) => ({
            ...py,
            incentive: iParties.get(py._id) || 0,
          }))
          .sort((a, b) => b.votes - a.votes); // Ordenamos por votos
        // ---------------------------------------------------------

        return {
          pactId: p._id,
          pactName: p.name,
          pactVotes: p.votes,
          elected: (electMap.get(p._id) || []).sort(
            (a, b) => b.votes - a.votes
          ),
          seats: (electMap.get(p._id) || []).length,
          incentive: iPacts.get(p._id) || 0,
          parties: pactParties, // <--- AQUÍ PASAMOS LA DATA AL COMPONENTE
        };
      })
      .sort((a, b) => b.pactVotes - a.pactVotes);
  }, [pacts, electedCandidates, parties, partyMap]);

  // 3. BORRADO: Eliminamos el useMemo 'nationalSummaryData' antiguo.
  // Ya no necesitamos calcularlo a mano porque 'nationalSummaryResults' lo trae listo.

  return (
    <Box>
      <ResultsControls
        district={district}
        setDistrict={setDistrict}
        currentTab={currentTab}
        onTabChange={(e, v) => setCurrentTab(v)}
        stats={{ total: totalCandidates, electos: totalElected }}
        loading={loading}
        onLoadResults={handleLoadLocalResults}
        isLoadingResults={loadingResults}
        hasResults={hasResults}
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
            {/* ---------------- TAB 2: SIMULACIÓN NACIONAL ---------------- */}
            {currentTab === 2 && (
              <Box>
                <AllianceSelector
                  scenario={scenario}
                  setScenario={setScenario}
                  loading={loadingSim}
                  onSimulate={handleSimulateNational}
                />

                {loadingSim ? (
                  <Box
                    display="flex"
                    justifyContent="center"
                    p={5}
                    flexDirection="column"
                    alignItems="center">
                    <CircularProgress size={40} />
                    <Typography sx={{ mt: 2, color: "text.secondary" }}>
                      Calculando 155 escaños...
                    </Typography>
                  </Box>
                ) : nationalElected.length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    <NationalSummary
                      // 4. USAMOS EL DATO DEL BACKEND DIRECTAMENTE
                      summaryData={nationalSummaryResults}
                      pactColors={extendedColors}
                      totalDiputados={155}>
                      <Hemicycle
                        diputados={nationalElected}
                        pactColors={extendedColors}
                      />
                    </NationalSummary>
                  </Box>
                ) : (
                  // Muestra un mensaje inicial si no se ha simulado nada
                  !loadingSim && (
                    <Box textAlign="center" py={4}>
                      <Typography color="text.secondary">
                        Selecciona un escenario y pulsa "Simular" para ver la
                        proyección.
                      </Typography>
                    </Box>
                  )
                )}
              </Box>
            )}

            {/* TABS LOCALES (Sin cambios) */}
            {currentTab === 1 && (
              <RealDistrictTable
                candidates={candidates}
                pactResults={pactResults}
                pactNames={pactNamesMap}
                pactColors={pactColors}
                title="Resultados Oficiales del Distrito (D'Hondt)"
                isElectedMode={true}
              />
            )}

            {currentTab === 0 && (
              <RealDistrictTable
                candidates={candidates}
                pactResults={pactResults}
                pactNames={pactNamesMap}
                pactColors={pactColors}
                title="Nómina Completa de Candidatos"
                isElectedMode={false}
              />
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
