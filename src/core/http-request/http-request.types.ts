export interface ApiResponse<T> {
  status: boolean;
  code: string;
  message: string;
  data?: T;
}
