import { clientAPI } from "@/lib/config/apiroute";
import axios from "axios";

export const getCompanyInfo = async () => {
  return  await axios.post(clientAPI.company_info.get);
};
