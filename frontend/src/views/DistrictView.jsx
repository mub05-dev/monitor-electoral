import React, { useState, useEffect, useMemo, Fragment } from 'react';
import {
  Grid,
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Typography,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Collapse,
  Tooltip,
} from "@mui/material";
import CalculateIcon from "@mui/icons-material/Calculate";
import GroupIcon from "@mui/icons-material/Group";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonIcon from "@mui/icons-material/Person";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { getAllCandidates, getDhondtResults } from "../data/api";
import { distritosData } from "../const/distritos";

const INCENTIVE_PER_WOMAN = 500;

// Estilos
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

export default function DistrictView({ dataType, pactColors }) {
  const [district, setDistrict] = useState("10");
  const [candidates, setCandidates] = useState([]);
  const [parties, setParties] = useState([]);
  const [pacts, setPacts] = useState([]);
  const [electedCandidates, setElectedCandidates] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState(null);

  const [currentSeats, setCurrentSeats] = useState(null);
  const [openPacts, setOpenPacts] = useState(new Set());
  const [incentiveData, setIncentiveData] = useState({
    pacts: new Map(),
    parties: new Map(),
  });

  const themeColor = dataType === "real" ? "success" : "primary";
  const formatNumber = (num) => new Intl.NumberFormat("es-CL").format(num);

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
        setCandidates(response.data.candidates || []);
        setParties(response.data.parties || []);
        setPacts(response.data.pacts || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCandidates();
  }, [district, dataType]);

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

  const handleSimulation = async () => {
    setIsSimulating(true);
    setSimulationError(null);
    try {
      const response = await getDhondtResults(district, dataType);
      setElectedCandidates(response.data.elected || []);
      setCurrentSeats(response.data.cupos_distrito || 0);

      const iPacts = new Map();
      const iParties = new Map();
      (response.data.elected || []).forEach((c) => {
        if (c.gender === "M") {
          const party = partyMap.get(c.party_id);
          if (party) {
            iPacts.set(
              party.list_id,
              (iPacts.get(party.list_id) || 0) + INCENTIVE_PER_WOMAN
            );
            iParties.set(
              party._id,
              (iParties.get(party._id) || 0) + INCENTIVE_PER_WOMAN
            );
          }
        }
      });
      setIncentiveData({ pacts: iPacts, parties: iParties });
    } catch (err) {
      setSimulationError(err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const pactResults = useMemo(() => {
    const electMap = new Map();
    electedCandidates.forEach((c) => {
      const party = partyMap.get(c.party_id);
      if (party) {
        if (!electMap.has(party.list_id)) electMap.set(party.list_id, []);
        electMap.get(party.list_id).push(c);
      }
    });

    // Agrupar partidos por pacto
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
        incentive: incentiveData.pacts.get(p._id) || 0,
        parties: (partiesByPact.get(p._id) || [])
          .map((pt) => ({
            ...pt,
            incentive: incentiveData.parties.get(pt._id) || 0,
          }))
          .sort((a, b) => b.votes - a.votes),
      }))
      .sort((a, b) => b.pactVotes - a.pactVotes);
  }, [pacts, electedCandidates, parties, partyMap, incentiveData]);

  const handleTogglePact = (id) => {
    setOpenPacts((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <Box>
      <Paper sx={{ mb: 4, p: 0 }}>
        <Grid container>
          <Grid
            item
            xs={12}
            sx={{
              bgcolor: "#f8f9fa",
              p: 2,
              display: "flex",
              gap: 2,
              alignItems: "center",
            }}>
            <FormControl fullWidth size="small" sx={{ bgcolor: "white" }}>
              <InputLabel>Seleccionar Distrito</InputLabel>
              <Select
                value={district}
                label="Seleccionar Distrito"
                onChange={(e) => setDistrict(e.target.value)}>
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

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress />
        </Box>
      )}

      <Grid container spacing={3}>
        {!isLoading && candidates.length > 0 && (
          <Grid item xs={12}>
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
                        {dataType === "real" ? "Preferencia" : "Votos"}
                      </TableCell>
                      <TableCell sx={tableHeaderStyle}>Partido</TableCell>
                      <TableCell sx={tableHeaderStyle}>Pacto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {candidates
                      .sort((a, b) => b.votes - a.votes)
                      .map((c) => {
                        const party = partyMap.get(c.party_id);
                        const pLetter = party ? party.list_id : "X";
                        const pName = pactMap.get(pLetter)?.name || "Indep.";
                        const pColor = pactColors[pLetter] || "#ccc";

                        return (
                          <TableRow key={c._id} hover>
                            <TableCell sx={tableCellStyle}>
                              <Stack
                                direction="row"
                                spacing={2}
                                alignItems="center">
                                <Avatar
                                  alt={c.name}
                                  src={c.photo_url}
                                  sx={{
                                    width: 44,
                                    height: 44,
                                    border: "1px solid #e0e0e0",
                                  }}>
                                  {!c.photo_url && <PersonIcon />}
                                </Avatar>
                                <Typography variant="body2" fontWeight={600}>
                                  {c.name}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell sx={tableCellStyle}>
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                fontFamily="monospace">
                                {dataType === "real"
                                  ? `${c.percentage}%`
                                  : c.votes.toFixed(1)}
                              </Typography>
                              {dataType === "real" && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary">
                                  {formatNumber(c.votes)} votos
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={tableCellStyle}>
                              <Chip
                                label={c.display_party || party?.name}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell sx={tableCellStyle}>
                              <Stack
                                direction="row"
                                spacing={1.5}
                                alignItems="center">
                                <Box
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 1,
                                    bgcolor: pColor,
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: "bold",
                                  }}>
                                  {pLetter}
                                </Box>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  lineHeight={1.2}>
                                  {pName}
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

        {!isLoading && currentSeats !== null && (
          <Grid item xs={12}>
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
                      <TableCell width="50px" sx={tableHeaderStyle}></TableCell>
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
                    {pactResults.map((p) => {
                      const isOpen = openPacts.has(p.pactId);
                      const color = pactColors[p.pactId] || "#ccc";
                      return (
                        <Fragment key={p.pactId}>
                          <TableRow
                            sx={{
                              bgcolor: p.seats > 0 ? "#fff" : "#fafafa",
                              borderLeft: `5px solid ${color}`,
                              borderBottom: isOpen
                                ? "none"
                                : "1px solid #e9ecef",
                            }}>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleTogglePact(p.pactId)}>
                                {isOpen ? (
                                  <KeyboardArrowUpIcon />
                                ) : (
                                  <KeyboardArrowDownIcon />
                                )}
                              </IconButton>
                            </TableCell>
                            <TableCell sx={tableCellStyle}>
                              <Typography variant="subtitle2" fontWeight={700}>
                                {p.pactName}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={tableCellStyle}>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                fontFamily="monospace">
                                {dataType === "real"
                                  ? formatNumber(p.pactVotes)
                                  : p.pactVotes.toFixed(1)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={tableCellStyle}>
                              {p.seats > 0 ? (
                                <Avatar
                                  sx={{
                                    bgcolor: "#212529",
                                    width: 28,
                                    height: 28,
                                    fontSize: "0.85rem",
                                    fontWeight: "bold",
                                    mx: "auto",
                                  }}>
                                  {p.seats}
                                </Avatar>
                              ) : (
                                <Typography color="text.secondary">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
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
                                  {p.elected.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                      <Typography
                                        variant="overline"
                                        fontWeight={700}
                                        display="block"
                                        mb={2}>
                                        ★ Candidatos Electos ({p.elected.length}
                                        )
                                      </Typography>
                                      <Grid container spacing={2}>
                                        {p.elected.map((c) => (
                                          <Grid
                                            item
                                            xs={12}
                                            sm={6}
                                            md={4}
                                            key={c._id}>
                                            <Paper
                                              variant="outlined"
                                              sx={{
                                                p: 1.5,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 2,
                                                bgcolor: "#fff",
                                              }}>
                                              <Avatar
                                                src={c.photo_url}
                                                sx={{ width: 50, height: 50 }}
                                              />
                                              <Box>
                                                <Typography
                                                  variant="subtitle2"
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
                                                    ? `${c.percentage}%`
                                                    : `${formatNumber(
                                                        c.votes
                                                      )} votos`}
                                                </Typography>
                                                <Chip
                                                  label="Electo"
                                                  size="small"
                                                  color={themeColor}
                                                  sx={{
                                                    height: 18,
                                                    fontSize: "0.65rem",
                                                    mt: 0.5,
                                                  }}
                                                />
                                              </Box>
                                            </Paper>
                                          </Grid>
                                        ))}
                                      </Grid>
                                    </Box>
                                  )}
                                  <Grid container spacing={4}>
                                    <Grid
                                      item
                                      xs={12}
                                      md={p.incentive > 0 ? 6 : 12}>
                                      <Typography
                                        variant="overline"
                                        fontWeight={700}
                                        color="text.secondary"
                                        mb={1}
                                        display="block">
                                        Desglose por Partidos
                                      </Typography>
                                      <Paper variant="outlined">
                                        {p.parties.map((py) => (
                                          <Box
                                            key={py._id}
                                            sx={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                              p: 1.5,
                                              borderBottom: "1px solid #f0f0f0",
                                            }}>
                                            <Typography variant="body2">
                                              {py.name}
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              fontWeight={600}>
                                              {dataType === "real"
                                                ? formatNumber(py.votes)
                                                : py.votes.toFixed(1)}
                                            </Typography>
                                          </Box>
                                        ))}
                                      </Paper>
                                    </Grid>
                                    {p.incentive > 0 && (
                                      <Grid item xs={12} md={6}>
                                        <Stack
                                          direction="row"
                                          spacing={1}
                                          alignItems="center"
                                          mb={1}>
                                          <Typography
                                            variant="overline"
                                            fontWeight={700}
                                            color="text.secondary">
                                            Incentivo Fiscal
                                          </Typography>
                                          <Tooltip title="500 UF">
                                            <InfoOutlinedIcon
                                              fontSize="small"
                                              color="disabled"
                                            />
                                          </Tooltip>
                                        </Stack>
                                        <Paper variant="outlined">
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
                                              TOTAL
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              fontWeight="bold"
                                              color="success.main">
                                              {p.incentive.toLocaleString(
                                                "es-CL"
                                              )}{" "}
                                              UF
                                            </Typography>
                                          </Box>
                                          {p.parties
                                            .filter((py) => py.incentive > 0)
                                            .map((py) => (
                                              <Box
                                                key={py._id}
                                                sx={{
                                                  display: "flex",
                                                  justifyContent:
                                                    "space-between",
                                                  p: 1.5,
                                                }}>
                                                <Typography variant="caption">
                                                  {py.name}
                                                </Typography>
                                                <Typography
                                                  variant="caption"
                                                  fontWeight={600}>
                                                  {py.incentive.toLocaleString(
                                                    "es-CL"
                                                  )}{" "}
                                                  UF
                                                </Typography>
                                              </Box>
                                            ))}
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
    </Box>
  );
}
