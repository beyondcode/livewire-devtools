import { stringify } from '../util'
import { getInstanceName } from './index'

export function initEventsBackend (Livewire, bridge) {
  let recording = true

  bridge.on('events:toggle-recording', enabled => {
    recording = enabled
  })

  function logEvent(Livewire, type, instance, eventName, payload) {
    // The string check is important for compat with 1.x where the first
    // argument may be an object instead of a string.
    // this also ensures the event is only logged for direct $emit (source)
    // instead of by $dispatch/$broadcast
    if (typeof eventName === 'string') {

      let instanceId;
      let instanceName = 'unknown';

      if (instance !== null) {
        let component = Livewire.components.componentsById[instanceId];
        instanceId = instance.getAttribute('wire:id');
        instanceName = component.name || component.fingerprint.name
      }

      bridge.send('event:triggered', stringify({
        eventName,
        type,
        payload,
        instanceId,
        instanceName,
        timestamp: Date.now()
      }))
    }
  }

  function wrapEmit () {
    const original = Livewire.components['emit']

    Livewire.components['emit'] = function (...args) {
      const res = original.apply(this, args)
      if (recording) {
        logEvent(Livewire, 'emit', null, args[0], args.slice(1))
      }
      return res
    }
  }

  wrapEmit();
  // wrap('emitUp')
  // wrap('emitSelf')
  // wrap('$broadcast')
  // wrap('$dispatch')
}
