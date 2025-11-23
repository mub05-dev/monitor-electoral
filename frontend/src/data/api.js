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

const getNacionalResults = async (tipo) => {
  const response = await axios.get("nacional");
  return response;
};

export { getAllCandidates, getDhondtResults, getNacionalResults };
