export namespace Project {
  export type Type = {
    id: number;
    title: string;
    client: string;
    year: string;
    description: string;
    imageUrl: string;
  };
  export const data = [
    {
      id: 1,
      title: "Manual Dynamometer Survey",
      client: "PT. Caltex / Chevron Indonesia",
      year: "1992 & 2003",
      description:
        "Conducted a comprehensive Manual Sucker Rod Pumping Dynamometer Survey to analyze and optimize well performance.",
      imageUrl: "https://picsum.photos/seed/project1/500/350",
    },
    {
      id: 2,
      title: "Steam Pipe Monitoring Duri",
      client: "Duri Field Project",
      year: "2011",
      description:
        "Developed and deployed 65 custom Remote Terminal Units (RTUs) for real-time monitoring of steam pipes, enhancing safety and efficiency.",
      imageUrl: "https://picsum.photos/seed/project2/500/350",
    },
    {
      id: 3,
      title: "Data Communication Radio Trunking for IWM",
      client: "Chevron, Duri Field",
      year: "2008",
      description:
        "Implemented a robust data communication system using Digital/Analog Radio Trunking for the Integrated Well Monitoring (IWM) Rod Pump Controller.",
      imageUrl: "https://picsum.photos/seed/project3/500/350",
    },
    {
      id: 4,
      title: "Well Monitoring System Rental",
      client: "Pertamina Asset 1 – Lirik, Riau",
      year: "2013",
      description:
        "Provided a rental-based, full-service well monitoring system, offering a cost-effective solution for production data acquisition and analysis.",
      imageUrl: "https://picsum.photos/seed/project4/500/350",
    },
    {
      id: 5,
      title: "SCADA System Upgrade",
      client: "National Oil Company",
      year: "2018",
      description:
        "Successfully upgraded a legacy SCADA system for a major oil field, improving data visualization, control, and alarm management capabilities.",
      imageUrl: "https://picsum.photos/seed/project5/500/350",
    },
    {
      id: 6,
      title: "Automated Tank Gauging",
      client: "Petrochemical Plant",
      year: "2021",
      description:
        "Designed and installed an automated tank gauging system for precise inventory management and prevention of overfills.",
      imageUrl: "https://picsum.photos/seed/project6/500/350",
    },
  ];
}
