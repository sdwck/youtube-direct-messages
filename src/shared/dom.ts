export function clearElement(el: HTMLElement) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}