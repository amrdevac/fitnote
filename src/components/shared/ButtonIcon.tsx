"use client";

import { Button } from "../ui/button";
import React from "react";

type ButtonIconProps = React.ComponentProps<"button"> & {
  icon: React.ReactNode; // bisa berupa SVG, icon component, dll
  text?: React.ReactNode; // optional text
};

const ButtonIcon: React.FC<ButtonIconProps> = ({ icon, text, ...rest }) => {
  return (
    <Button
      {...rest}
      className={`flex items-center bg-gray-800 hover:bg-gray-700  duration-150 ${rest.className || ""}`}
    >
      {icon}
      {text && <span>{text}</span>}
    </Button>
  );
};

export default ButtonIcon;
