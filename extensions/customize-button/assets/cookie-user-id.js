function getUserIdFromCookie() {
  const cookieName = "fasteditor_userid";
  const match = document.cookie.match(new RegExp("(^| )" + cookieName + "=([^;]+)"));
  return match ? match[2] : null;
}

function setUserIdToCookie(userId) {
  const expiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString(); // 30 днів
  document.cookie = `fasteditor_userid=${userId}; expires=${expiration}; path=/`;
}

function getOrCreateUserId() {
  let userId = getUserIdFromCookie();
  if (!userId) {
    userId = crypto.randomUUID();
    setUserIdToCookie(userId);
  }
  return userId;
}
