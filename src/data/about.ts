export namespace About {
  export type Company = {
    id: number;
    name: string;
    tagline: string;
    full_description: string;
    address: string;
    phone: string;
    email: string;
    map_url: string;
    img_map: string;
    img_company: string;
  };

  export type Type = {
    id: number;
    story: string;
    vision: string;
    mission: string;
    img_about: string;
    value: Values[];
  };

  export type Values = {
    id: number;
    title: string;
    description: string;
  };

  export const company = {
    id: 1,
    name: "PT. Adhirajasa Sarana Utama",
    tagline: "We Help Growing Your Business",
    full_description:
      "PT. Adhirajasa Sarana Utama established since June 01, 2007 is a local company and engaged in supporting activities of oil and natural gas mining, large trading of machinery and other equipment, especially as a service business provider of Production Automation and O&M for Integrated Well Monitoring equipment.",
    address:
      "Jl. Pulo Kenanga Raya No.8, RT.8/RW.16, North Grogol, Kebayoran Lama, South Jakarta City, Jakarta 12210.",
    phone: "+62 21 5367 0477",
    email: "info@adhirajasa.com",
    mapUrl: "https://maps.app.goo.gl/g1e2h3i4j5k6l7m8n",
    mapImageUrl: "https://picsum.photos/seed/map/400/225",
  };
  export const about = {
    story:
      "PT. Adhirajasa Sarana Utama was established on June 01, 2007. We are a proud local company engaged in supporting the oil and natural gas mining sector. Our expertise extends to the large-scale trading of machinery, other essential equipment, and specialized services. Over the years, we have solidified our position as a premier service provider for Production Automation and Operations & Maintenance (O&M) for Integrated Well Monitoring equipment. Our journey is one of continuous growth, innovation, and unwavering commitment to excellence.",
    vision:
      "To be the leading national company in production automation and integrated well monitoring services, renowned for our innovation, quality, and reliability.",
    mission:
      "To provide cutting-edge solutions and superior services that optimize our clients' operational efficiency, enhance safety, and contribute to the nation's energy sector growth.",
    values: [
      {
        id: 1,
        title: "Integrity",
        description:
          "We uphold the highest standards of integrity in all of our actions.",
      },
      {
        id: 2,
        title: "Customer Commitment",
        description:
          "We develop relationships that make a positive difference in our customers' lives.",
      },
      {
        id: 3,
        title: "Quality",
        description:
          "We provide outstanding products and unsurpassed service that deliver premium value.",
      },
      {
        id: 4,
        title: "Teamwork",
        description:
          "We work together, across boundaries, to meet the needs of our customers.",
      },
    ],
  };
}
