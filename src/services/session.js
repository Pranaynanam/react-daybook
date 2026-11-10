// Who is signed in right now. Set by AuthContext, read by the service files.
export const sessionInfo = { userId: '', email: '', teamName: '' }
export function setSessionInfo(patch) { Object.assign(sessionInfo, patch) }
