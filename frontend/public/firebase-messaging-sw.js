importScripts(
  'https://www.gstatic.com/firebasejs/9.6.4/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/9.6.4/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: true,
  projectId: true,
  messagingSenderId: true,
  appId: true
});

self.addEventListener('install', () => self.skipWaiting());

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  if (payload.notification && payload.data) {
    const { poolId } = payload.data;
    const { title, body } = payload.notification;
    if (
      title &&
      body &&
      poolId &&
      // Only navigate when the user is NOT on the pool page
      !window.location.pathname.includes(`/pool/${poolId}`)
    ) {
      window.location.assign(`/pool/${poolId}`);
    }
  }

  // not showing notification here because Firebase would have auto-shown it
});
