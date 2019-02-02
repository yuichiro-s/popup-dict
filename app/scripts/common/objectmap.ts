export function get<T>(obj: { [key: string]: T }, key: string): T | undefined  {
    if (has(obj, key)) {
        return obj[key];
    } else {
        return undefined;
    }
}

export function has(obj: Object, key: string): boolean {
    return obj.hasOwnProperty(key);
}