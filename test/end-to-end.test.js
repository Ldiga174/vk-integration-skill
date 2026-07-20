import test from 'node:test';
import assert from 'node:assert/strict';
import { VkIntegrationService } from '../src/service.js';
import { MemoryDb, FakeVkIdentity, FakeVkAnalytics } from '../src/fakes.js';
import { numericGroupId, shortDomain } from '../src/domain.js';
import { validateOAuthCallback } from '../src/oauth-policy.js';

test('full browser → VK → DB → UI path is idempotent', async () => {
  const db = new MemoryDb();
  const vkAnalytics = new FakeVkAnalytics({ serviceToken: 'server-only-test-token' });
  const service = new VkIntegrationService({ db, vkIdentity: new FakeVkIdentity(), vkAnalytics });

  validateOAuthCallback({ expectedState: 's1', actualState: 's1', expectedRedirectUri: 'https://app.test/auth/vk/callback', actualRedirectUri: 'https://app.test/auth/vk/callback', codeVerifier: 'pkce-verifier' });
  const registered = await service.completeLogin({ code: 'valid-code', registration: true });
  const loggedIn = await service.completeLogin({ code: 'valid-code' });
  assert.equal(loggedIn.id, registered.id);
  assert.equal(db.users.length, 1, 'repeat login must not create a duplicate');

  const connection = await service.connectCommunity({ userId: registered.id, input: 'https://vk.ru/volthash' });
  assert.equal(connection.channelId, '777');
  assert.equal(connection.status, 'needs_sync');
  assert.equal(vkAnalytics.tokenType, 'service');
  assert.deepEqual(vkAnalytics.calls[0], {
    method: 'groups.getById',
    domain: 'volthash',
    apiVersion: '5.130',
    parameter: 'group_id',
  });
  assert.equal(vkAnalytics.calls[1].apiVersion, '5.199');

  await service.syncCommunity({ userId: registered.id, channelId: '777', period: '2026-07' });
  await service.syncCommunity({ userId: registered.id, channelId: '777', period: '2026-07' });
  assert.equal(db.metrics.length, 1, 'same period must be upserted');
  assert.equal(db.metrics[0].metrics.members, 1532);
  assert.equal(db.credential(registered.id, 'vk', '777').status, 'connected');
  assert.equal(vkAnalytics.calls.at(-1).apiVersion, '5.199');
});

test('supported numeric VK links are normalized for vk.com and vk.ru', () => {
  assert.equal(numericGroupId('https://vk.com/club123'), '123');
  assert.equal(numericGroupId('https://vk.ru/public456'), '456');
  assert.equal(numericGroupId('vk.ru/event789'), '789');
  assert.equal(numericGroupId('event987'), '987');
});

test('vk.ru short domains are normalized before compatible resolution', () => {
  assert.equal(shortDomain('https://vk.ru/volthash'), 'volthash');
  assert.equal(shortDomain('https://m.vk.ru/volthash/'), 'volthash');
});
