import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send the httpOnly JWT cookie
});

export function getErrorMessage(err) {
  const data = err?.response?.data;
  return data?.details?.[0]?.message || data?.error || err?.message || 'Something went wrong';
}
