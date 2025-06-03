export const pinToApi = async (url: string, reqInit?: RequestInit) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_PINNING_API_URL}/${url}`, reqInit)
  if (!res.ok) {
    const resText = await res.text()
    throw new Error(`Error pinning: ${resText}`)
  }
  const json = await res.json()
  return json
}
