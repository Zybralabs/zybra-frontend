import { type FC, type ChangeEvent, type MouseEvent, useEffect, useState } from "react";

import { useSignMessageHook, useNotify } from "@/hooks";

const SignMessage: FC = () => {
  const { signature, recoveredAddress, error, isPending, signMessage } = useSignMessageHook();
  const [messageAuth, setMessageAuth] = useState<string>("");
  const { notifyError, notifySuccess } = useNotify();

  const handleMessageChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setMessageAuth(e.target.value);
  };

  const handleSignMessage = (e: MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    signMessage({ message: messageAuth });
  };

  useEffect(() => {
    if (signature && recoveredAddress) {
      notifySuccess({
        title: "Message successfully signed!",
        message: (
          <>
            <b>Signature:</b> {signature}
            <br />
            <br />
            <b>Recovered Address:</b> {recoveredAddress}
          </>
        ),
      });
    }

    if (error) {
      notifyError({
        title: "An error occured:",
        message: error.message,
      });
    }
  }, [signature, recoveredAddress, error, notifyError, notifySuccess]);

  return <></>;
};

export default SignMessage;
