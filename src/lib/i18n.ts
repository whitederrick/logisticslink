export type Language = "ko" | "en";

export type PageSearchParams = Promise<{ [key: string]: string | string[] | undefined; lang?: string | string[] | undefined }>;

export function resolveLanguage(lang: string | string[] | undefined): Language {
  const value = Array.isArray(lang) ? lang[0] : lang;
  return value === "en" ? "en" : "ko";
}

export async function getPageLanguage(searchParams?: PageSearchParams): Promise<Language> {
  if (!searchParams) return "ko";
  const params = await searchParams;
  return resolveLanguage(params.lang);
}

export function withLanguage(path: string, language: Language) {
  return {
    pathname: path,
    query: { lang: language }
  };
}
