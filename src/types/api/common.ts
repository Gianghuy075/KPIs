export type UUID = string;
export type ApiNumber = number | string;

export interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  [key: string]: unknown;
}

export interface ApiMetaState<TData> {
  data: TData;
  loading: boolean;
  error: string;
  reload: () => void;
}
