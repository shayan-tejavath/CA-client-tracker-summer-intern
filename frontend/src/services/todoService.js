import api from "./api";

const BASE_URL = "/todos";

export const getTodos = async (params = {}) => {
  const response = await api.get(BASE_URL, { params });
  return response.data;
};

export const getTodoById = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response.data;
};

export const createTodo = async (todoData) => {
  const response = await api.post(BASE_URL, todoData);
  return response.data;
};

export const updateTodo = async (id, todoData) => {
  const response = await api.put(`${BASE_URL}/${id}`, todoData);
  return response.data;
};

export const toggleTodoStatus = async (id) => {
  const response = await api.patch(`${BASE_URL}/${id}/toggle`);
  return response.data;
};

export const deleteTodo = async (id) => {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response.data;
};

export default {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  toggleTodoStatus,
  deleteTodo,
};