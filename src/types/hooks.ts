export interface DataHookState<TData> {
  data: TData;
  loading: boolean;
  error: string;
  reload: () => void;
}
