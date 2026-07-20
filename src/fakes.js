export class MemoryDb {
  constructor() { this.users = []; this.identities = []; this.credentials = []; this.metrics = []; }
  user(id) { return this.users.find(x => x.id === id); }
  createUser(data) { const user = { id: `u${this.users.length + 1}`, ...data }; this.users.push(user); return user; }
  identity(provider, externalUserId) { return this.identities.find(x => x.provider === provider && x.externalUserId === externalUserId); }
  linkIdentity(row) { if (this.identity(row.provider, row.externalUserId)) throw new Error('duplicate identity'); this.identities.push(row); }
  credential(userId, platform, channelId) { return this.credentials.find(x => x.userId === userId && x.platform === platform && x.channelId === channelId); }
  upsertCredential(row) { const old = this.credential(row.userId, row.platform, row.channelId); if (old) Object.assign(old, row); else this.credentials.push(row); return old ?? row; }
  upsertMetrics(row) { const old = this.metrics.find(x => x.userId === row.userId && x.platform === row.platform && x.channelId === row.channelId && x.period === row.period); if (old) Object.assign(old, row); else this.metrics.push(row); return old ?? row; }
}

export class FakeVkIdentity {
  async exchangeAndProfile(code) { if (code !== 'valid-code') throw new Error('token_exchange failed'); return { id: 42, name: 'Родион' }; }
}

export class FakeVkAnalytics {
  constructor({ serviceToken }) { if (!serviceToken) throw new Error('VK_SERVICE_TOKEN missing'); this.tokenType = 'service'; }
  async resolveCommunity(domain) { if (domain !== 'volthash') throw new Error('community not found'); return { id: 777 }; }
  async communityProfile(id) { return { id, name: id === '777' ? 'Volthash' : `Community ${id}` }; }
  async communityMetrics(id, period) { return { members: 1532, posts: 84, views: 28140, id, period }; }
}
