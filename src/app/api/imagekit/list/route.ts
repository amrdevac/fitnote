import { serviceAPI } from "@/lib/config/apiroute";
import { configApp } from "@/lib/config/config";
import axios from "axios";

export async function GET() {
  try {
    const privateKey = configApp.imagekitIO.private_key;
    const res = await axios.get(serviceAPI.imagekitIo.get_list_file, {
      params: { path: "/katalog/", fileType: "image", limit: 1000, skip: 0 },
      auth: { username: privateKey, password: "" },
    });
    return Response.json(res.data, { status: res.status, statusText: res.statusText });
  } catch (error: any) {
    console.log(error);
    return Response.json({ data: [] }, { status: 500, statusText: "Internal Server Error" });
  }
}
