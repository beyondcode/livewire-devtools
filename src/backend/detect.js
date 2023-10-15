export function detect(win) {
  setTimeout(() => {
    if (!win.Livewire) {
      return;
    }
    win.postMessage(
      {
        livewireDetected: true,
        devToolsEnabled: win.Livewire.devToolsEnabled || true,
      },
      "*"
    );

    win.__LIVEWIRE_DEVTOOLS_GLOBAL_HOOK__.emit("init", win.Livewire);
  }, 100);
}
