import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { useQuery } from 'react-query'
import { useState } from 'react'

export function useFile(uri: string | undefined | null, fileName: string) {
  const cent = useCentrifuge();
  const [isLoading, setIsLoading] = useState(false);
  
  const query = useQuery(
    ['file', uri],
    async () => {
      setIsLoading(true);
      try {
        const url = cent.metadata.parseMetadataUrl(uri!);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch file');
        const blob = await response.blob();
        return new File([blob], `${fileName}.${getExtension(blob.type as any)}`, { type: blob.type });
      } finally {
        setIsLoading(false);
      }
    },
    {
      enabled: !!uri,
      staleTime: Infinity,
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: 2,
    }
  );

  return { ...query, isLoading };
}
const extensions = {
  'image/png': 'png',
  'image/avif': 'avif',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/vnd.microsoft.icon': 'ico',
}
function getExtension(mime: keyof typeof extensions) {
  return extensions[mime]
}
