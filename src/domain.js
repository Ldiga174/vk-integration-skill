export class SafeIntegrationError extends Error {
  constructor(stage, method, message) {
    super(message);
    this.name = 'SafeIntegrationError';
    this.stage = stage;
    this.method = method;
  }
  toLog() { return { stage: this.stage, method: this.method, message: this.message }; }
}

export function numericGroupId(input) {
  const value = input.trim();
  const match = value.match(/^(?:https?:\/\/)?(?:m\.)?vk\.com\/(?:club|public|event)(\d+)\/?$/i)
    ?? value.match(/^(?:club|public|event)(\d+)$/i);
  return match ? match[1] : null;
}

export function shortDomain(input) {
  const value = input.trim().replace(/\/$/, '');
  const match = value.match(/^(?:https?:\/\/)?(?:m\.)?vk\.com\/([a-z0-9_.-]+)$/i);
  return match && !/^(club|public|event)\d+$/i.test(match[1]) ? match[1] : null;
}
