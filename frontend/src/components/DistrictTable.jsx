import React, { useState } from "react";
import {
  Paper,
  Box,
  Typography,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Avatar,
  Alert,
  IconButton,
  Collapse,
  Grid,
  Tooltip,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

const INCENTIVE_PER_WOMAN = 500;

const CandidatesListTable = ({ candidates, pactNames = {}, pactColors }) => (
  <TableContainer>
    <Table sx={{ width: "100%", tableLayout: "fixed" }}>
      <TableHead>
        <TableRow sx={{ bgcolor: "#f8f9fa" }}>
          <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>
            Candidato
          </TableCell>
          <TableCell
            sx={{ fontWeight: "bold", color: "text.secondary" }}
            align="right">
            Votos
          </TableCell>
          <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>
            Partido
          </TableCell>
          <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>
            Pacto
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {candidates.map((c) => {
          const pactFullName = pactNames[c.pact_id] || `Lista ${c.pact_id}`;
          const pColor = pactColors[c.pact_id] || "#ccc";

          return (
            <TableRow key={c.name} hover>
              <TableCell>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={c.photo_url}
                    sx={{ width: 40, height: 40, border: "1px solid #eee" }}>
                    <PersonIcon />
                  </Avatar>
                  <Typography variant="body2" fontWeight={600}>
                    {c.name}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align="right">
                <Typography
                  variant="body2"
                  fontWeight={700}
                  fontFamily="monospace">
                  {c.votes?.toLocaleString("es-CL")}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip label={c.display_party} size="small" variant="outlined" />
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      bgcolor: pColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                    }}>
                    {c.pact_id}
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    lineHeight={1.2}>
                    {pactFullName}
                  </Typography>
                </Stack>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);

const ResultsAccordion = ({ candidates, pactColors, pactNames }) => {
  const pactsGrouped = candidates.reduce((acc, c) => {
    if (!acc[c.pact_id]) {
      acc[c.pact_id] = { id: c.pact_id, candidates: [], votes: 0, women: 0 };
    }
    acc[c.pact_id].candidates.push(c);
    acc[c.pact_id].votes += c.votes;
    if (c.gender === "M") acc[c.pact_id].women += 1;
    return acc;
  }, {});

  const [openPacts, setOpenPacts] = useState({});

  const togglePact = (id) => {
    setOpenPacts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "#f8f9fa" }}>
            <TableCell width={50} />
            <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>
              Pacto
            </TableCell>
            <TableCell
              sx={{ fontWeight: "bold", color: "text.secondary" }}
              align="right">
              Votos Totales
            </TableCell>
            <TableCell
              sx={{ fontWeight: "bold", color: "text.secondary" }}
              align="right">
              Escaños
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.values(pactsGrouped).map((pact) => {
            const isOpen = openPacts[pact.id];
            const color = pactColors[pact.id] || "#999";
            const incentiveTotal = pact.women * INCENTIVE_PER_WOMAN;
            const pactName = pactNames[pact.id] || `Lista ${pact.id}`;

            return (
              <React.Fragment key={pact.id}>
                <TableRow
                  sx={{
                    "& > *": { borderBottom: "unset" },
                    borderLeft: `6px solid ${color}`,
                  }}>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => togglePact(pact.id)}>
                      {isOpen ? (
                        <KeyboardArrowUpIcon />
                      ) : (
                        <KeyboardArrowDownIcon />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell component="th" scope="row">
                    <Typography variant="subtitle2" fontWeight={700}>
                      {pactName}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {pact.votes.toLocaleString("es-CL")}
                  </TableCell>
                  <TableCell align="right">
                    <Avatar
                      sx={{
                        bgcolor: "#333",
                        width: 24,
                        height: 24,
                        fontSize: 12,
                        ml: "auto",
                      }}>
                      {pact.candidates.length}
                    </Avatar>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                    colSpan={6}>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 2 }}>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          gutterBottom
                          component="div"
                          sx={{ mb: 2 }}>
                          DIPUTADOS ELECTOS
                        </Typography>

                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          {pact.candidates.map((c) => (
                            <Grid item xs={12} sm={6} md={4} key={c.name}>
                              <Paper
                                variant="outlined"
                                sx={{
                                  p: 1.5,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                }}>
                                <Avatar src={c.photo_url} />
                                <Box>
                                  <Typography
                                    variant="body2"
                                    fontWeight={700}
                                    lineHeight={1.2}>
                                    {c.name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary">
                                    {c.display_party} •{" "}
                                    {c.votes.toLocaleString("es-CL")} %
                                  </Typography>
                                </Box>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                        {incentiveTotal > 0 && (
                          <Paper
                            variant="outlined"
                            sx={{ bgcolor: "#f0f9ff", borderColor: "#b3e5fc" }}>
                            <Box
                              sx={{
                                p: 2,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center">
                                <InfoOutlinedIcon
                                  color="info"
                                  fontSize="small"
                                />
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color="primary.main">
                                  Incentivo Fiscal (Mujeres Electas)
                                </Typography>
                              </Stack>
                              <Typography
                                variant="h6"
                                fontWeight={800}
                                color="primary.main">
                                {incentiveTotal.toLocaleString("es-CL")} UF
                              </Typography>
                            </Box>
                            <Box sx={{ px: 2, pb: 2 }}>
                              {pact.candidates
                                .filter((c) => c.gender === "M")
                                .map((c) => (
                                  <Box
                                    key={c.name}
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      borderTop: "1px solid #e1f5fe",
                                      py: 0.5,
                                    }}>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary">
                                      {c.name} ({c.display_party})
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      fontWeight="bold">
                                      + 500 UF
                                    </Typography>
                                  </Box>
                                ))}
                            </Box>
                          </Paper>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default function DistrictTable({
  candidates,
  isLoading,
  title = "Resultados",
  isElectedMode = false,
  pactColors = {},
  pactNames = {},
}) {
  if (!candidates || candidates.length === 0) {
    if (isLoading) return null;
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No hay datos para mostrar en esta sección.
      </Alert>
    );
  }

  return (
    <Paper sx={{ overflow: "hidden", mt: 0 }}>
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: "#f8f9fa",
          borderBottom: "1px solid #dee2e6",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {isElectedMode ? (
            <EmojiEventsIcon color="primary" />
          ) : (
            <GroupIcon color="action" />
          )}
          <Typography variant="h6" fontSize="1rem" fontWeight={700}>
            {title}
          </Typography>
        </Stack>
        <Chip
          label={`${candidates.length} ${
            isElectedMode ? "Electos" : "Registros"
          }`}
          size="small"
          color={isElectedMode ? "primary" : "default"}
        />
      </Box>
      {isElectedMode ? (
        <ResultsAccordion
          candidates={candidates}
          pactColors={pactColors}
          pactNames={pactNames}
        />
      ) : (
        <CandidatesListTable
          candidates={candidates}
          pactNames={pactNames}
          pactColors={pactColors}
        />
      )}
    </Paper>
  );
}
