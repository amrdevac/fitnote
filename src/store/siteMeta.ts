import { create } from "zustand";
import { SiteMeta } from "@/data/metadata";

type SiteMetaStore = {
  meta: SiteMeta.Type | null;
  setMeta: (meta: SiteMeta.Type | null) => void;
};

const useSiteMeta = create<SiteMetaStore>((set) => ({
  meta: null,
  setMeta: (meta) => set({ meta }),
}));

export default useSiteMeta;
