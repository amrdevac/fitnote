import { clientAPI } from "@/lib/config/apiroute";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const useCompnayInfo = () => {
  const getData = useQuery({
    queryKey: ["get-data-company-info"],
    retry: 0,
    queryFn: async () => {
      
      const data = await axios.post(clientAPI.company_info.get);
      return data;
    },
  });
  return { getData };
};

export default useCompnayInfo;
