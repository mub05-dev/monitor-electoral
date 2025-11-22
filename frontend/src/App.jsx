import { useEffect, useMemo, useState, Fragment } from "react";
import { getAllCandidates, getDhondtResults, getHemicycle } from "./data/api";
import { distritosData } from "./const/distritos";

import Hemicycle from "./components/Hemicycle";

import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  IconButton,
  Collapse,
  Chip,
  Tabs,
  Tab,
  Avatar,
  Tooltip,
  useTheme,
  Divider,
} from "@mui/material";

// Iconos
import GroupIcon from "@mui/icons-material/Group";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import PollIcon from "@mui/icons-material/Poll";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import CalculateIcon from "@mui/icons-material/Calculate";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const INCENTIVE_PER_WOMAN = 500;

// Estilos constantes
const tableHeaderStyle = {
  fontWeight: 700,
  textTransform: "uppercase",
  fontSize: "0.75rem",
  color: "text.secondary",
  backgroundColor: "#f8f9fa",
  borderBottom: "2px solid #e9ecef",
  padding: "12px 16px",
};

const tableCellStyle = {
  fontSize: "0.9rem",
  padding: "12px 16px",
  verticalAlign: "middle",
};

export default function App() {
  const theme = useTheme();
  const [district, setDistrict] = useState("10");
  const [tabValue, setTabValue] = useState(0);

  const [candidates, setCandidates] = useState([]);
  const [parties, setParties] = useState([]);
  const [pacts, setPacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [electedCandidates, setElectedCandidates] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState(null);
  const [currentSeats, setCurrentSeats] = useState(null);
  const [openPacts, setOpenPacts] = useState(new Set());
  const [incentiveData, setIncentiveData] = useState({
    pacts: new Map(),
    parties: new Map(),
  });

  const [nationalData, setNationalData] = useState([]);

  const dataType = tabValue === 0 ? "simulacion" : "real";
  const themeColor = dataType === "real" ? "success" : "primary";

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setElectedCandidates([]);
    setCurrentSeats(null);
    setIncentiveData({ pacts: new Map(), parties: new Map() });
  };

  const formatNumber = (num) => new Intl.NumberFormat("es-CL").format(num);

  useEffect(() => {
    const loadNational = async () => {
      try {
        // Llamamos al endpoint nacional pasando el tipo (real/simulacion)
        const res = await getHemicycle(dataType);
        if (res.data && res.data.diputados) {
          setNationalData(res.data.diputados);
        }
      } catch (e) {
        console.error("Error cargando datos nacionales:", e);
      }
    };
    loadNational();
  }, [dataType]);

  useEffect(() => {
    const fetchCandidates = async () => {
      if (!district) return;
      setIsLoading(true);
      setError(null);
      setCandidates([]);
      setParties([]);
      setPacts([]);
      setElectedCandidates([]);
      setSimulationError(null);
      setCurrentSeats(null);
      setOpenPacts(new Set());
      setIncentiveData({ pacts: new Map(), parties: new Map() });
      try {
        const response = await getAllCandidates(district, dataType);
        const data = response.data;
        setCandidates(data.candidates || []);
        setParties(data.parties || []);
        setPacts(data.pacts || []);
      } catch (err) {
        const errorMsg =
          err.response?.data?.error || err.message || "Error desconocido";
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCandidates();
  }, [district, tabValue]);

  const { partyMap, pactMap } = useMemo(() => {
    const pMap = new Map(pacts.map((p) => [p._id, p]));
    const paMap = new Map(
      parties.map((p) => [
        p._id,
        { ...p, pactName: pMap.get(p.list_id)?.name || p.list_id },
      ])
    );
    return { partyMap: paMap, pactMap: pMap };
  }, [parties, pacts]);

  const handleDistrictChange = (event) => setDistrict(event.target.value);

  const handleSimulation = async () => {
    setIsSimulating(true);
    setSimulationError(null);
    setIncentiveData({ pacts: new Map(), parties: new Map() });
    try {
      const response = await getDhondtResults(district, dataType);
      const elected = response.data.elected || [];
      setElectedCandidates(elected);
      setCurrentSeats(response.data.cupos_distrito || 0);

      const incentivePactMap = new Map();
      const incentivePartyMap = new Map();
      for (const c of elected) {
        if (c.gender === "M") {
          const party = partyMap.get(c.party_id);
          if (party) {
            const pactId = party.list_id;
            const partyId = party._id;
            incentivePactMap.set(
              pactId,
              (incentivePactMap.get(pactId) || 0) + INCENTIVE_PER_WOMAN
            );
            incentivePartyMap.set(
              partyId,
              (incentivePartyMap.get(partyId) || 0) + INCENTIVE_PER_WOMAN
            );
          }
        }
      }
      setIncentiveData({ pacts: incentivePactMap, parties: incentivePartyMap });
    } catch (error) {
      const errorMsg =
        error.response?.data?.error || error.message || "Error al simular";
      setSimulationError(errorMsg);
      setCurrentSeats(null);
    } finally {
      setIsSimulating(false);
    }
  };

  const pactResults = useMemo(() => {
    const pactPartyAbbrs = new Map();
    const partiesByPact = new Map();
    for (const party of parties) {
      if (!partiesByPact.has(party.list_id)) {
        partiesByPact.set(party.list_id, []);
      }
      partiesByPact.get(party.list_id).push(party);
      if (!pactPartyAbbrs.has(party.list_id)) {
        pactPartyAbbrs.set(party.list_id, []);
      }
      if (!pactPartyAbbrs.get(party.list_id).includes(party._id)) {
        pactPartyAbbrs.get(party.list_id).push(party._id);
      }
    }
    const electedByPact = new Map();
    for (const candidate of electedCandidates) {
      const party = partyMap.get(candidate.party_id);
      if (party && party.list_id) {
        const pactId = party.list_id;
        if (!electedByPact.has(pactId)) {
          electedByPact.set(pactId, []);
        }
        electedByPact.get(pactId).push(candidate);
      }
    }
    const results = pacts.map((pact) => {
      const electedInPact = electedByPact.get(pact._id) || [];
      electedInPact.sort((a, b) => b.votes - a.votes);
      const partyList = pactPartyAbbrs.get(pact._id) || [];
      const partyString = partyList.join(", ");
      const fullPactName = partyString
        ? `${pact.name} (${partyString})`
        : pact.name;
      const partiesInPact = partiesByPact.get(pact._id) || [];
      const partiesData = partiesInPact
        .map((p) => ({
          ...p,
          incentive: incentiveData.parties.get(p._id) || 0,
        }))
        .sort((a, b) => b.votes - a.votes);
      return {
        pactId: pact._id,
        pactName: fullPactName,
        pactVotes: pact.votes,
        elected: electedInPact,
        seats: electedInPact.length,
        incentive: incentiveData.pacts.get(pact._id) || 0,
        parties: partiesData,
      };
    });
    results.sort((a, b) => b.pactVotes - a.pactVotes);
    return results;
  }, [electedCandidates, pacts, parties, partyMap, incentiveData]);

  const handleTogglePact = (pactId) => {
    setOpenPacts((prevOpen) => {
      const newOpen = new Set(prevOpen);
      if (newOpen.has(pactId)) {
        newOpen.delete(pactId);
      } else {
        newOpen.add(pactId);
      }
      return newOpen;
    });
  };

  return (
    <Box sx={{ pb: 8 }}>
      {/* HEADER */}
      <Box
        sx={{ bgcolor: "#212529", color: "white", py: 3, mb: 4, boxShadow: 2 }}>
        <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <AssessmentIcon
              fontSize="large"
              sx={{ color: dataType === "real" ? "#198754" : "#0d6efd" }}
            />
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: "#fff" }}>
                {dataType === "real"
                  ? "Monitor Electoral 2025"
                  : "Simulador D’Hondt"}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Sistema de Análisis de Datos
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>
        {nationalData.length > 0 && (
          <Hemicycle
            diputados={nationalData}
            pactColors={theme.palette.pactColors}
          />
        )}
        <Paper sx={{ mb: 4, p: 0 }}>
          <Grid container>
            <Grid item xs={12} md={6}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor={themeColor}
                textColor={themeColor}
                variant="fullWidth"
                sx={{ "& .MuiTab-root": { py: 3 } }}>
                <Tab
                  icon={<PollIcon />}
                  label="Simulación (Encuesta)"
                  iconPosition="start"
                />
                <Tab
                  icon={<HowToVoteIcon />}
                  label="Resultados Live"
                  iconPosition="start"
                />
              </Tabs>
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                bgcolor: "#f8f9fa",
                p: 2,
                display: "flex",
                gap: 2,
                alignItems: "center",
                borderLeft: { md: "1px solid #dee2e6" },
              }}>
              <FormControl fullWidth size="small" sx={{ bgcolor: "white" }}>
                <InputLabel>Seleccionar Distrito</InputLabel>
                <Select
                  value={district}
                  label="Seleccionar Distrito"
                  onChange={handleDistrictChange}>
                  {distritosData.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                disabled={isLoading || isSimulating}
                variant="contained"
                color={themeColor}
                onClick={handleSimulation}
                startIcon={
                  isSimulating ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <CalculateIcon />
                  )
                }
                sx={{ minWidth: "130px" }}>
                {isSimulating ? "..." : "Calcular"}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* LOADING & ERROR */}
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress color={themeColor} />
          </Box>
        )}
        {(error || simulationError) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || simulationError}
          </Alert>
        )}

        {/* GRID PRINCIPAL */}
        <Grid container spacing={3} sx={{ width: "100%", m: 0 }}>
          {/* 1. TABLA CANDIDATOS */}
          {!isLoading && !isSimulating && candidates.length > 0 && (
            <Grid item xs={12} sx={{ p: 0 }}>
              <Paper sx={{ overflow: "hidden" }}>
                <Box
                  sx={{
                    px: 3,
                    py: 2,
                    borderBottom: "1px solid #dee2e6",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <GroupIcon color="action" />
                    <Typography variant="h6">Detalle de Candidatos</Typography>
                  </Stack>
                  <Chip label={`${candidates.length} Registros`} size="small" />
                </Box>

                <TableContainer>
                  <Table sx={{ width: "100%", tableLayout: "fixed" }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={tableHeaderStyle}>Candidato</TableCell>
                        <TableCell sx={tableHeaderStyle} width="20%">
                          {dataType === "real"
                            ? "Preferencia"
                            : "Votos Encuesta"}
                        </TableCell>
                        <TableCell sx={tableHeaderStyle}>Partido</TableCell>
                        <TableCell sx={tableHeaderStyle}>Pacto</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {candidates
                        .sort((a, b) => b.votes - a.votes)
                        .map((candidate) => {
                          const party = partyMap.get(candidate.party_id);
                          const pactLetter = party ? party.list_id : "X";
                          const pact = pactMap.get(pactLetter);
                          const pactName = pact ? pact.name : "Indep.";

                          const displayValue =
                            dataType === "real"
                              ? `${candidate.percentage}%`
                              : `${candidate.votes.toFixed(1)}%`;
                          const realVotesLabel =
                            dataType === "real"
                              ? formatNumber(candidate.votes)
                              : null;

                          // Color de la letra del pacto
                          const pactBg =
                            theme.palette.pactColors?.[pactLetter] ||
                            theme.palette.pactColors.default;

                          return (
                            <TableRow key={candidate._id} hover>
                              <TableCell sx={tableCellStyle}>
                                <Stack
                                  direction="row"
                                  spacing={2}
                                  alignItems="center">
                                  {/* --- AVATAR / FOTO DEL CANDIDATO --- */}
                                  <Avatar
                                    alt={candidate.name}
                                    src={candidate.photo_url}
                                    sx={{
                                      width: 44,
                                      height: 44,
                                      border: "1px solid #e0e0e0",
                                    }}>
                                    {!candidate.photo_url && <PersonIcon />}
                                  </Avatar>

                                  <Typography variant="body2" fontWeight={600}>
                                    {candidate.name}
                                  </Typography>
                                </Stack>
                              </TableCell>
                              <TableCell sx={tableCellStyle}>
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  sx={{ fontFamily: "monospace" }}>
                                  {displayValue}
                                </Typography>
                                {realVotesLabel && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary">
                                    {realVotesLabel} votos
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell sx={tableCellStyle}>
                                <Chip
                                  label={
                                    party ? party.name : candidate.party_id
                                  }
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    height: 24,
                                    fontSize: "0.75rem",
                                    border: "1px solid #dee2e6",
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={tableCellStyle}>
                                <Stack
                                  direction="row"
                                  spacing={1.5}
                                  alignItems="center">
                                  {/* CAJA RESALTADA DEL PACTO */}
                                  <Box
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: 1,
                                      bgcolor: pactBg,
                                      color: "#fff",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontWeight: "bold",
                                      fontSize: "0.95rem",
                                      textShadow: "0px 1px 2px rgba(0,0,0,0.3)",
                                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                    }}>
                                    {pactLetter}
                                  </Box>

                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      lineHeight: 1.2,
                                      whiteSpace: "normal",
                                    }}>
                                    {pactName}
                                  </Typography>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          )}

          {/* 2. TABLA RESULTADOS */}
          {!isLoading && !isSimulating && currentSeats !== null && (
            <Grid item xs={12} sx={{ p: 0 }}>
              <Paper
                sx={{
                  borderTop: `4px solid ${
                    dataType === "real" ? "#198754" : "#0d6efd"
                  }`,
                }}>
                <Box
                  sx={{
                    px: 3,
                    py: 2,
                    borderBottom: "1px solid #dee2e6",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    bgcolor: "#f8f9fa",
                  }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <EmojiEventsIcon color={themeColor} />
                    <Typography variant="h6">Resultados por Pacto</Typography>
                  </Stack>
                  <Chip
                    label={`${currentSeats} Escaños`}
                    color={themeColor}
                    sx={{ fontWeight: "bold" }}
                  />
                </Box>

                <TableContainer>
                  <Table sx={{ width: "100%", tableLayout: "fixed" }}>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          width="50px"
                          sx={tableHeaderStyle}></TableCell>
                        <TableCell sx={tableHeaderStyle}>Pacto</TableCell>
                        <TableCell align="center" sx={tableHeaderStyle}>
                          Votos
                        </TableCell>
                        <TableCell align="center" sx={tableHeaderStyle}>
                          Escaños
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pactResults.map((pact) => {
                        const isOpen = openPacts.has(pact.pactId);
                        const hasParties = pact.parties?.length > 0;
                        const pactColor =
                          theme.palette.pactColors?.[pact.pactId] ||
                          theme.palette.pactColors.default;

                        return (
                          <Fragment key={pact.pactId}>
                            <TableRow
                              sx={{
                                bgcolor: pact.seats > 0 ? "#fff" : "#fafafa",
                                borderLeft: `5px solid ${pactColor}`,
                                borderBottom: isOpen
                                  ? "none"
                                  : "1px solid #e9ecef",
                              }}>
                              <TableCell>
                                {hasParties && (
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleTogglePact(pact.pactId)
                                    }>
                                    {isOpen ? (
                                      <KeyboardArrowUpIcon fontSize="small" />
                                    ) : (
                                      <KeyboardArrowDownIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                )}
                              </TableCell>
                              <TableCell sx={tableCellStyle}>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 700,
                                    whiteSpace: "normal",
                                    lineHeight: 1.3,
                                  }}>
                                  {pact.pactName}
                                </Typography>
                              </TableCell>
                              <TableCell align="center" sx={tableCellStyle}>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  sx={{ fontFamily: "monospace" }}>
                                  {dataType === "real"
                                    ? formatNumber(pact.pactVotes)
                                    : `${pact.pactVotes.toFixed(1)}%`}
                                </Typography>
                              </TableCell>
                              <TableCell align="center" sx={tableCellStyle}>
                                {pact.seats > 0 ? (
                                  <Avatar
                                    sx={{
                                      bgcolor: "#212529",
                                      color: "#fff",
                                      width: 28,
                                      height: 28,
                                      fontSize: "0.85rem",
                                      fontWeight: "bold",
                                      mx: "auto",
                                    }}>
                                    {pact.seats}
                                  </Avatar>
                                ) : (
                                  <Typography color="text.secondary">
                                    -
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>

                            {/* --- DETALLE DESPLEGABLE --- */}
                            <TableRow>
                              <TableCell
                                style={{ padding: 0, border: 0 }}
                                colSpan={4}>
                                <Collapse
                                  in={isOpen}
                                  timeout="auto"
                                  unmountOnExit>
                                  <Box
                                    sx={{
                                      p: 3,
                                      bgcolor: "#f8f9fa",
                                      borderBottom: "1px solid #dee2e6",
                                    }}>
                                    {/* --- FILA 1: CANDIDATOS ELECTOS --- */}
                                    <Box sx={{ mb: 4 }}>
                                      <Typography
                                        variant="overline"
                                        fontWeight={700}
                                        color={
                                          themeColor === "success"
                                            ? "success.main"
                                            : "primary.main"
                                        }
                                        display="block"
                                        mb={2}
                                        sx={{ fontSize: "0.85rem" }}>
                                        ★ Candidatos Electos (
                                        {pact.elected.length})
                                      </Typography>

                                      <Grid container spacing={2}>
                                        {pact.elected.length > 0 ? (
                                          pact.elected.map((c) => (
                                            <Grid
                                              item
                                              xs={12}
                                              sm={6}
                                              md={3}
                                              key={c._id}>
                                              <Paper
                                                elevation={0}
                                                variant="outlined"
                                                sx={{
                                                  p: 1.5,
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 2,
                                                  bgcolor: "#fff",
                                                  borderColor:
                                                    themeColor === "success"
                                                      ? "#a5d6a7"
                                                      : "#90caf9",
                                                  transition: "0.2s",
                                                  "&:hover": {
                                                    boxShadow:
                                                      "0 4px 12px rgba(0,0,0,0.08)",
                                                  },
                                                }}>
                                                <Avatar
                                                  alt={c.name}
                                                  src={c.photo_url}
                                                  sx={{
                                                    width: 50,
                                                    height: 50,
                                                    border: "1px solid #eee",
                                                  }}>
                                                  {!c.photo_url && (
                                                    <PersonIcon />
                                                  )}
                                                </Avatar>
                                                <Box sx={{ minWidth: 0 }}>
                                                  <Typography
                                                    variant="subtitle2"
                                                    lineHeight={1.1}
                                                    fontWeight={700}
                                                    noWrap
                                                    title={c.name}>
                                                    {c.name}
                                                  </Typography>
                                                  <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    display="block">
                                                    {dataType === "real"
                                                      ? c.percentage + "%"
                                                      : formatNumber(c.votes) +
                                                        " votos"}
                                                  </Typography>
                                                </Box>
                                              </Paper>
                                            </Grid>
                                          ))
                                        ) : (
                                          <Grid item xs={12}>
                                            <Typography
                                              variant="body2"
                                              color="text.secondary"
                                              fontStyle="italic">
                                              No hay candidatos electos en este
                                              pacto.
                                            </Typography>
                                          </Grid>
                                        )}
                                      </Grid>
                                    </Box>

                                    {/* --- FILA 2: DESGLOSE Y APORTE --- */}
                                    <Grid container spacing={4}>
                                      {/* COLUMNA IZQ: PARTIDOS */}
                                      <Grid
                                        item
                                        xs={12}
                                        md={pact.incentive > 0 ? 6 : 12}>
                                        <Typography
                                          variant="overline"
                                          fontWeight={700}
                                          color="text.secondary"
                                          display="block"
                                          mb={1}>
                                          Desglose por Partidos
                                        </Typography>
                                        <Paper
                                          elevation={0}
                                          variant="outlined"
                                          sx={{ bgcolor: "#fff" }}>
                                          {pact.parties.map((party, i) => (
                                            <Box
                                              key={party._id}
                                              sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                p: 1.5,
                                                borderBottom:
                                                  i !== pact.parties.length - 1
                                                    ? "1px solid #f1f3f5"
                                                    : "none",
                                              }}>
                                              <Typography variant="body2">
                                                {party.name}
                                              </Typography>
                                              <Typography
                                                variant="body2"
                                                fontWeight={600}
                                                sx={{
                                                  fontFamily: "monospace",
                                                }}>
                                                {dataType === "real"
                                                  ? formatNumber(party.votes)
                                                  : `${party.votes.toFixed(
                                                      1
                                                    )}%`}
                                              </Typography>
                                            </Box>
                                          ))}
                                        </Paper>
                                      </Grid>

                                      {/* COLUMNA DER: INCENTIVO */}
                                      {pact.incentive > 0 && (
                                        <Grid item xs={12} md={6}>
                                          <Stack
                                            direction="row"
                                            alignItems="center"
                                            spacing={1}
                                            mb={1}>
                                            <Typography
                                              variant="overline"
                                              fontWeight={700}
                                              color="text.secondary">
                                              Incentivo Fiscal
                                            </Typography>
                                            <Tooltip title="500 UF por candidata electa">
                                              <InfoOutlinedIcon
                                                fontSize="small"
                                                color="disabled"
                                              />
                                            </Tooltip>
                                          </Stack>
                                          <Paper
                                            elevation={0}
                                            variant="outlined"
                                            sx={{
                                              bgcolor: "#fff",
                                              overflow: "hidden",
                                            }}>
                                            <Box
                                              sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                p: 2,
                                                bgcolor: "#d1e7dd",
                                              }}>
                                              <Typography
                                                variant="body2"
                                                fontWeight="bold"
                                                color="success.main">
                                                TOTAL PACTO
                                              </Typography>
                                              <Typography
                                                variant="body2"
                                                fontWeight="bold"
                                                color="success.main">
                                                {pact.incentive.toLocaleString(
                                                  "es-CL"
                                                )}{" "}
                                                UF
                                              </Typography>
                                            </Box>
                                            <Box sx={{ p: 2 }}>
                                              {pact.parties
                                                .filter((p) => p.incentive > 0)
                                                .map((p) => (
                                                  <Box
                                                    key={p._id}
                                                    sx={{
                                                      display: "flex",
                                                      justifyContent:
                                                        "space-between",
                                                      mb: 1,
                                                    }}>
                                                    <Typography variant="caption">
                                                      {p.name}
                                                    </Typography>
                                                    <Typography
                                                      variant="caption"
                                                      fontWeight={600}>
                                                      {p.incentive.toLocaleString(
                                                        "es-CL"
                                                      )}{" "}
                                                      UF
                                                    </Typography>
                                                  </Box>
                                                ))}
                                            </Box>
                                          </Paper>
                                        </Grid>
                                      )}
                                    </Grid>
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          )}
        </Grid>

        {!isLoading && !isSimulating && candidates.length === 0 && !error && (
          <Paper
            sx={{ p: 4, textAlign: "center", mt: 4, borderStyle: "dashed" }}>
            <Typography color="text.secondary">
              Sin datos para mostrar.
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
