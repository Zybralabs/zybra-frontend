import { namehash } from "@ethersproject/hash";

export function safeNamehash(name?: string): string | undefined {
  if (name === undefined) {
    return undefined;
  }

  try {
    return namehash(name);
  } catch (error) {
    // logger.info("safeNamehash", "safeNamehash", "error", error, { name });
    return undefined;
  }
}
