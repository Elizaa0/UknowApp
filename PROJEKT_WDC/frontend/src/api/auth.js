import axios from "axios";

const BASE_URL = "http://localhost:8000/api/users/";

export const login = async (username, password) => {
  const response = await axios.post(`${BASE_URL}login/`, {
    username,
    password
  });
  return response.data;
};
