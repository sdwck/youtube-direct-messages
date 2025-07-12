(() => {
  try {
    const url = new URL(window.location.href);
    const dmUser = url.searchParams.get('dm_user');
    if (dmUser) {
      sessionStorage.setItem('yt-dm-pending-chat-uid', dmUser);
      url.searchParams.delete('dm_user');
      window.history.replaceState({}, document.title, url.toString());
    }
  } catch (e) {
    console.error('YT-DM: Error processing incoming chat link.', e);
  }
})();

const scriptsToInject = [
    'libs/firebase/firebase-app.js',
    'libs/firebase/firebase-auth.js',
    'libs/firebase/firebase-firestore.js',
    'app.js'
];

scriptsToInject.forEach(file => {
    const s = document.createElement('script');
    s.type = 'module';
    s.src = chrome.runtime.getURL(file);
    (document.head || document.documentElement).appendChild(s);
});