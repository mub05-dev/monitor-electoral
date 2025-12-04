import React, { useState, useEffect, useMemo } from "react";
import { Box, CircularProgress, Alert } from "@mui/material";

import { getAllCandidates, getDhondtResults } from "../data/api";
import ResultsControls from "../components/ResultsControls";
import RealDistrictTable from "../components/RealDistrictTable"; 

const INCENTIVE_PER_WOMAN = 500;

export default function DistrictView({ dataType = "real", pactColors }) {
  // ESTADOS
  const [district, setDistrict] = useState("10");
  const [currentTab, setCurrentTab] = useState(0); // 0: Nómina, 1: Resultados
  
  const [candidates, setCandidates] = useState([]);
  const [parties, setParties] = useState([]);
  const [pacts, setPacts] = useState([]);
  const [electedCandidates, setElectedCandidates] = useState([]);
  
  const [loading, setLoading] = useState(false); // Carga inicial
  const [loadingResults, setLoadingResults] = useState(false); // Carga botón
  const [hasResults, setHasResults] = useState(false); // Flag
  const [error, setError] = useState(null);

  const totalCandidates = candidates.length;
  // Electos solo si ya se calcularon
  const totalElected = hasResults ? candidates.filter(c => c.isElected).length : 0;

  // 1. CARGA BASE AL CAMBIAR DISTRITO
  useEffect(() => {
    loadDistrictBase();
  }, [district, dataType]);

  const loadDistrictBase = async () => {
    setLoading(true);
    setError(null);
    setHasResults(false);
    setElectedCandidates([]);
    setCurrentTab(0);
    try {
      const resCands = await getAllCandidates(district, dataType);
      const rawCandidates = resCands.data.candidates || [];
      // Reiniciamos electos
      setCandidates(rawCandidates.map(c => ({...c, isElected: false})));
      
      setParties(resCands.data.parties || []);
      setPacts(resCands.data.pacts || []);
    } catch (e) {
      console.error(e);
      setError("Error cargando datos del distrito.");
    } finally {
      setLoading(false);
    }
  };

  // 2. CARGA DE RESULTADOS (Botón)
  const handleLoadResults = async () => {
    setLoadingResults(true);
    try {
      const resElected = await getDhondtResults(district, dataType);
      const electedList = resElected.data.elected || [];
      setElectedCandidates(electedList);
      
      const electedNames = new Set(electedList.map(e => e.name));
      
      // Actualizamos candidatos con flag
      const updatedCandidates = candidates.map(c => ({
        ...c,
        isElected: electedNames.has(c.name)
      }));
      
      // Ordenamos
      updatedCandidates.sort((a, b) => {
        if (a.isElected === b.isElected) return b.votes - a.votes;
        return a.isElected ? -1 : 1;
      });

      setCandidates(updatedCandidates);
      setHasResults(true);
      setCurrentTab(1); // Mover a la pestaña de resultados

    } catch (e) {
        setError("Error al cargar los resultados oficiales.");
    } finally {
        setLoadingResults(false);
    }
  };

  // --- LÓGICA COMPLEJA DE AGRUPACIÓN (Se mantiene tu lógica) ---
  const { partyMap, pactNamesMap } = useMemo(() => {
    const pMap = new Map(pacts.map((p) => [p._id, p]));
    const paMap = new Map(
      parties.map((p) => [
        p._id,
        { ...p, pactName: pMap.get(p.list_id)?.name || p.list_id },
      ])
    );
    const namesObj = {};
    pacts.forEach(p => namesObj[p._id] = p.name);

    return { partyMap: paMap, pactMap: pMap, pactNamesMap: namesObj };
  }, [parties, pacts]);

  // Recalculamos pactResults cuando cambian los electos
  const pactResults = useMemo(() => {
    const electMap = new Map();
    const iPacts = new Map();
    const iParties = new Map();

    electedCandidates.forEach((c) => {
      const party = partyMap.get(c.party_id);
      if (party) {
        if (!electMap.has(party.list_id)) electMap.set(party.list_id, []);
        electMap.get(party.list_id).push(c);

        if (c.gender === "M") {
            iPacts.set(party.list_id, (iPacts.get(party.list_id) || 0) + INCENTIVE_PER_WOMAN);
            iParties.set(party._id, (iParties.get(party._id) || 0) + INCENTIVE_PER_WOMAN);
        }
      }
    });

    const partiesByPact = new Map();
    parties.forEach((p) => {
      if (!partiesByPact.has(p.list_id)) partiesByPact.set(p.list_id, []);
      partiesByPact.get(p.list_id).push(p);
    });

    return pacts
      .map((p) => ({
        pactId: p._id,
        pactName: p.name,
        pactVotes: p.votes,
        elected: (electMap.get(p._id) || []).sort((a, b) => b.votes - a.votes),
        seats: (electMap.get(p._id) || []).length,
        incentive: iPacts.get(p._id) || 0,
        parties: (partiesByPact.get(p._id) || [])
          .map((pt) => ({
            ...pt,
            incentive: iParties.get(pt._id) || 0,
          }))
          .sort((a, b) => b.votes - a.votes),
      }))
      .sort((a, b) => b.pactVotes - a.pactVotes);
  }, [pacts, electedCandidates, parties, partyMap]);

  // Filtrado de visualización
  const displayedCandidates = currentTab === 1 
    ? candidates.filter(c => c.isElected) // Esto es opcional, el acordeón usa pactResults
    : candidates;

  return (
    <Box>
      <ResultsControls 
        district={district}
        setDistrict={setDistrict}
        currentTab={currentTab}
        onTabChange={(e, v) => setCurrentTab(v)}
        stats={{ total: totalCandidates, electos: totalElected }}
        loading={loading}
        
        onLoadResults={handleLoadResults}
        isLoadingResults={loadingResults}
        hasResults={hasResults}
      />

      <Box sx={{ minHeight: 400 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {loading ? (
           <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
        ) : (
           <RealDistrictTable 
              candidates={candidates} 
              pactResults={pactResults} 
              pactNames={pactNamesMap}
              pactColors={pactColors}
              title={currentTab === 1 ? "Resultados Oficiales por Pacto" : "Nómina Completa"}
              isElectedMode={currentTab === 1} 
           />
        )}
      </Box>
    </Box>
  );
}