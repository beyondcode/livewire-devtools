import { stringify, parse } from 'src/util'

export function initVuexBackend (hook, bridge) {
  const store = hook.store
  let recording = true

  // application -> devtool
  hook.Livewire.components.components().map((component) => {
    bridge.send('vuex:mutation', {
      checksum: null,
      component: component.id,
      mutation: {
        type: (component.name || component.fingerprint.name) + " - init",
        payload: stringify(component.data)
      },
      timestamp: Date.now(),
      snapshot: stringify({
        state: component.data,
        getters: {}
      })
    })
  })

  hook.Livewire.hook('message.received', (message, payload) => {
    if (!recording) return
    let component = message.component
    bridge.send('vuex:mutation', {
      checksum: payload.checksum || payload.serverMemo.checksum,
      component: component.id,
      mutation: {
        type: component.name || component.fingerprint.name,
        payload: stringify(payload)
      },
      timestamp: Date.now(),
      snapshot: stringify({
        state: component.data,
        getters: {}
      })
    })
  })

  // devtool -> application
  bridge.on('vuex:travel-to-state', state => {
    hook.emit('vuex:travel-to-state', parse(state, true))
  })

  bridge.on('vuex:import-state', state => {
    //hook.emit('vuex:travel-to-state', parse(state, true))
    //bridge.send('vuex:init', getSnapshot())
  })

  bridge.on('vuex:toggle-recording', enabled => {
    recording = enabled
  })
}

export function getCustomStoreDetails (store) {
  return {
    _custom: {
      type: 'store',
      display: 'Store',
      value: {
        state: store.state,
        getters: store.getters
      },
      fields: {
        abstract: true
      }
    }
  }
}
