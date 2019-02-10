const beforeunloadListener = (e: Event) => {
    e.preventDefault();
    e.returnValue = false;
};

export function preventUnload(value: boolean) {
    if (value) {
        window.onbeforeunload = beforeunloadListener;
    } else {
        window.onbeforeunload = null;
    }
}
