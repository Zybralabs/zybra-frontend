 //eslint-enable @typescript-eslint/no-unused-vars 
import { type FC } from "react";

// import { isAddress, parseEther } from "viem";
// import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";

// import { useNotify } from "@/hooks";

const TransferNative: FC = () => {
  // const {  sendTransaction } = useSendTransaction();
  // // const { data: receipt, isLoading } = useWaitForTransactionReceipt({ hash: data });
  // const { notifyError, notifySuccess } = useNotify();
  // const [amount, setAmount] = useState<string>("0");
  // const [receiver, setReceiver] = useState<string>("");

  // // const handleAmountChange = (valueAsString: string): void => {
  // //   setAmount(valueAsString);
  // // };

  // // const handleTransfer = () => {
  // //   if (receiver.length === 0 || !isAddress(receiver)) {
  // //     return notifyError({
  // //       title: "Error:",
  // //       message: "The receiver address is not set!",
  // //     });
  // //   }

  //   if (parseFloat(amount) <= 0) {
  //     return notifyError({
  //       title: "Error:",
  //       message: "The amount to send must be greater than 0.",
  //     });
  //   }

  //   sendTransaction({
  //     to: receiver,
  //     value: parseEther(amount),
  //   });
  // };

  // useEffect(() => {
  //   if (receipt) {
  //     notifySuccess({
  //       title: "Transfer successfully sent!",
  //       message: `Hash: ${receipt.transactionHash}`,
  //     });
  //     setAmount("0");
  //     setReceiver("");
  //   }

  //   if (isError && error) {
  //     notifyError({
  //       title: "An error occured:",
  //       message: error.message,
  //     });
  //   }
  // }, [receipt, isError, error, notifyError, notifySuccess]);

  return <></>;
};

export default TransferNative;
