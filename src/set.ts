export function truncateSet<T>(set: Set<T>, maxSize: number): Set<T>{
    if (set.size <= maxSize) {
        return set;
    }
    const iterator = set.values();
    for (let i = 0; i < set.size - maxSize; ++i) {
        iterator.next();
    }
    return new Set(iterator);
}