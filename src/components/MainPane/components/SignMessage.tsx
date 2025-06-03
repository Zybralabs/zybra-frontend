import { type FC, useEffect } from "react";

import { useSignMessageHook, useNotify } from "@/hooks";

const SignMessage: FC = () => {
  const { signature, recoveredAddress, error } = useSignMessageHook();
  const { notifyError, notifySuccess } = useNotify();



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
