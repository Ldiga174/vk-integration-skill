import { numericGroupId, shortDomain, SafeIntegrationError } from './domain.js';

export class VkIntegrationService {
  constructor({ db, vkIdentity, vkAnalytics }) { this.db = db; this.vkIdentity = vkIdentity; this.vkAnalytics = vkAnalytics; }

  async completeLogin({ code, registration = false }) {
    const profile = await this.vkIdentity.exchangeAndProfile(code);
    const linked = this.db.identity('vk', String(profile.id));
    if (linked) return this.db.user(linked.userId);
    if (!registration) throw new SafeIntegrationError('profile', 'VK ID', 'VK account is not linked');
    const user = this.db.createUser({ name: profile.name });
    this.db.linkIdentity({ provider: 'vk', externalUserId: String(profile.id), userId: user.id });
    return user;
  }

  async connectCommunity({ userId, input }) {
    let groupId = numericGroupId(input);
    if (!groupId) {
      const domain = shortDomain(input);
      if (!domain) throw new SafeIntegrationError('community_resolve', 'groups.getById', 'Unsupported VK community link');
      // VK API 5.199 may reject a short domain for some service-token profile types.
      // Resolve the domain through the compatible 5.130 contract, then use only
      // the numeric ID for profile and statistics calls on 5.199.
      const resolved = await this.vkAnalytics.resolveCommunity(domain, { apiVersion: '5.130', parameter: 'group_id' });
      groupId = String(resolved.id);
    }
    const publicProfile = await this.vkAnalytics.communityProfile(groupId, { apiVersion: '5.199' });
    return this.db.upsertCredential({ userId, platform: 'vk', channelId: groupId, status: 'needs_sync', metadata: { name: publicProfile.name } });
  }

  async syncCommunity({ userId, channelId, period }) {
    const credential = this.db.credential(userId, 'vk', channelId);
    if (!credential) throw new SafeIntegrationError('save', 'credential lookup', 'Community is not connected');
    try {
      const metrics = await this.vkAnalytics.communityMetrics(channelId, period, { apiVersion: '5.199' });
      this.db.upsertMetrics({ userId, platform: 'vk', channelId, period, metrics });
      return this.db.upsertCredential({ ...credential, status: 'connected', lastSyncedAt: new Date().toISOString(), lastError: null });
    } catch (error) {
      this.db.upsertCredential({ ...credential, status: 'error', lastError: error.message });
      throw new SafeIntegrationError('wall', 'wall.get', error.message);
    }
  }
}
