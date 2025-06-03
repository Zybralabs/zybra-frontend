export type PropsOf<C extends keyof JSX.IntrinsicElements | React.JSXElementConstructor<unknown>> =
  JSX.LibraryManagedAttributes<C, React.ComponentPropsWithRef<C>>;
