type AnyObject = Record<string, any>;

const keyFormatterSnakeToCamel = <T extends AnyObject>(obj: T): T extends any[]
  ? T
  : { [K in keyof T as K extends string ? CamelCase<K> : K]: T[K] } => {
  if (typeof obj !== "object" || obj === null) return obj as any;

  if (Array.isArray(obj)) {
    return obj.map((item) => keyFormatterSnakeToCamel(item)) as any;
  }

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase()) as keyof T;
    acc[camelKey] = keyFormatterSnakeToCamel(obj[key]);
    return acc;
  }, {} as any);
};

// Utility Type to Convert Snake Case to Camel Case
type CamelCase<S extends string> = S extends `${infer P}_${infer R}`
  ? `${P}${Capitalize<CamelCase<R>>}`
  : S;

export default keyFormatterSnakeToCamel;
