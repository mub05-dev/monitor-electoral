import { axios } from "../config";

const getAllCandidates = async (district, type = "simulacion") => {
  const response = await axios.get("candidatos", {
    params: {
      distrito: district,
      tipo: type,
    },
  });
  return response;
};

const getDhondtResults = async (distrito, type = "simulacion") => {
  const response = await axios.get("dhondt", {
    params: {
      distrito,
      tipo: type,
    },
  });
  return response;
};

const getNacionalResults = async (tipo, escenario = "") => {
  const params = {};
  if (tipo) params.tipo = tipo;
  if (escenario) params.escenario = escenario;

  const response = await axios.get("nacional", { params });
  return response;
};

const getNacionalStats = async () => {
  const response = await axios.get("stats/genero");
  return response;
};

const login = async (username, password) => {
  const response = await axios.post("login", { username, password });
  return response;
};

export {
  getAllCandidates,
  getDhondtResults,
  getNacionalResults,
  getNacionalStats,
  login,
};
