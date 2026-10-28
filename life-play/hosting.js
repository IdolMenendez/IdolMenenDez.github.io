(() => {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input, location.href);
    if (url.origin === location.origin && /^(?:\/life-play)?\/api\//.test(url.pathname)) {
      return Promise.resolve(new Response(JSON.stringify({ok:false,why:"offline",error:"此试玩版没有社区、支付和云存档服务"}),{status:503,headers:{"Content-Type":"application/json"}}));
    }
    return nativeFetch(input, init);
  };
  document.addEventListener('click', event => {
    const a = event.target.closest && event.target.closest('a[href]');
    if (!a) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin) return;
    if (/^\/life-play\/(zh|zh-hans)\/(buy|c\/|about\/|privacy\/|terms|edu\/)/.test(u.pathname)) {
      event.preventDefault();
      if (/\/buy/.test(u.pathname)) alert('此试玩版不提供支付和通行证。主游戏可以免费体验。');
      else location.href = 'https://1in8b.life' + u.pathname.replace('/life-play','') + u.search + u.hash;
    }
  }, true);
})();