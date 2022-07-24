window.addEventListener('message', e => {
  if (e.source === window && e.data.livewireDetected) {
    chrome.runtime.sendMessage(e.data)
  }
})

const script = document.createElement('script')
script.src = chrome.runtime.getURL('build/detector-exec.js')
script.onload = () => {
  script.remove()
}
;(document.head || document.documentElement).appendChild(script)
