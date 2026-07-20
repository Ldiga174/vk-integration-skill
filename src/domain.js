export class SafeIntegrationError extends Error {
  constructor(stage, method, message) {
    super(message);
    this.name = 'SafeIntegrationError';
    this.stage = stage;
    this.method = method;
  }
  toLog() { return { stage: this.stage, method: this.method, message: this.message }; }
}

const VK_HOST = String.raw`(?:vk\\.(?:com|ru)|vkontakte\\.ru)`;

export function numericGroupId(input) {
  const value = input.trim();
  const urlPattern = new RegExp(`^(?:https?:\\/\\/)?(?:(?:www|m)\\.)?${VK_HOST}\\/(?:club|public|event)(\\d+)\\/?$`, 'i');
  const match = value.match(urlPattern) ?? value.match(/^(?:club|public|event)(\d+)$/i);
  return match ? match[1] : null;
}

export function shortDomain(input) {
  const value = input.trim().replace(/\/$/, '');
  const urlPattern = new RegExp(`^(?:https?:\\/\\/)?(?:(?:www|m)\\.)?${VK_HOST}\\/([a-z0-9_.-]+)$`, 'i');
  const match = value.match(urlPattern);
  return match && !/^(club|public|event)\d+$/i.test(match[1]) ? match[1] : null;
}
