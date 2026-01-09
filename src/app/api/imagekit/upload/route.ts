import { serviceAPI } from "@/lib/config/apiroute";
import { configApp } from "@/lib/config/config";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const privateKey = configApp.imagekitIO.private_key;
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return Response.json({ message: "No file" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return Response.json({ message: "Invalid file type" }, { status: 400 });
    }

    if (file.size > 1024 * 1024) {
      return Response.json({ message: "File too large" }, { status: 400 });
    }

    const auth = Buffer.from(`${privateKey}:`).toString("base64");

    const out = new FormData();
    out.append("file", file, file.name);
    out.append("fileName", file.name);
    out.append("folder", "/katalog");
    out.append("useUniqueFileName", "true");

    const res = await axios.post(serviceAPI.imagekitIo.upload_file, out, {
      headers: { Authorization: `Basic ${auth}` },
    });

    return Response.json(res.data, { status: res.status, statusText: res.statusText });
  } catch (error: any) {
    console.log(error);
    return Response.json({ message: "Upload failed" }, { status: 500, statusText: "Internal Server Error" });
  }
}
