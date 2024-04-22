import { toByteString, byteString2Int } from 'scrypt-ts'

const opcodes = {
    // Arithmetic
    NOP: 0n,
    ADD: 1n,
    SUB: 2n,
    MUL: 3n,
    DIV: 4n,
    MOD: 5n,
    LENGTH: 7n,
    SPLIT: 8n,
    CAT: 9n,

    // Memory and IO
    LOADMEM: 10n,
    LOADIMMEDIATE1: 11n,
    LOADIMMEDIATE2: 12n,
    LOADIMMEDIATE3: 13n,
    LOADIMMEDIATE4: 14n,
    PRINT: 17n,
    READ: 18n,
    STORE: 19n,

    // Control flow
    JMP: 20n,
    JZR: 21n,
    JNZ: 22n,
    JEQ: 23n,
    JNE: 24n,

    // Subroutines
    SETBASE: 30n,
    JSR: 31n,
    JSZ: 32n,
    JSNZ: 33n,
    RSR: 38n,
    CLEARBASE: 39n,

    // Lifecycle
    CHECKPOINT: 40n,
    AMOUNT: 41n,
    PAY: 42n,
    BILL: 43n,
    PAYBILL: 44n,
    PAYANY: 45n,
    LOSE: 48n,
    WIN: 49n,

    // Data
    SHA256: 50n,
    HASH256: 51n,
    RIPEMD160: 52n,
    HASH160: 53n,
    SHA1: 54n,
    RANDOM: 58n,
    CHECKDATASIG: 59n,

    // Logic
    NEGATE: 60n,
    AND: 61n,
    OR: 62n,
    XOR: 63n,
    EQUAL: 64n,
    ABS: 65n,
    NOTEQUAL: 66n,
    LSHIFT: 67n,
    RSHIFT: 68n,

    // Comparison,
    LESSTHAN: 70n,
    GREATERTHAN: 71n,
    LESSTHANOREQUAL: 72n,
    GREATERTHANOREQUAL: 73n,
    MIN: 74n,
    MAX: 75n,
    WITHIN: 76n,

    // Stack
    PUSHIMMEDIATE: 80n,
    PUSH1: 81n,
    PUSH2: 82n,
    PUSH3: 83n,
    PUSH4: 84n,
    DUP: 89n,
    DROP: 90n,
    POP1: 91n,
    POP2: 92n,
    POP3: 93n,
    POP4: 94n,

    // Registers
    MOV12: 112n,
    MOV13: 113n,
    MOV14: 114n,
    MOV21: 121n,
    MOV23: 123n,
    MOV24: 124n,
    MOV31: 131n,
    MOV32: 132n,
    MOV34: 134n,
    MOV41: 141n,
    MOV42: 142n,
    MOV43: 143n
}

const isRegister = (name: string): boolean => name === '1' || name === '2' || name === '3' || name === '4'

const assembleRegisterName = (name: string): '1' | '2' | '3' | '4' => {
    name = name.toLowerCase()
    if (name.startsWith('r')) name = name.substring(1)
    if (!isRegister(name)) {
        throw new Error(`Invalid register: ${name}`)
    }
    return name as '1' | '2' | '3' | '4'
}

const assembleValue = (value: string, labels: Record<string, bigint>, permitUnknownLabel: boolean): bigint => {
    if (value.startsWith('0x')) {
        return byteString2Int(toByteString(value.substring(2), false))
    } else if (value.startsWith('"')) {
        if (!value.endsWith('"')) {
            throw new Error(`Unterminated string: ${value}`)
        }
        value = value.substring(1, value.length - 1)
        return byteString2Int(toByteString(value, true))
    } else if (value === 'true') {
        return 1n
    } else if (value === 'false') {
        return 0n
    }
    const regex = /^[0-9]*$/
    if (regex.test(value)) {
        return BigInt(value)
    }
    if (typeof labels[value] !== 'undefined') {
        return labels[value]
    } else if (permitUnknownLabel) {
        return 0n
    } else {
        throw new Error(`Unknown value: ${value}`)
    }
}

const removeComments = (code: string): string => {
    let result = ""
    let inString = false
    let escapeNext = false

    for (let i = 0; i < code.length; i++) {
        const char = code[i]
        const nextChar = i + 1 < code.length ? code[i + 1] : null

        // Handle escape character within a string
        if (inString && char === "\\" && !escapeNext) {
            escapeNext = true
            result += char
            continue
        }

        // Toggle inString state
        if (char === '"' && !escapeNext) {
            inString = !inString
        }

        escapeNext = false

        // Break the loop if a comment start is detected outside of a string
        if (!inString && (char === '#' || (char === ';' && (nextChar === null || nextChar === ' ')))) {
            break
        }

        // Add character to result if not part of a comment
        result += char
    }

    return result
}

const assembleLine = (line: string, labels: Record<string, bigint>, permitUnknownLabel: boolean): bigint[] => {
    line = removeComments(line)
    line = line.trim()
    if (line.length < 1) {
        return []
    }
    const op = line.split(' ')[0].toUpperCase()
    // handle mov
    if (op === 'MOV') {
        const source = assembleRegisterName(line.split(' ')[1])
        const destination = assembleRegisterName(line.split(' ')[2])
        const op = `MOV${source}${destination}` as 'MOV12' | 'MOV13' | 'MOV14' // ...
        return [opcodes[op]]
    }
    // handle immediate load
    if (op === 'LOAD') {
        const [, dest, ...value] = line.split(' ')
        const destination = assembleRegisterName(dest)
        const op = `LOADIMMEDIATE${destination}` as 'LOADIMMEDIATE1' | 'LOADIMMEDIATE2' // ...
        return [
            opcodes[op],
            assembleValue(value.join(' '), labels, permitUnknownLabel)
        ]
    }
    // handle push
    if (op === 'PUSH') {
        let first = line.split(' ')[1].toLowerCase()
        if (first.startsWith('r')) first = first.substring(1)
        if (isRegister(first)) {
            return [opcodes[`PUSH${first as '1' | '2' | '3' | '4'}`]]
        } else {
            const [, ...value] = line.split(' ')
            return [
                opcodes.PUSHIMMEDIATE,
                assembleValue(value.join(' '), labels, permitUnknownLabel)
            ]
        }
    }
    // handle pop
    if (op === 'POP') {
        let first = line.split(' ')[1].toLowerCase()
        if (first.startsWith('r')) first = first.substring(1)
        if (isRegister(first)) {
            return [opcodes[`POP${first as '1' | '2' | '3' | '4'}`]]
        } else {
            throw new Error('Illegal register name for push.')
        }
    }

    // Handle all other opcodes, which have no operand
    const opcode = opcodes[op as 'ADD' | 'SUB' | 'MUL'] // ...
    if (typeof opcode === 'undefined') {
        throw new Error(`Invalid opcode: ${op}`)
    }
    return [opcode]
}

export default function assembleProgram(program: string): bigint[] {
    const labels: Record<string, bigint> = {}
    let results: bigint[] = []
    const lines = program.split('\n')
    // First pass to obtain label addresses
    for (let line of lines) {
        if (line.startsWith(':')) {
            const [labelWithColon, ...parts] = line.split(' ')
            const label = labelWithColon.substring(1)
            if (labels[label]) {
                throw new Error(`Duplicate label: ${label}`)
            }
            const regex = /^[a-zA-Z][a-zA-Z0-9_]*$/
            if (!regex.test(label)) {
                throw new Error(`Illegal label identifier: ${label}`)
            }
            labels[label] = BigInt(results.length)
            line = parts.join(' ')
        }
        const assembledLine = assembleLine(line, labels, true)
        results = results.concat(assembledLine)
    }
    // Second pass, assembling the program for real
    results = []
    for (let line of lines) {
        if (line.startsWith(':')) {
            const [, ...parts] = line.split(' ')
            line = parts.join(' ')
        }
        const assembledLine = assembleLine(line, labels, false)
        results = results.concat(assembledLine)
    }
    return results
}
