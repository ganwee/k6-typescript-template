import { baseUrl, microServices } from "./constants";
import { environment } from "../config";
import { objToQueryString } from "./helpers";
import { GetFirmQuoteDto } from "../dtos/swap-api/firmQuote.dto";

export enum GetEndpoints {
  ORDERBOOK = "orderbook",
  FIRM_QUOTE = "firmQuote",
}
export enum PostEndpoints {
  VERIFY_SETTLEMENT = "verifySettlement",
}

const flag = environment === "local" ? true : false;

export const api = {
  get: {
    orderbook: (data: string): string =>
      flag
        ? `${baseUrl}/v1/orderbook${objToQueryString(data)}`
        : `${baseUrl}${microServices.swap}/v1/orderbook${objToQueryString(
            data
          )}`,
    firmQuote: (data: GetFirmQuoteDto): string =>
      flag
        ? `${baseUrl}/v1/firm-quote${objToQueryString(data)}`
        : `${baseUrl}${microServices.swap}/v1/firm-quote${objToQueryString(
            data
          )}`,
  },
  post: {
    verifySettlement: (): string =>
      flag
        ? `${baseUrl}/v1/lend/verify-settlement`
        : `${baseUrl}${microServices.swap}/v1/lend/verify-settlement`,
  },
};
