export type MainReponse<T> = {
  message: string,
  data: T,
  token?: string,
  code: number,
  count?: number,
}