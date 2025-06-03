import React, { useEffect, useState } from 'react';

export const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return isClient ? <>{children}</> : null;
};

export const ClientText = ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <ClientOnly>
      <span {...props}>{children}</span>
    </ClientOnly>
  );
};

export const ClientBox = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <ClientOnly>
      <div {...props}>{children}</div>
    </ClientOnly>
  );
};
