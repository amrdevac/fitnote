import { httpRequest } from "@/lib/httpRequest";
import { Service } from "@/data/services";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Custom hook to manage services data using React Query
 */
const useServiceHook = () => {
  const queryClient = useQueryClient();

  const getServices = useQuery<Service.Type[]>({
    queryKey: ["services"],
    queryFn: () => httpRequest().internal("services").get<Service.Type[]>(),
  });

  const createService = useMutation({
    mutationFn: (data: Omit<Service.Type, "id">) =>
      httpRequest().internal("services").payload(data).post(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  const updateService = useMutation({
    mutationFn: (data: Service.Type) =>
      httpRequest().internal("services").payload(data).put(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  const deleteService = useMutation({
    mutationFn: (id: number) =>
      httpRequest().internal("services").payload({ id }).delete(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  return { getServices, createService, updateService, deleteService };
};

export default useServiceHook;

