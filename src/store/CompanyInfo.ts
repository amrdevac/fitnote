import { create } from "zustand";
import { Service } from "@/data/services";
import { About } from "@/data/about";
import { Client } from "@/data/trusted";
import { productData } from "@/data/product-page";
import { Project } from "@/data/projects";

type CompanyInfoType = About.Company;
type ServiceType = Service.Type[];
type AboutUsType = About.Type;
type ClientType = Client.Type[];
type ProductType = productData.Type[];
type ProjectType = Project.Type[];

export interface storeCompanyInfoType {
  companyInfo: CompanyInfoType | null;
  setCompanyInfo: (state: CompanyInfoType | null) => void;

  services: ServiceType | null;
  setServices: (state: ServiceType | null) => void;

  aboutUs: AboutUsType | null;
  setAboutUs: (state: AboutUsType | null) => void;

  client: ClientType | null;
  setClient: (state: ClientType | null) => void;

  product: ProductType | null;
  setProduct: (state: ProductType | null) => void;

  project: ProjectType | null;
  setProject: (state: ProjectType | null) => void;
}

const storeCompanyData = create<storeCompanyInfoType>((set) => ({
  companyInfo: null,
  setCompanyInfo: (state: CompanyInfoType | null) =>
    set({ companyInfo: state }),

  services: null,
  setServices: (state: ServiceType | null) => set({ services: state }),

  aboutUs: null,
  setAboutUs: (state: AboutUsType | null) => set({ aboutUs: state }),

  client: null,
  setClient: (state: ClientType | null) => set({ client: state }),

  product: null,
  setProduct: (state: ProductType | null) => set({ product: state }),

  project: null,
  setProject: (state: ProjectType | null) => set({ project: state }),
}));
export default storeCompanyData;
