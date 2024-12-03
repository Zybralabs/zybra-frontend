import type { FC } from "react";

interface InfoTextProps extends BoxProps {
  label: string;
  value: string | undefined;
}

const InfoText: FC<InfoTextProps> = ({ label, value = "N/A", ...props }) => (
  <h1 {...props}>
    {label}:{" "}
    <h1 as="span" fontWeight="800">
      {value}
    </h1>
  </h1>
);

export default InfoText;
