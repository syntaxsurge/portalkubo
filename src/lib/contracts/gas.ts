export function getBufferedContractWriteGasLimit({
  estimate,
  minimum = 0n
}: {
  estimate?: bigint | null
  minimum?: bigint
}) {
  const base = estimate && estimate > 0n ? estimate : minimum
  return base + base / 5n
}

export function getSubstrateDispatchErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

export function extractSubstrateDispatchError(error: unknown) {
  return getSubstrateDispatchErrorMessage(error)
}
