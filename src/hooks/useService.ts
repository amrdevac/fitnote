'use client';

import { Service } from "@/data/services";
import servicesDb from "@/lib/indexedDb/services";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Custom hook to manage services data using React Query
 */
const useServiceHook = () => {
  const queryClient = useQueryClient();
  const isClient = typeof window !== "undefined";

  const getServices = useQuery<Service.Type[]>({
    queryKey: ["services"],
    queryFn: () => servicesDb.getAll(),
    enabled: isClient,
    initialData: [],
  });

  const createService = useMutation({
    mutationFn: (data: Omit<Service.Type, "id">) => servicesDb.create(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  const updateService = useMutation({
    mutationFn: (data: Service.Type) => servicesDb.update(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  const deleteService = useMutation({
    mutationFn: (id: number) => servicesDb.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  return { getServices, createService, updateService, deleteService };
};

export default useServiceHook;
