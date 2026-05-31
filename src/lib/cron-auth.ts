export function cronSecret() {
  return process.env.CRON_SECRET ?? "";
}

export function shouldAllowCronSecretQueryParam({
  allowQuery,
  nodeEnv
}: {
  allowQuery?: string;
  nodeEnv?: string;
}) {
  return allowQuery === "true" || nodeEnv !== "production";
}

export function allowCronSecretQueryParam() {
  return shouldAllowCronSecretQueryParam({
    allowQuery: process.env.ALLOW_CRON_SECRET_QUERY,
    nodeEnv: process.env.NODE_ENV
  });
}

export function hasValidCronSecret(request: Request) {
  const configuredSecret = cronSecret();
  if (!configuredSecret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${configuredSecret}`) return true;

  if (!allowCronSecretQueryParam()) return false;

  const url = new URL(request.url);
  return url.searchParams.get("secret") === configuredSecret;
}
