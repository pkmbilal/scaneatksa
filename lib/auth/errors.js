// Supabase Auth returns dynamic English error strings straight from the SDK
// (e.g. "Invalid login credentials"), which can't be routed through t() like
// static UI copy. This maps the handful of known, recurring messages to a
// translated string via the "auth" message namespace; anything unrecognized
// falls back to the raw SDK message rather than being silently swallowed.

const KNOWN_MESSAGES = {
  'invalid login credentials': 'errors.invalidCredentials',
  'your account has been disabled. please contact support.': 'errors.accountDisabled',
}

export function mapAuthError(rawMessage, t) {
  if (!rawMessage) return t('errors.generic')
  const key = KNOWN_MESSAGES[rawMessage.trim().toLowerCase()]
  return key ? t(key) : rawMessage
}
