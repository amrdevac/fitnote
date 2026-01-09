import { serviceAPI } from "@/lib/config/apiroute";
import { configApp } from "@/lib/config/config";
import axios from "axios";

export async function POST() {
  try {
    const url =
      configApp.pocketbase.base_url + "/" + serviceAPI.pocketbase.company_info;
    const results = await axios.get(url);

    console.log(results.data,"disini")
    return Response.json(results.data, {
      status: results.status,
      statusText: results.statusText,
    });
  } catch (error: any) {
    console.log(error);
    return Response.json(
      {
        data: "",
      },
      {
        status: 500,
        statusText: "Internal Server Error",
      }
    );
  }
}
