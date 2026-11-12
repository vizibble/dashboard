import { integrationsOverviewSchema, whatsappLinkCodeSchema } from '@vizibble/shared/integrations';
import { buildPath, routes } from '@vizibble/shared/routes';

import { api } from '@/app/shared/utils/api-request';

export function getIntegrations(signal?: AbortSignal) {
  return api.get(routes.integrations.overview, integrationsOverviewSchema, { signal });
}

export function createWhatsappLinkCode(organisationId: string) {
  return api.post(
    routes.integrations.whatsappLinkCodes,
    { organisation_id: organisationId },
    whatsappLinkCodeSchema,
  );
}

export function unlinkWhatsapp(grantId: string) {
  return api.delete(buildPath(routes.integrations.whatsappGrant, { grantId }));
}

export function disconnectAiClient(clientId: string) {
  return api.delete(buildPath(routes.integrations.aiClient, { clientId }));
}
