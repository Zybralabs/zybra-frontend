// components/MainPane.tsx
import { type FC } from "react";

import { useAccount } from "wagmi";

import styles from "@/styles/mainPane.module.css";

import {
  Status,
  Address,
  Chain,
  Balance,
  BlockNumber,
  TransferNative,
  SignMessage,
} from "./components";

const MainPane: FC = () => {
  const { isConnected } = useAccount();

  return <></>;
};

export default MainPane;
