import axios from 'axios';

const API_BASE = 'https://2hul9eqipg.execute-api.us-east-1.amazonaws.com';

export const submitTrade = async (message, sessionId) => {
  const response = await axios.post(`${API_BASE}/trade`, {
    message,
    session_id: sessionId
  });
  return response.data;
};

export const pollStatus = async (requestId) => {
  const response = await axios.get(`${API_BASE}/status/${requestId}`);
  return response.data;
};

export const getTrades = async () => {
  const response = await axios.get(`${API_BASE}/trades`);
  return response.data;
};

export const getPositions = async () => {
  const response = await axios.get(`${API_BASE}/positions`);
  return response.data;
};