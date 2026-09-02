import { io } from "socket.io-client";

const rawUrl = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in";
const SOCKET_URL = rawUrl.replace(/\/api\/?$/, "");

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});