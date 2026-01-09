import { BriefcaseIcon } from "lucide-react";

export namespace Service {
  export type Type = {
    id: number;
    title: string;
    content: string;
  };

  export const data = [
    {
      title:
        "System Integrator with Hardware and Software of own Design and Production",
      content: [
        "More than just System Integrator",
        "Fast response for modify / custom / problem solving",
      ],
    },
    {
      title: "Software Developer",
      content: [
        "Web-based applications",
        "Desktop applications",
        "Mobile applications",
      ],
    },
    {
      title: "Electronic Designer",
      content: [
        "PCB design and layout",
        "Microcontroller programming",
        "Analog and digital circuit design",
      ],
    },
    {
      title: "Hardware Designer",
      content: [
        "Custom hardware solutions",
        "Enclosure and mechanical design",
        "Prototyping and manufacturing",
      ],
    },
  ];

  export const data2 = [
    {
      id: 1,
      title: "System Integration",
      description:
        "We offer more than just system integration. With our own hardware and software design and production, we provide fast responses for modifications, customizations, and problem-solving to create a seamless, unified system.",
      icon: BriefcaseIcon,
    },
    {
      id: 2,
      title: "Software Development",
      description:
        "Our team develops robust and scalable software solutions tailored to your needs, including web-based applications, desktop applications, and mobile applications for various platforms.",
      icon: BriefcaseIcon,
    },
    {
      id: 3,
      title: "Electronic Design",
      description:
        "We specialize in custom electronic solutions, from PCB design and layout to microcontroller programming and complex analog and digital circuit design, turning concepts into functional hardware.",
      icon: BriefcaseIcon,
    },
    {
      id: 4,
      title: "Hardware Design",
      description:
        "Our capabilities cover the full spectrum of hardware development, including custom hardware solutions, enclosure and mechanical design, and rapid prototyping and manufacturing.",
      icon: BriefcaseIcon,
    },
    {
      id: 5,
      title: "Production Automation",
      description:
        "We provide end-to-end production automation services, helping you streamline operations, increase efficiency, and reduce manual intervention in your production processes.",
      icon: BriefcaseIcon,
    },
    {
      id: 6,
      title: "O&M Services",
      description:
        "We offer comprehensive Operations & Maintenance (O&M) services for Integrated Well Monitoring equipment, ensuring your systems run smoothly and reliably with minimal downtime.",
      icon: BriefcaseIcon,
    },
  ];
}
