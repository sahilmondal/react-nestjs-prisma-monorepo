import axios, { AxiosError, AxiosRequestConfig } from "axios"
import { getPublicAuthEnv, useAuthStore } from "@workspace/auth-client"

export const AXIOS_INSTANCE = axios.create({
  baseURL: getPublicAuthEnv().apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

// Request interceptor to dynamically inject the bearer token
AXIOS_INSTANCE.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  return AXIOS_INSTANCE({
    ...config,
    ...options,
  }).then(({ data }) => data)
}

export type ErrorType<Error> = AxiosError<Error>
export type BodyType<Body> = Body
