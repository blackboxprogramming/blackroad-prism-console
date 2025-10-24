import chalk from 'chalk';
import { AuditEvent, Incident, Release, Service } from '@blackroad/control-plane-sdk';

export function printAuditEvent(event: AuditEvent) {
  const header = chalk.bold(`${event.action} by ${event.actor}`);
  console.log(`${header} @ ${event.ts}`);
  console.log(chalk.gray(`subject: ${event.subjectType}#${event.subjectId}`));
  if (Object.keys(event.metadata ?? {}).length > 0) {
    console.log(chalk.gray(JSON.stringify(event.metadata, null, 2)));
  }
}

export function printReleaseSummary(service: Service, releases: Release[]) {
  console.log(chalk.bold(`Service: ${service.name} (${service.id})`));
  console.log(`Repo: ${service.repo ?? 'n/a'}`);
  console.log('Environments:');
  for (const env of service.environments) {
    const latest = releases.find((release) => release.envId === env.id);
    const status = latest ? `${latest.version ?? latest.sha} — ${latest.status}` : 'no release';
    console.log(`  - ${env.name} (${env.id}): ${status}`);
  }
}

export function printIncidents(incidents: Incident[]) {
  if (incidents.length === 0) {
    console.log(chalk.green('No recent incidents.'));
    return;
  }

  for (const incident of incidents) {
    const color = incident.severity === 'critical' ? chalk.red : incident.severity === 'high' ? chalk.redBright : chalk.yellow;
    console.log(color(`${incident.severity.toUpperCase()} — ${incident.id} — ${incident.status}`));
    console.log(chalk.gray(`started: ${incident.startedAt} link: ${incident.link ?? 'n/a'}`));
  }
}
