/** N Cloud legal document version under public/legal/. Bump when text changes. */
export const NCLOUD_LEGAL_VERSION = "v0.1";

const STORAGE_KEY = "pcln-ncloud-legal-accepted";

/** Absolute paths served from Vite public/ folder. */
export const legalDocumentUrls = {
  terms: "/legal/terms.md",
  privacy: "/legal/privacy.md"
} as const;

export function hasAcceptedNCloudLegal(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === NCLOUD_LEGAL_VERSION;
  } catch {
    return false;
  }
}

export function acceptNCloudLegal(): void {
  try {
    localStorage.setItem(STORAGE_KEY, NCLOUD_LEGAL_VERSION);
  } catch {
    // ignore quota / private mode
  }
}
