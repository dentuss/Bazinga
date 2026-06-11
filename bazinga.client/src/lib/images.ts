import { API_URL } from "./api";

const absoluteUrlPattern = /^(?:https?:)?\/\//i;

export const resolveImageUrl = (image?: string | null): string => {
  if (!image) {
    return "";
  }

  const trimmed = image.trim();

  if (!trimmed) {
    return "";
  }

  if (absoluteUrlPattern.test(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // Vite bundles imported assets as /assets/<file>-<hash>.<ext>. Those live on
  // the SPA host, not on the API — leave them untouched.
  if (trimmed.startsWith("/assets/") || trimmed.startsWith("assets/")) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return `${API_URL}${trimmed}`;
  }

  return `${API_URL}/${trimmed}`;
};
