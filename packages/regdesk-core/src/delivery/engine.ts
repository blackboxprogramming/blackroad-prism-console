import type { DeliveryLog } from '@blackroad/regdesk-db';
import type { ClientOSClient, EmailDeliveryClient } from '@blackroad/regdesk-integrations';
import { appendAuditLog } from '../audit/worm.js';
import type { DeliveryRequest } from '../types.js';
import type { RegDeskRepository } from '../utils/repository.js';

export interface DeliveryEngineDeps {
  repo: RegDeskRepository;
  clientOS: ClientOSClient;
  email: EmailDeliveryClient;
  actor: string;
}

export class DeliveryEngine {
  constructor(private readonly deps: DeliveryEngineDeps) {}

  async deliver(request: DeliveryRequest): Promise<DeliveryLog[]> {
    if (!request.evidencePath) {
      throw new Error('Evidence path is required for delivery');
    }
    const recipients = await this.deps.clientOS.resolveRecipients(request.clients);
    const created: DeliveryLog[] = [];
    for (const recipient of recipients) {
      const existing = await this.deps.repo.listDeliveryLogs({
        docKind: request.docKind,
        clientId: recipient.id
      });
      const alreadyDelivered = existing.find(
        (log) => log.version === request.version && log.method === request.method
      );
      if (alreadyDelivered) {
        created.push(alreadyDelivered);
        continue;
      }
      let evidencePath = request.evidencePath;
      if (request.method === 'EMAIL') {
        const email = recipient.email;
        if (!email) {
          throw new Error(`Client ${recipient.id} missing email`);
        }
        const messageId = await this.deps.email.sendEmail(
          { email },
          {
            subject: `${request.docKind} delivery`,
            body: `Delivery notice generated at ${new Date().toISOString()}`
          }
        );
        evidencePath = messageId.evidencePath;
      }
      const log = await this.deps.repo.createDeliveryLog({
        clientId: recipient.id,
        docKind: request.docKind,
        version: request.version,
        method: request.method,
        target: recipient.email ?? recipient.portalId ?? recipient.mailingAddress ?? 'UNKNOWN',
        sentAt: new Date(),
        acknowledgedAt: undefined,
        evidencePath,
        meta: request.meta ?? {}
      });
      await appendAuditLog(this.deps.repo, {
        actor: this.deps.actor,
        action: 'delivery.send',
        entity: log.id,
        docKind: request.docKind,
        clientId: recipient.id
      });
      created.push(log);
    }
    return created;
  }
}
