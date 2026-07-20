export const vkIdCookie = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAgeSeconds: 600,
};

export function validateOAuthCallback({ expectedState, actualState, expectedRedirectUri, actualRedirectUri, codeVerifier }) {
  if (!expectedState || expectedState !== actualState) throw new Error('Invalid OAuth state');
  if (expectedRedirectUri !== actualRedirectUri) throw new Error('Redirect URI mismatch');
  if (!codeVerifier) throw new Error('Missing PKCE verifier');
}
