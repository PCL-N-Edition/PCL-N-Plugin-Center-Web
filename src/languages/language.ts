export type SupportedLanguage = "zh" | "en";

/**
 * Normalize browser, persisted and route-provided locale values to the two
 * locales shipped by the website.
 */
export const normalizeLanguage = (
  value: unknown,
  fallback: SupportedLanguage = "en"
): SupportedLanguage => {
  if (typeof value !== "string") return fallback;

  const language = value.trim().toLowerCase().replace(/_/g, "-");
  if (language === "cn" || language === "zh" || language.startsWith("zh-")) return "zh";
  if (language === "en" || language.startsWith("en-")) return "en";
  return fallback;
};

export const getBrowserLanguage = (): SupportedLanguage => {
  if (typeof navigator === "undefined") return "en";
  return normalizeLanguage(navigator.language || (navigator as Navigator & { browserLanguage?: string }).browserLanguage);
};

export const getDocumentLanguage = (language: SupportedLanguage): "zh-CN" | "en-US" =>
  language === "zh" ? "zh-CN" : "en-US";
