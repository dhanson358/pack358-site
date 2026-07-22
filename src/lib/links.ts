import pack from '../data/pack.json';

export function linkOr(key: keyof typeof pack.links, mailtoSubject: string): string {
  const url = pack.links[key];
  return url === 'PENDING'
    ? `mailto:${pack.email}?subject=${encodeURIComponent(mailtoSubject)}`
    : url;
}
