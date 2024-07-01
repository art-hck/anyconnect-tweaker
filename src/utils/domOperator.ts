export function domOperator<T = HTMLElement>(selector?) {
    let els;
    switch (typeof selector) {
        case "string":
            els = document.querySelectorAll(selector);
            break;
        case "object":
            els = [selector ?? window];
            break;
        case "function":
            window.addEventListener('DOMContentLoaded', selector);
            break;
    }

    const $ = {
        on: (e: keyof HTMLElementEventMap | string, listener: <G>(this: T, evt: Event) => void) => {
            els?.forEach(item => item.addEventListener(e, listener.bind(item)));
            return $;
        },
        get: <T = HTMLElement>(index = 0) => els[index] as T,
        checked: (checked: boolean) => {
            if (els?.[0]) {
                els[0].checked = checked;
                els[0].dispatchEvent(new Event('change'))
            }
            return $;
        },
        value: (v) => {
            if (els?.[0]) {
                els[0].value = v;
                els[0].dispatchEvent(new Event('change'))
            }
            return $;
        },
        serialize: <T>() => Object.fromEntries(new FormData(els[0])) as unknown as T
    }
    return $;
}
