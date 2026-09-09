import Script from "next/script";

/**
 * Runs before hydration so standalone PWA launches show the brand veil
 * immediately (no flash of unfinished UI). Safe no-op in normal browser tabs.
 */
export default function PwaBootEarlyScript() {
  const code = `(function(){try{var s=window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches;var f=window.matchMedia&&window.matchMedia("(display-mode: fullscreen)").matches;var ios=!!window.navigator.standalone;var q=false;try{q=new URLSearchParams(location.search).get("source")==="pwa"}catch(e){}if(!(s||f||ios||q))return;var d=document.documentElement;d.classList.add("pwa-standalone","pwa-booting");if(document.getElementById("pwa-boot-early"))return;var el=document.createElement("div");el.id="pwa-boot-early";el.className="pwa-boot";el.setAttribute("aria-hidden","true");el.innerHTML='<div class="pwa-boot__veil"><div class="pwa-boot__glow"></div><div class="pwa-boot__mark"><img class="pwa-boot__logo" src="/brand/isisel-logo.svg" alt="" width="168" height="56"/></div><div class="pwa-boot__line-wrap"><span class="pwa-boot__line"></span></div></div>';(document.body||d).appendChild(el);}catch(e){}})();`;

  return (
    <Script id="pwa-boot-early-script" strategy="beforeInteractive">
      {code}
    </Script>
  );
}
