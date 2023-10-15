import { stringify, parse } from "src/util";

export function initVuexBackend(hook, bridge) {
  const store = hook.store;
  let recording = true;
  const livewireVersion = window.__LIVEWIRE_DEVTOOLS_LIVEWIRE_VERSION__ || 2;
  // application -> devtool
  const components =
    livewireVersion === 3
      ? hook.Livewire.all()
      : hook.Livewire.components.components();
  components.map((component) => {
    bridge.send("vuex:mutation", {
      checksum: null,
      component: component.id,
      mutation: {
        type: (component.name || component.fingerprint.name) + " - init",
        payload: stringify(component.data),
      },
      timestamp: Date.now(),
      snapshot: stringify({
        state: component.data,
        getters: {},
      }),
    });
  });

  if (window.__LIVEWIRE_DEVTOOLS_LIVEWIRE_VERSION__ === 3) {
    hook.Livewire.hook(
      "commit",
      ({ component, commit, respond, succeed, fail }) => {
        succeed(({ snapshot, effect }) => {
          if (!recording) return;
          const payload = message.response;

          bridge.send("vuex:mutation", {
            checksum: payload.checksum || payload.serverMemo.checksum,
            component: component.id,
            mutation: {
              type: component.name || component.fingerprint.name,
              payload: stringify(payload),
            },
            timestamp: Date.now(),
            snapshot: stringify({
              state: component.data,
              getters: {},
            }),
          });
        });
      }
    );
  } else {
    const livewireHook = hook.Livewire.components.hooks.availableHooks.includes(
      "responseReceived"
    )
      ? "responseReceived"
      : "message.received";
    if (livewireHook === "message.received") {
      hook.Livewire.hook(livewireHook, (message, component) => {
        if (!recording) return;
        const payload = message.response;

        bridge.send("vuex:mutation", {
          checksum: payload.checksum || payload.serverMemo.checksum,
          component: component.id,
          mutation: {
            type: component.name || component.fingerprint.name,
            payload: stringify(payload),
          },
          timestamp: Date.now(),
          snapshot: stringify({
            state: component.data,
            getters: {},
          }),
        });
      });
    } else {
      hook.Livewire.hook(livewireHook, (component, payload) => {
        if (!recording) return;
        bridge.send("vuex:mutation", {
          checksum: payload.checksum || payload.serverMemo.checksum,
          component: component.id,
          mutation: {
            type: component.name || component.fingerprint.name,
            payload: stringify(payload),
          },
          timestamp: Date.now(),
          snapshot: stringify({
            state: component.data,
            getters: {},
          }),
        });
      });
    }
  }

  // devtool -> application
  bridge.on("vuex:travel-to-state", (state) => {
    hook.emit("vuex:travel-to-state", parse(state, true));
  });

  bridge.on("vuex:import-state", (state) => {
    // hook.emit('vuex:travel-to-state', parse(state, true))
    // bridge.send('vuex:init', getSnapshot())
  });

  bridge.on("vuex:toggle-recording", (enabled) => {
    recording = enabled;
  });
}

export function getCustomStoreDetails(store) {
  return {
    _custom: {
      type: "store",
      display: "Store",
      value: {
        state: store.state,
        getters: store.getters,
      },
      fields: {
        abstract: true,
      },
    },
  };
}
