export function get<T>(obj: { [key: string]: T }, key: string): T | undefined {
    if (has(obj, key)) {
        return obj[key];
    } else {
        return undefined;
    }
}

export function has(obj: object, key: string): boolean {
    return obj.hasOwnProperty(key);
}

export function keys(obj: object) {
    const result = [];
    for (const key in obj) {
        if (has(obj, key)) {
            result.push(key);
        }
    }
    return result;
}
