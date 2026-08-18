export type FastEditorDomainType = "fasteditor" | "custom";

interface StoredFastEditorDomainSelection {
  activeDomainType?: string | null;
  fastEditorDomain?: string | null;
  customDomain?: string | null;
}

export function normalizeDomainInput(value: string | null | undefined): string {
  const trimmedValue = String(value ?? "").trim();

  if (!trimmedValue) {
    return "";
  }

  const withoutProtocol = trimmedValue.replace(/^https?:\/\//i, "");
  const [host] = withoutProtocol.split(/[/?#]/);

  return host?.trim().toLowerCase() ?? "";
}

export function isFastEditorDomainType(value: string | null | undefined): value is FastEditorDomainType {
  return value === "fasteditor" || value === "custom";
}

export function inferFastEditorActiveDomainType({
  activeDomainType,
  fastEditorDomain,
  customDomain,
}: StoredFastEditorDomainSelection): FastEditorDomainType {
  if (isFastEditorDomainType(activeDomainType)) {
    return activeDomainType;
  }

  if (normalizeDomainInput(fastEditorDomain)) {
    return "fasteditor";
  }

  if (normalizeDomainInput(customDomain)) {
    return "custom";
  }

  return "fasteditor";
}

export function resolveActiveFastEditorDomain(
  activeDomainType: FastEditorDomainType,
  fastEditorDomain: string | null | undefined,
  customDomain: string | null | undefined
): string {
  if (activeDomainType === "custom") {
    return normalizeDomainInput(customDomain);
  }

  return normalizeDomainInput(fastEditorDomain);
}

export function getFastEditorApiBaseUrl(domain: string): string {
  const normalizedDomain = normalizeDomainInput(domain);

  if (!normalizedDomain) {
    throw new Error("FastEditor domain is required");
  }

  const apiHost = normalizedDomain.startsWith("api.")
    ? normalizedDomain
    : `api.${normalizedDomain}`;

  return `https://${apiHost}`;
}
