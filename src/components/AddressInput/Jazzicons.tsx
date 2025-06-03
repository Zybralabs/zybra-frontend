import { type FC } from "react";

import Jazzicon, { jsNumberForAddress } from "react-jazzicon";

type JazziconsProps = {
  seed: string;
  size?: number;
};

const Jazzicons: FC<JazziconsProps> = ({ seed, size }) => {
  if (size) return <Jazzicon seed={jsNumberForAddress(seed)} diameter={size} />;

  return <Jazzicon seed={jsNumberForAddress(seed)} />;
};

export default Jazzicons;
