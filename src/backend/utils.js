export function findRelatedComponent (el) {
  while (!el.__livewire && el.parentElement) {
    el = el.parentElement
  }
  return el.__livewire
}
