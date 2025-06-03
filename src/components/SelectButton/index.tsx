import { Box } from "../Box";

type IconComponent = React.ComponentType<{ size?: string | number }>;

export type NetworkIconProps = {
  network: any;
  size?: string | number;
  disabled?: boolean;
};
export function Logo({
  icon: Icon,
  size = "iconRegular",
}: {
  icon: string | IconComponent;
  size?: NetworkIconProps["size"];
}) {
  if (!Icon) return null;
  if (typeof Icon === "string") {
    return (
      <Box as="img" src={Icon} alt="" width={size} height={size} style={{ objectFit: "contain" }} />
    );
  }
  return <Icon size={size} />;
}
