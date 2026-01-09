export namespace productData {
  export type Type = {
    id: number;
    slug: string;
    title: string;
    description: string;
    fullDescription: string;
    imageUrl: string;
  };
  export const data = [
    {
      id: 1,
      slug: "tutta-amr-system",
      title: "Tutta AMR System",
      description:
        "Automatic Meter Reading (AMR) is the technology of automatically collecting consumption data.",
      fullDescription:
        "Automatic Meter Reading (AMR) is the technology of automatically collecting consumption, diagnostic, and status data from water meter or energy metering devices (gas, electric) and transferring that data to a central database for billing, troubleshooting, and analyzing. This technology mainly saves utility providers the expense of periodic trips to each physical location to read a meter. Another advantage is that billing can be based on near real-time consumption rather than on estimates based on past or predicted consumption.",
      imageUrl: "https://picsum.photos/seed/product1/400/400",
    },
    {
      id: 2,
      slug: "rod-pump-controller",
      title: "Rod Pump Controller (RPC)",
      description:
        "An advanced system to optimize performance and efficiency of rod pump operations in oil wells.",
      fullDescription:
        "The Rod Pump Controller (RPC) developed by PT. Adhirajasa Sarana Utama is an advanced system designed to optimize the performance and efficiency of rod pump operations in oil wells. It provides real-time monitoring, control, and data analysis to maximize production, reduce operational costs, and prevent equipment failure. The system integrates seamlessly with existing SCADA and automation platforms.",
      imageUrl: "https://picsum.photos/seed/product2/400/400",
    },
  ];
}
