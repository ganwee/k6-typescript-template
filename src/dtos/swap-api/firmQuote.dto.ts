import { AggregatorSource } from "../../utils/enums";

export interface GetFirmQuoteDto {
  chainId?: string;
  source?: AggregatorSource
}
