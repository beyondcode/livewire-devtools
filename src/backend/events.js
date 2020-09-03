import { stringify } from '../util'
import { getInstanceName } from './index'

export function initEventsBackend (Livewire, bridge) {
  let recording = true

  bridge.on('events:toggle-recording', enabled => {
    recording = enabled
  })

  function logEvent(Livewire, type, instanceId, eventName, payload) {
    // The string check is important for compat with 1.x where the first
    // argument may be an object instead of a string.
    // this also ensures the event is only logged for direct $emit (source)
    // instead of by $dispatch/$broadcast
    if (typeof eventName === 'string') {
      const component = Livewire.components.componentsById[instanceId];

      bridge.send('event:triggered', stringify({
        eventName,
        type,
        payload,
        instanceId,
        instanceName: component.name || component.fingerprint.name,
        timestamp: Date.now()
      }))
    }
  }

  function wrap (method) {
    const original = Livewire.components[method]
    if (original) {
      Livewire.components[method] = function (...args) {
        const res = original.apply(this, args)
        if (recording) {
          logEvent(Livewire, method, args[0], args[1], args.slice(2))
        }
        return res
      }
    }
  }

  wrap('emit')
  wrap('emitUp')
  wrap('emitSelf')
  //wrap('$broadcast')
  //wrap('$dispatch')
}
