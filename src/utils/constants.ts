import { environment } from "../config";

export const baseUrl =
  environment === "local"
    ? "http://localhost:3001"
    : "https://https://github.com/ganwee/k6-typescript-template";

export const microServices = {
  swap: "/swap-api",
};
