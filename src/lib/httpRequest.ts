import axios, { Method } from "axios";
import { configApp } from "./config/config";

class RequestBuilder {
  private baseUrlStr: string;
  private endpoint: string = "";
  private data: any = null;
  private config: any = {};
  private revalidateSec?: number;
  private tagsList: string[] = [];

  constructor() {
    // default ke PocketBase
    this.baseUrlStr = configApp.pocketbase.base_url;
  }

  /** Request ke API eksternal (PocketBase, dsb) */
  api(endpoint: string) {
    this.endpoint = endpoint;
    return this;
  }

  /** Request ke API internal Next.js */
  internal(endpoint: string) {
    this.baseUrlStr = ""; // hit langsung relative path
    this.endpoint = `/api/${endpoint}`;
    return this;
  }

  /** Ganti base URL */
  baseUrl(url: string) {
    this.baseUrlStr = url;
    return this;
  }

  /** Payload/body request */
  payload(data: any) {
    this.data = data;
    return this;
  }

  /** Tambah tag untuk ISR on-demand */
  tag(name: string) {
    this.tagsList.push(name);
    return this;
  }

  /** ISR otomatis */
  isr(seconds: number) {
    this.revalidateSec = seconds;
    return this;
  }

  /** Tambah atau override header */
  headers(headers: Record<string, string>) {
    this.config.headers = { ...(this.config.headers || {}), ...headers };
    return this;
  }
  private async send<T>(method: Method): Promise<T> {
    const url = this.baseUrlStr + this.endpoint;
    const res = await axios({
      url,
      method,
      data: this.data,
      headers: {
        "Content-Type": "application/json",
        ...(this.config.headers || {}),
      },
      ...this.config,
      next: {
        revalidate: this.revalidateSec,
        tags: this.tagsList.length ? this.tagsList : undefined,
      },
    });
    return res.data;
  }

  get<T>() {
    return this.send<T>("GET");
  }

  post<T>() {
    return this.send<T>("POST");
  }

  put<T>() {
    return this.send<T>("PUT");
  }

  delete<T>() {
    return this.send<T>("DELETE");
  }
}

// factory function → biar tanpa `new`
export const httpRequest = () => new RequestBuilder();
