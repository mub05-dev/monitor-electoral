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
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const INCENTIVE_PER_WOMAN = 500;
const formatNumber = (num) => new Intl.NumberFormat("es-CL").format(num);

const CandidatesListTable = ({ candidates, pactNames, pactColors }) => (
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
            Preferencia
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
          const pactFullName =
            pactNames && pactNames[c.pact_id]
              ? pactNames[c.pact_id]
              : `Lista ${c.pact_id}`;
          const color = pactColors[c.pact_id] || "#999";

          return (
            <TableRow key={c._id} hover selected={c.isElected}>
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
                <Box>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    fontFamily="monospace">
                    {c.percentage}%
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block">
                    {formatNumber(c.votes)} votos
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip label={c.display_party} size="small" variant="outlined" />
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1,
                      bgcolor: color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      color: "white",
                      fontWeight: "bold",
                    }}>
                    {c.pact_id}
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={500}
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

const ResultsAccordion = ({ pactResults, pactColors }) => {
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
              Votación Total
            </TableCell>
            <TableCell
              sx={{ fontWeight: "bold", color: "text.secondary" }}
              align="right">
              Escaños
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pactResults.map((p) => {
            const isOpen = openPacts[p.pactId];
            const color = pactColors[p.pactId] || "#999";

            return (
              <React.Fragment key={p.pactId}>
                <TableRow
                  sx={{
                    "& > *": { borderBottom: "unset" },
                    borderLeft: `6px solid ${color}`,
                  }}>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => togglePact(p.pactId)}>
                      {isOpen ? (
                        <KeyboardArrowUpIcon />
                      ) : (
                        <KeyboardArrowDownIcon />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell component="th" scope="row">
                    <Typography variant="subtitle2" fontWeight={700}>
                      {p.pactName}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {formatNumber(p.pactVotes)}
                  </TableCell>
                  <TableCell align="right">
                    {p.seats > 0 ? (
                      <Avatar
                        sx={{
                          bgcolor: "#333",
                          width: 24,
                          height: 24,
                          fontSize: 12,
                          ml: "auto",
                        }}>
                        {p.seats}
                      </Avatar>
                    ) : (
                      <Typography color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                    colSpan={6}>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 2 }}>
                        {p.elected.length > 0 && (
                          <>
                            <Typography
                              variant="caption"
                              fontWeight={700}
                              gutterBottom
                              component="div"
                              sx={{
                                mb: 2,
                                color: "text.secondary",
                                letterSpacing: 1,
                              }}>
                              DIPUTADOS ELECTOS
                            </Typography>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                              {p.elected.map((c) => (
                                <Grid item xs={12} sm={6} md={4} key={c.name}>
                                  <Paper
                                    variant="outlined"
                                    sx={{
                                      p: 1.5,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 2,
                                      bgcolor: "#fff",
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
                                        {c.display_party} • {c.percentage}%
                                      </Typography>
                                    </Box>
                                    <Chip
                                      label="Electo"
                                      size="small"
                                      color="success"
                                      sx={{
                                        ml: "auto",
                                        height: 20,
                                        fontSize: "0.65rem",
                                      }}
                                    />
                                  </Paper>
                                </Grid>
                              ))}
                            </Grid>
                          </>
                        )}

                        <Grid container spacing={4}>
                          <Grid item xs={12} md={p.incentive > 0 ? 6 : 12}>
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
                                  <Typography variant="body2" fontWeight={600}>
                                    {formatNumber(py.votes)}
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
                                <Tooltip title="500 UF por mujer electa">
                                  <InfoOutlinedIcon
                                    fontSize="small"
                                    color="disabled"
                                  />
                                </Tooltip>
                              </Stack>
                              <Paper variant="outlined">
                                <Box
                                  sx={{
                                    p: 2,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
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
                                    {formatNumber(p.incentive)} UF
                                  </Typography>
                                </Box>
                                {p.parties
                                  .filter((py) => py.incentive > 0)
                                  .map((py) => (
                                    <Box
                                      key={py._id}
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        p: 1.5,
                                        borderBottom: "1px solid #eee",
                                      }}>
                                      <Typography variant="caption">
                                        {py.name}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        fontWeight={600}>
                                        + {formatNumber(py.incentive)} UF
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
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default function RealDistrictTable({
  candidates,
  pactResults,
  isLoading,
  title = "Resultados",
  isElectedMode = false,
  pactColors = {},
  pactNames = {},
}) {
  if (isLoading) return null;
  if (!candidates || candidates.length === 0) {
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
          <Typography variant="h6" fontSize="1rem" fontWeight={700}>
            {title}
          </Typography>
        </Stack>
      </Box>
      {isElectedMode ? (
        <ResultsAccordion pactResults={pactResults} pactColors={pactColors} />
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
