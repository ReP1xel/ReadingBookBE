import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

@Injectable()
export class HttpRequestService {
  private readonly axiosInstance: AxiosInstance;
  private readonly logger = new Logger(HttpRequestService.name);

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.axiosInstance.interceptors.request.use((config) => {
      this.logger.log(`📡 [${config.method?.toUpperCase()}] ${config.url}`);
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.logger.log(`✅ [${response.status}] ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error(`❌ [ERROR] ${error.config?.url} - ${error.message}`);
        return Promise.reject(error);
      },
    );
  }

  async get<T>(
    url: string,
    module: string,
    config?: AxiosRequestConfig,
  ): Promise<{ status: number; data: T }> {
    return this.axiosInstance
      .get<T>(url, {
        ...config,
        headers: { ...(config?.headers || {}), 'X-Module': module },
      })
      .then((res: AxiosResponse<T>) => ({
        status: res.status,
        data: res.data,
      }));
  }

  async post<T>(
    url: string,
    data: any,
    module: string,
    config?: AxiosRequestConfig,
  ): Promise<{ status: number; data: T }> {
    return this.axiosInstance
      .post<T>(url, data, {
        ...config,
        headers: { ...(config?.headers || {}), 'X-Module': module },
      })
      .then((res: AxiosResponse<T>) => ({
        status: res.status,
        data: res.data,
      }));
  }
}
