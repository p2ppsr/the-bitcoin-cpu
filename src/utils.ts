import { HashedMap } from 'scrypt-ts'

/**
 * Verify a variable is not null or undefined.
 * If the variable is null or undefined, this function will throw an error.
 *
 * @param {T | null | undefined} v - Variable to be verified
 * @returns {T} - Returns the variable if it is neither null nor undefined.
 * @throws {Error} - Throws an error if the truthy value could not be verified.
 */
export const verifyTruthy = <T>(v: T | null | undefined): T => {
    if (v == null) {
        throw new Error('A bad thing has happened.')
    }
    return v
}

export const serializeHashedMap = (h: HashedMap<bigint, bigint>): string => {
    const out = []
    for (let i = 0; i < h.size; i++) {
        out[i] = String(h.get(BigInt(i)))
    }
    return JSON.stringify(out)
}

export const deserializeHashedMap = (s: string): HashedMap<bigint, bigint> => {
    const parsed = JSON.parse(s)
    const out = new HashedMap<bigint, bigint>()
    for (let i = 0; i < parsed.length; i++) {
        out.set(BigInt(i), BigInt(parsed[i]))
    }
    return out
}
