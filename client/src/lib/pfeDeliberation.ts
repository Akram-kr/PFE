import { publicClient } from "./contract";
import { PFE_DELIBERATION_ABI } from "./pfeDeliberation-abi";

export { PFE_DELIBERATION_ABI };

/**
 * Deployed PFE Deliberation contract address.
 *
 * Set NEXT_PUBLIC_DELIBERATION_CONTRACT_ADDRESS in your .env.local to enable
 * PFE deliberation functionality.
 */
export const PFE_DELIBERATION_ADDRESS =
  (process.env.NEXT_PUBLIC_DELIBERATION_CONTRACT_ADDRESS as
    | `0x${string}`
    | undefined) ?? undefined;

/** True when the PFE Deliberation contract is configured. */
export const PFE_DELIBERATION_ENABLED = !!PFE_DELIBERATION_ADDRESS;

/**
 * wagmi contract config shorthand.
 * Only valid when PFE_DELIBERATION_ENABLED is true.
 */
export const pfeDeliberationContract = {
  address: PFE_DELIBERATION_ADDRESS as `0x${string}`,
  abi: PFE_DELIBERATION_ABI,
} as const;

export async function getDeliberationFinalNoteForMatricule(
  matricule: string,
): Promise<number | null> {
  if (!PFE_DELIBERATION_ADDRESS) {
    return null;
  }

  let latestCalculatedNote: number | null = null;

  for (let sessionId = 0; ; sessionId += 1) {
    try {
      const [isCalculated, studentId, finalNote] =
        (await publicClient.readContract({
          address: PFE_DELIBERATION_ADDRESS,
          abi: PFE_DELIBERATION_ABI,
          functionName: "getFinalGrade",
          args: [BigInt(sessionId)],
        })) as [boolean, string, number, string];

      if (studentId === matricule && isCalculated) {
        latestCalculatedNote = Number(finalNote);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (
        message.includes("reverted") ||
        message.includes("Session_NotFound") ||
        message.includes("not found")
      ) {
        break;
      }

      throw error;
    }
  }

  return latestCalculatedNote;
}
