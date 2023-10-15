import { installToast } from "src/backend/toast";
import { isFirefox } from "src/devtools/env";
// import { detect } from 'src/backend/detect'

function detect(win) {
  setTimeout(() => {
    if (!win.Livewire) {
      return;
    }
    win.postMessage(
      {
        livewireDetected: true,
        devToolsEnabled: win.Livewire.devToolsEnabled || true, //TODO: check new API, not exist anymore
      },
      "*"
    );

    win.__LIVEWIRE_DEVTOOLS_GLOBAL_HOOK__.emit("init", win.Livewire);
  }, 100);
}

// function installScript (fn) {
//   const source = ';(' + fn.toString() + ')(window)'

//   if (isFirefox) {
//     // eslint-disable-next-line no-eval
//     window.eval(source) // in Firefox, this evaluates on the content window
//   } else {
//     const script = document.createElement('script')
//     script.src = chrome.runtime.getURL('build/detector-exec.js')
//     script.onload = () => {
//       script.remove()
//     }
//     ;(document.head || document.documentElement).appendChild(script)
//   }
// }

// inject the hook
if (document instanceof HTMLDocument) {
  detect(window);
  installToast(window);
}
