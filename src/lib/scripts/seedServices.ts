import { hardData } from "@/data/index";
import { turso } from "../turso/queryBuilder";

type Service = {
  id: number;
  title: string;
  content: string; // simpan array sebagai JSON string
};

async function seed() {
  for (const item of hardData.service.data) {
    await turso<Service>("services")
      .create({
        title: item.title,
        content: JSON.stringify(item.content), // simpan array -> JSON string
      })
      .save();
  }
}

seed().catch(console.error);
