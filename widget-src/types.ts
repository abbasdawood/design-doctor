
export interface LibrariesCount {
  components: Record<string, { count: number; ids: string[] }>;
  localComponents: Record<string, { count: number; ids: string[] }>;
  detachedComponents: Record<string, { count: number; ids: string[] }>;
  colourStyles: Record<string, { count: number; ids: string[] }>;
  textStyles: Record<string, { count: number; ids: string[] }>;
}

export interface Library {
  ids: string[];
  name: string;
  count: number;
}
