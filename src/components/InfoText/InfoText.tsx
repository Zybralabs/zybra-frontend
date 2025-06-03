import type { FC } from "react";

interface InfoTextProps {
  label: string;
  value: string | undefined;
}

const InfoText: FC<InfoTextProps> = ({ label, value = "N/A", ...props }) => (
  <h1 {...props}>
    {label}:{" "}
    <h1>
      {value}
    </h1>
  </h1>
);

export default InfoText;
