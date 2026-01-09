// Debug.tsx
import React from "react";

export const dd = (data: any) => {
  return (
    <pre
      style={{
        background: "#111",
        color: "#0f0",
        padding: "1rem",
        fontSize: "14px",
        overflowX: "auto",
        whiteSpace: "pre-wrap",
        borderRadius: "8px",
        maxHeight: "50vh",
      }}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};
