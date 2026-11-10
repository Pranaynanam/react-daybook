// A tiny event bus so services and components can show a toast without prop-drilling.
let listener = null
export function setToastListener(fn) { listener = fn }
export function showToast(message) { if (listener) listener(message) }
