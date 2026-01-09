"use client";
import { useState } from "react";

type ServerFn<T> = (...args: any[]) => Promise<T>;

export function useServerRunner<T>(serverFn: ServerFn<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const run = async (...args: any[]): Promise<T | undefined> => {
    setIsLoading(true);
    setIsError(false);
    setIsSuccess(false);
    setError(null);

    try {
      const res = await serverFn(...args);
      setIsSuccess(true);
      return res;
    } catch (err: any) {
      setIsError(true);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return { run, isLoading, isError, isSuccess, error };
}
