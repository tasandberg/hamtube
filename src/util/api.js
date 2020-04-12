import axios from "axios";
const API_BASE = process.env.API_BASE;

export const apiClient = axios.create({
  baseURL: API_BASE,
});

export const newChat = () => {
  return apiClient.get("/chat/new");
};
