// This is the backend that is injected into the page that a Vue app lives in
// when the Vue Devtools panel is activated.

import { highlight, unHighlight, getInstanceRect } from './highlighter'
import { initVuexBackend } from './vuex'
import { initEventsBackend } from './events'
import { findRelatedComponent } from './utils'
import { stringify, classify, camelize, set, parse, getComponentName } from '../util'
import ComponentSelector from './component-selector'
import SharedData, { init as initSharedData } from 'src/shared-data'

// hook should have been injected before this executes.
const hook = window.__LIVEWIRE_DEVTOOLS_GLOBAL_HOOK__
const rootInstances = []
const propModes = ['default', 'sync', 'once']

export const instanceMap = window.__LIVEWIRE_DEVTOOLS_INSTANCE_MAP__ = new Map()
const consoleBoundInstances = Array(5)
let currentInspectedId
let bridge
let filter = ''
let captureCount = 0
let isLegacy = false
let rootUID = 0

export function initBackend (_bridge) {
  bridge = _bridge
  if (hook.Livewire) {
    connect()
  } else {
    hook.once('init', connect)
  }

  initRightClick()
}

function connect () {
  if (typeof hook.Livewire === 'undefined') {
    return;
  }

  if (! hook.Livewire.devToolsEnabled) {
    return;
  }

  hook.currentTab = 'components'
  bridge.on('switch-tab', tab => {
    hook.currentTab = tab
    if (tab === 'components') {
      flush()
    }
  })

  // the backend may get injected to the same page multiple times
  // if the user closes and reopens the devtools.
  // make sure there's only one flush listener.
  hook.off('flush')
  hook.on('flush', () => {
    if (hook.currentTab === 'components') {
      flush()
    }
  })

  bridge.on('select-instance', id => {
    currentInspectedId = id
    const instance = hook.Livewire.components.componentsById[id]
    
    bindToConsole(instance)
    flush()
    bridge.send('instance-selected')
  })

  bridge.on('scroll-to-instance', id => {
    const instance = hook.Livewire.components.componentsById[id]
    instance && scrollIntoView(instance)
  })

  bridge.on('filter-instances', _filter => {
    filter = _filter.toLowerCase()
    flush()
  })

  bridge.on('vuex:travel-to-state', (payload) => {
    const parsedPayload = parse(payload);
    const parsedState = parsedPayload.state;

    Object.keys(parsedState).forEach(key => {
      hook.Livewire.components.componentsById[parsedPayload.component].set(key, parsedState[key]);
    })
  })

  bridge.on('refresh', scan)

  bridge.on('enter-instance', id => {
    let instance;

    try {
      instance = hook.Livewire.components.componentsById[id];
    } catch (err) {
      return;
    }

    highlight(instance)
  })

  bridge.on('leave-instance', unHighlight)

  // eslint-disable-next-line no-new
  new ComponentSelector(bridge, instanceMap)

  // Get the instance id that is targeted by context menu
  bridge.on('get-context-menu-target', () => {
    const instance = window.__LIVEWIRE_DEVTOOLS_CONTEXT_MENU_TARGET__

    window.__LIVEWIRE_DEVTOOLS_CONTEXT_MENU_TARGET__ = null
    window.__LIVEWIRE_DEVTOOLS_CONTEXT_MENU_HAS_TARGET__ = false

    if (instance) {
      const id = instance.__LIVEWIRE_DEVTOOLS_UID__
      if (id) {
        return bridge.send('inspect-instance', id)
      }
    }

    toast('No Vue component was found', 'warn')
  })

  bridge.on('set-instance-data', args => {
    setStateValue(args)
    flush()
  })

  initVuexBackend(hook, bridge)

  // events
  initEventsBackend(hook.Livewire, bridge)

  window.__LIVEWIRE_DEVTOOLS_INSPECT__ = inspectInstance

  const livewireHook = hook.Livewire.components.hooks.availableHooks.includes('responseReceived') ? 'responseReceived' : 'message.received';

  bridge.log('backend ready.')
  bridge.send('ready', livewireHook === 'message.received' ? '2.x' : '1.x') // TODO: Detect version
  console.log(
    `%c livewire-devtools %c Detected Livewire %c`,
    'background:#3182ce ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff',
    'background:#ed64a6 ; padding: 1px; border-radius: 0 3px 3px 0;  color: #fff',
    'background:transparent'
  )

  hook.Livewire.hook(livewireHook, (component, payload) => {
    flush();
  })

  scan()
}

/**
 * Scan the page for root level Vue instances.
 */

function scan () {
  rootInstances.length = 0
  hook.Livewire.components.components().forEach((component) => {
    rootInstances.push(component);
  })
  flush()
}

/**
 * DOM walk helper
 *
 * @param {NodeList} nodes
 * @param {Function} fn
 */

function walk (node, fn) {
  if (node.childNodes) {
    for (let i = 0, l = node.childNodes.length; i < l; i++) {
      const child = node.childNodes[i]
      const stop = fn(child)
      if (!stop) {
        walk(child, fn)
      }
    }
  }

  // also walk shadow DOM
  if (node.shadowRoot) {
    walk(node.shadowRoot, fn)
  }
}

/**
 * Called on every Vue.js batcher flush cycle.
 * Capture current component tree structure and the state
 * of the current inspected instance (if present) and
 * send it to the devtools.
 */

function flush () {
  let start
  if (process.env.NODE_ENV !== 'production') {
    captureCount = 0
    start = window.performance.now()
  }
  const payload = stringify({
    inspectedInstance: getInstanceDetails(currentInspectedId),
    instances: findQualifiedChildrenFromList(rootInstances)
  })
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[flush] serialized ${captureCount} instances, took ${window.performance.now() - start}ms.`)
  }
  bridge.send('flush', payload)
}

/**
 * Iterate through an array of instances and flatten it into
 * an array of qualified instances. This is a depth-first
 * traversal - e.g. if an instance is not matched, we will
 * recursively go deeper until a qualified child is found.
 *
 * @param {Array} instances
 * @return {Array}
 */

function findQualifiedChildrenFromList (instances) {
  return !filter
    ? instances.map(capture)
    : Array.prototype.concat.apply([], instances.map(findQualifiedChildren))
}

/**
 * Find qualified children from a single instance.
 * If the instance itself is qualified, just return itself.
 * This is ok because [].concat works in both cases.
 *
 * @param {Vue} instance
 * @return {Vue|Array}
 */

function findQualifiedChildren (instance) {
  return isQualified(instance)
    ? capture(instance)
    : findQualifiedChildrenFromList(instance.$children)
}

/**
 * Check if an instance is qualified.
 *
 * @param {Vue} instance
 * @return {Boolean}
 */

function isQualified (instance) {
  const name = classify(getInstanceName(instance)).toLowerCase()
  return name.indexOf(filter) > -1
}

/**
 * Capture the meta information of an instance. (recursive)
 *
 * @param {Vue} instance
 * @return {Object}
 */

function capture (instance, _, list) {
  if (process.env.NODE_ENV !== 'production') {
    captureCount++
  }
  // instance._uid is not reliable in devtools as there
  // may be 2 roots with same _uid which causes unexpected
  // behaviour
  instance.__LIVEWIRE_DEVTOOLS_UID__ = instance.id
  mark(instance)
  const ret = {
    id: instance.__LIVEWIRE_DEVTOOLS_UID__,
    name: instance.name,
    renderKey: null,
    inactive: false,
    isFragment: false,
    children: []
  }
  // record screen position to ensure correct ordering
  if ((!list || list.length > 1) && !instance._inactive) {
    const rect = getInstanceRect(instance)
    ret.top = rect ? rect.top : Infinity
  } else {
    ret.top = Infinity
  }
  // check if instance is available in console
  const consoleId = consoleBoundInstances.indexOf(instance.__LIVEWIRE_DEVTOOLS_UID__)
  ret.consoleId = consoleId > -1 ? '$vm' + consoleId : null
  return ret
}

/**
 * Mark an instance as captured and store it in the instance map.
 *
 * @param {Vue} instance
 */

function mark (instance) {
  if (!instanceMap.has(instance.__LIVEWIRE_DEVTOOLS_UID__)) {
    instanceMap.set(instance.__LIVEWIRE_DEVTOOLS_UID__, instance)
  }
}

/**
 * Get the detailed information of an inspected instance.
 *
 * @param {Number} id
 */

function getInstanceDetails (id) {
  let instance;

  try {
    instance = hook.Livewire.components.componentsById[id]
  } catch (err) {
    return {};
  }
  if (!instance) {
    return {}
  } else {
    return {
      id: id,
      name: instance.name || instance.fingerprint.name,
      state: getInstanceState(instance)
    }
  }
}

function getInstanceState (instance) {
  return processState(instance)
}

export function getCustomInstanceDetails (instance) {
  const state = getInstanceState(instance)
  return {
    _custom: {
      type: 'component',
      id: instance.__LIVEWIRE_DEVTOOLS_UID__,
      display: getInstanceName(instance),
      tooltip: 'Component instance',
      value: reduceStateList(state),
      fields: {
        abstract: true
      }
    }
  }
}

export function reduceStateList (list) {
  if (!list.length) {
    return undefined
  }
  return list.reduce((map, item) => {
    const key = item.type || 'data'
    const obj = map[key] = map[key] || {}
    obj[item.key] = item.value
    return map
  }, {})
}

/**
 * Get the appropriate display name for an instance.
 *
 * @param {Vue} instance
 * @return {String}
 */

export function getInstanceName (instance) {
  const name = getComponentName(instance.$options)
  if (name) return name
  return instance.$root === instance
    ? 'Root'
    : 'Anonymous Component'
}

/**
 * Process state, filtering out props and "clean" the result
 * with a JSON dance. This removes functions which can cause
 * errors during structured clone used by window.postMessage.
 *
 * @param {Vue} instance
 * @return {Array}
 */

function processState (instance) {
  return Object.keys(instance.data)
    .map(key => ({
      key,
      value: instance.data[key],
      editable: true
    }));
}

/**
 * Sroll a node into view.
 *
 * @param {Vue} instance
 */

function scrollIntoView (instance) {
  const rect = getInstanceRect(instance)
  if (rect) {
    window.scrollBy(0, rect.top + (rect.height - window.innerHeight) / 2)
  }
}

/**
 * Binds given instance in console as $vm0.
 * For compatibility reasons it also binds it as $vm.
 *
 * @param {Vue} instance
 */

function bindToConsole (instance) {
  const id = instance.__LIVEWIRE_DEVTOOLS_UID__
  const index = consoleBoundInstances.indexOf(id)
  if (index > -1) {
    consoleBoundInstances.splice(index, 1)
  } else {
    consoleBoundInstances.pop()
  }
  consoleBoundInstances.unshift(id)
  for (var i = 0; i < 5; i++) {
    window['$vm' + i] = instanceMap.get(consoleBoundInstances[i])
  }
  window.$vm = instance
}

/**
 * Returns a devtools unique id for instance.
 * @param {Vue} instance
 */
function getUniqueId (instance) {
  const rootVueId = instance.$root.__LIVEWIRE_DEVTOOLS_ROOT_UID__
  return `${rootVueId}:${instance._uid}`
}

function getRenderKey (value) {
  if (value == null) return
  const type = typeof value
  if (type === 'number') {
    return value
  } else if (type === 'string') {
    return `'${value}'`
  } else if (Array.isArray(value)) {
    return 'Array'
  } else {
    return 'Object'
  }
}

/**
 * Display a toast message.
 * @param {any} message HTML content
 */
export function toast (message, type = 'normal') {
  const fn = window.__LIVEWIRE_DEVTOOLS_TOAST__
  fn && fn(message, type)
}

export function inspectInstance (instance) {
  const id = instance.__LIVEWIRE_DEVTOOLS_UID__
  id && bridge.send('inspect-instance', id)
}

function setStateValue ({ id, path, value, newKey, remove }) {
  let instance;

  try {
    instance = hook.Livewire.components.componentsById[id]
  } catch (err) {
    //
  }
  if (instance) {
    try {
      let parsedValue
      if (value) {
        parsedValue = parse(value, true)
      }
      instance.set(path, parsedValue);
    } catch (e) {
      console.error(e)
    }
  }
}

function initRightClick () {
  // Start recording context menu when Livewire is detected
  // event if Livewire devtools are not loaded yet
  document.addEventListener('contextmenu', event => {
    const el = event.target
    if (el) {
      // Search for parent that "is" a component instance
      const instance = findRelatedComponent(el)
      if (instance) {
        window.__LIVEWIRE_DEVTOOLS_CONTEXT_MENU_HAS_TARGET__ = true
        window.__LIVEWIRE_DEVTOOLS_CONTEXT_MENU_TARGET__ = instance
        return
      }
    }
    window.__LIVEWIRE_DEVTOOLS_CONTEXT_MENU_HAS_TARGET__ = null
    window.__LIVEWIRE_DEVTOOLS_CONTEXT_MENU_TARGET__ = null
  })
}
