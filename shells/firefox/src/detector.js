import { installToast } from 'src/backend/toast'
import { isFirefox } from 'src/devtools/env'

window.addEventListener('message', e => {
  if (e.source === window && e.data.livewireDetected) {
    chrome.runtime.sendMessage(e.data)
  }
})

function detect (win) {
  setTimeout(() => {
    if (!win.Livewire) {
      return;
    }
    win.postMessage({
      livewireDetected: true,
      devToolsEnabled: win.Livewire.devToolsEnabled || false
    }, '*')

    win.__LIVEWIRE_DEVTOOLS_GLOBAL_HOOK__.emit('init', win.Livewire);
  }, 100)
}

// inject the hook
if (document instanceof HTMLDocument) {
  installScript(detect)
  installScript(installToast)
}

function installScript (fn) {
  const source = ';(' + fn.toString() + ')(window)'

  if (isFirefox) {
    // eslint-disable-next-line no-eval
    window.eval(source) // in Firefox, this evaluates on the content window
  } else {
    const script = document.createElement('script')
    script.textContent = source
    document.documentElement.appendChild(script)
    script.parentNode.removeChild(script)
  }
}
