import {
    SmartContract, method, prop, assert, hash256, SigHash, HashedMap, abs, and, or, xor, lshift, rshift, min, max, within, len,
    hash160, sha1, sha256, Sha256, ripemd160, Utils, int2ByteString, byteString2Int, PubKey, toByteString, Sig, slice
} from 'scrypt-ts'
import { BlockHeader, Blockchain, MerkleProof } from 'scrypt-ts-lib'

export default class CPU extends SmartContract {
    static readonly SOLVER_TIMEOUT: bigint = 4n

    // Arithmetic
    static readonly OP_NOP: bigint = 0n
    static readonly OP_ADD: bigint = 1n
    static readonly OP_SUB: bigint = 2n
    static readonly OP_MUL: bigint = 3n
    static readonly OP_DIV: bigint = 4n
    static readonly OP_MOD: bigint = 5n
    static readonly OP_LENGTH: bigint = 7n
    static readonly OP_SPLIT: bigint = 8n
    static readonly OP_CAT: bigint = 9n

    // Memory and IO
    static readonly OP_LOADMEM: bigint = 10n
    static readonly OP_LOADIMMEDIATE1: bigint = 11n
    static readonly OP_LOADIMMEDIATE2: bigint = 12n
    static readonly OP_LOADIMMEDIATE3: bigint = 13n
    static readonly OP_LOADIMMEDIATE4: bigint = 14n
    static readonly OP_PRINT: bigint = 17n
    static readonly OP_READ: bigint = 18n
    static readonly OP_STORE: bigint = 19n

    // Control flow
    static readonly OP_JMP: bigint = 20n
    static readonly OP_JZR: bigint = 21n
    static readonly OP_JNZ: bigint = 22n
    static readonly OP_JEQ: bigint = 23n
    static readonly OP_JNE: bigint = 24n

    // Subroutines
    static readonly OP_SETBASE: bigint = 30n
    static readonly OP_JSR: bigint = 31n
    static readonly OP_JSZ: bigint = 32n
    static readonly OP_JSNZ: bigint = 33n
    static readonly OP_RSR: bigint = 38n
    static readonly OP_CLEARBASE: bigint = 39n

    // Lifecycle
    static readonly OP_CHECKPOINT: bigint = 40n
    static readonly OP_AMOUNT: bigint = 41n
    static readonly OP_PAY: bigint = 42n
    static readonly OP_BILL: bigint = 43n
    static readonly OP_PAYBILL: bigint = 44n
    static readonly OP_PAYANY: bigint = 45n
    static readonly OP_LOSE: bigint = 48n
    static readonly OP_WIN: bigint = 49n

    // Data
    static readonly OP_SHA256: bigint = 50n
    static readonly OP_HASH256: bigint = 51n
    static readonly OP_RIPEMD160: bigint = 52n
    static readonly OP_HASH160: bigint = 53n
    static readonly OP_SHA1: bigint = 54n
    static readonly OP_RANDOM: bigint = 58n
    static readonly OP_CHECKDATASIG: bigint = 59n

    // Logic
    static readonly OP_NEGATE: bigint = 60n
    static readonly OP_AND: bigint = 61n
    static readonly OP_OR: bigint = 62n
    static readonly OP_XOR: bigint = 63n
    static readonly OP_EQUAL: bigint = 64n
    static readonly OP_ABS: bigint = 65n
    static readonly OP_NOTEQUAL: bigint = 66n
    static readonly OP_LSHIFT: bigint = 67n
    static readonly OP_RSHIFT: bigint = 68n

    // Comparison
    static readonly OP_LESSTHAN: bigint = 70n
    static readonly OP_GREATERTHAN: bigint = 71n
    static readonly OP_LESSTHANOREQUAL: bigint = 72n
    static readonly OP_GREATERTHANOREQUAL: bigint = 73n
    static readonly OP_MIN: bigint = 74n
    static readonly OP_MAX: bigint = 75n
    static readonly OP_WITHIN: bigint = 76n

    // Stack
    static readonly OP_PUSHIMMEDIATE: bigint = 80n
    static readonly OP_PUSH1: bigint = 81n
    static readonly OP_PUSH2: bigint = 82n
    static readonly OP_PUSH3: bigint = 83n
    static readonly OP_PUSH4: bigint = 84n
    static readonly OP_DUP: bigint = 89n
    static readonly OP_DROP: bigint = 90n
    static readonly OP_POP1: bigint = 91n
    static readonly OP_POP2: bigint = 92n
    static readonly OP_POP3: bigint = 93n
    static readonly OP_POP4: bigint = 94n

    // Registers
    static readonly OP_MOV12: bigint = 112n
    static readonly OP_MOV13: bigint = 113n
    static readonly OP_MOV14: bigint = 114n
    static readonly OP_MOV21: bigint = 121n
    static readonly OP_MOV23: bigint = 123n
    static readonly OP_MOV24: bigint = 124n
    static readonly OP_MOV31: bigint = 131n
    static readonly OP_MOV32: bigint = 132n
    static readonly OP_MOV34: bigint = 134n
    static readonly OP_MOV41: bigint = 141n
    static readonly OP_MOV42: bigint = 142n
    static readonly OP_MOV43: bigint = 143n

    @prop(true) isBeingSolved: bigint
    @prop(true) currentSolver: PubKey
    @prop(true) bountyMultiplier: bigint
    @prop(true) timeUntilStaleSolution: bigint

    @prop(true) heap: HashedMap<bigint, bigint>
    @prop(true) initialHeap: HashedMap<bigint, bigint>
    @prop(true) stack: HashedMap<bigint, bigint>
    @prop(true) initialStack: HashedMap<bigint, bigint>
    @prop(true) callStack: HashedMap<bigint, bigint>
    @prop(true) initialCallStack: HashedMap<bigint, bigint>
    @prop(true) callStackPointer: bigint
    @prop(true) initialCallStackPointer: bigint
    @prop(true) stackPointer: bigint
    @prop(true) initialStackPointer: bigint
    @prop(true) basePointer: bigint
    @prop(true) initialBasePointer: bigint
    @prop(true) executionPointer: bigint
    @prop(true) initialExecutionPointer: bigint
    @prop(true) r1: bigint
    @prop(true) r2: bigint
    @prop(true) r3: bigint
    @prop(true) r4: bigint
    @prop(true) initialR1: bigint
    @prop(true) initialR2: bigint
    @prop(true) initialR3: bigint
    @prop(true) initialR4: bigint

    constructor(memory: HashedMap<bigint, bigint>, stack: HashedMap<bigint, bigint>, callStack: HashedMap<bigint, bigint>) {
        super(...arguments)

        this.isBeingSolved = 0n
        this.currentSolver = PubKey(toByteString('deadbeef', true))
        this.bountyMultiplier = 2n
        this.timeUntilStaleSolution = 0n

        this.heap = memory
        this.initialHeap = memory
        this.executionPointer = 0n
        this.initialExecutionPointer = 0n
        this.stackPointer = 0n
        this.initialStackPointer = 0n
        this.callStackPointer = 0n
        this.initialCallStackPointer = 0n
        this.basePointer = 0n
        this.initialBasePointer = 0n
        stack.clear()
        this.stack = stack
        this.initialStack = stack
        callStack.clear()
        this.callStack = callStack
        this.initialCallStack = callStack
        this.callStackPointer = 0n
        this.r1 = 0n
        this.r2 = 0n
        this.r3 = 0n
        this.r4 = 0n
        this.initialR1 = 0n
        this.initialR2 = 0n
        this.initialR3 = 0n
        this.initialR4 = 0n
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public increaseBounty(amount: bigint) {
        assert(this.isBeingSolved === 0n, 'Cannot increase bounty while the puzzle is being solved.')
        assert(amount > 0n, 'Bounty must be increased by a positive amount.')
        const output = this.buildStateOutput(this.ctx.utxo.value + amount)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must the same script as the old one.')
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public startSolving(solver: PubKey, sig: Sig, currentBlockHeight: bigint) {
        assert(currentBlockHeight > 750000n && currentBlockHeight < 500000000n, 'The current block height must be valid.')
        assert(this.isBeingSolved === 0n, 'Somebody else is currently attempting to solve.')
        assert(this.checkSig(sig, solver), 'You must sign with the solver public key.')
        this.solutionHelper(solver, currentBlockHeight)
        const output = this.buildStateOutput(this.ctx.utxo.value * this.bountyMultiplier)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    solutionHelper(solver: PubKey, currentBlockHeight: bigint): void {
        this.currentSolver = solver
        this.timeUntilStaleSolution = currentBlockHeight + CPU.SOLVER_TIMEOUT
        this.isBeingSolved = 1n
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public recoverFromFailedSolution(solver: PubKey, sig: Sig, currentBlockHeight: bigint) {
        assert(currentBlockHeight > 750000n && currentBlockHeight < 500000000n, 'The current block height must be valid.')
        assert(this.isBeingSolved === 1n, 'No one has yet attempted to find a solution.')
        assert(this.checkSig(sig, solver), 'You must sign with the solver public key.')
        assert(this.timeLock(this.timeUntilStaleSolution), 'The current solver has not yet failed to solve.')
        this.solutionHelper(solver, currentBlockHeight)
        this.resetState() // TODO: Make sure this works!!!!
        const output = this.buildStateOutput(this.ctx.utxo.value * this.bountyMultiplier)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    resetState(): void {
        this.stack = this.initialStack
        this.stackPointer = this.initialStackPointer
        this.heap = this.initialHeap
        this.executionPointer = this.initialExecutionPointer
        this.basePointer = this.initialBasePointer
        this.r1 = this.initialR1
        this.r2 = this.initialR2
        this.r3 = this.initialR3
        this.r4 = this.initialR4
        this.callStack = this.initialCallStack
        this.callStackPointer = this.initialCallStackPointer
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public add(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_ADD)
        this.r3 = this.r1 + this.r2
        this.executionPointer++

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    addHelper(): void {
        this.r3 = this.r1 + this.r2
        this.executionPointer++
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public sub(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_SUB)
        this.r3 = this.r1 - this.r2
        this.executionPointer++

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    subHelper(): void {
        this.r3 = this.r1 - this.r2
        this.executionPointer++
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public mul(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_MUL)
        this.r3 = this.r1 * this.r2
        this.executionPointer++

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    mulHelper(): void {
        this.r3 = this.r1 * this.r2
        this.executionPointer++
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public div(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_DIV)
        this.r3 = this.r1 / this.r2
        this.executionPointer++

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    divHelper(): void {
        this.r3 = this.r1 / this.r2
        this.executionPointer++
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public mod(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_MOD)
        this.r3 = this.r1 % this.r2
        this.executionPointer++

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    modHelper(): void {
        this.r3 = this.r1 % this.r2
        this.executionPointer++
    }

    // Byte String length of r1 is pushed in r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public length(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_LENGTH)
        this.r2 = len(int2ByteString(this.r1))
        this.executionPointer++

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    lengthHelper(): void {
        this.r2 = len(int2ByteString(this.r1))
        this.executionPointer++
    }

    // Splits r1 at position r2 into r3 and r4
    @method(SigHash.ANYONECANPAY_SINGLE)
    public split(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_SPLIT)
        const str = int2ByteString(this.r1)
        this.r3 = byteString2Int(slice(str, 0n, this.r2))
        this.r4 = byteString2Int(slice(str, this.r2))
        this.executionPointer++

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    splitHelper(): void {
        const str = int2ByteString(this.r1)
        this.r3 = byteString2Int(slice(str, 0n, this.r2))
        this.r4 = byteString2Int(slice(str, this.r2))
        this.executionPointer++
    }

    // Concatenates r1 and r2 to form r3
    @method(SigHash.ANYONECANPAY_SINGLE)
    public cat(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_CAT)
        this.r3 = byteString2Int(int2ByteString(this.r1) + int2ByteString(this.r2))
        this.executionPointer++

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    catHelper(): void {
        this.r3 = byteString2Int(int2ByteString(this.r1) + int2ByteString(this.r2))
        this.executionPointer++
    }

    // Load the value from the program into r1
    @method(SigHash.ANYONECANPAY_SINGLE)
    public loadImmediate1(currentInstruction: bigint, value: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(this.heap.canGet(this.executionPointer + 1n, value))
        assert(currentInstruction === CPU.OP_LOADIMMEDIATE1)
        this.r1 = value
        this.executionPointer += 2n

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    loadImmediate1Helper(value: bigint): void {
        this.r1 = value
        this.executionPointer += 2n
    }

    // Load the value from the program into r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public loadImmediate2(currentInstruction: bigint, value: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(this.heap.canGet(this.executionPointer + 1n, value))
        assert(currentInstruction === CPU.OP_LOADIMMEDIATE2)
        this.r2 = value
        this.executionPointer += 2n

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    loadImmediate2Helper(value: bigint): void {
        this.r2 = value
        this.executionPointer += 2n
    }

    // Load the value from the program into r3
    @method(SigHash.ANYONECANPAY_SINGLE)
    public loadImmediate3(currentInstruction: bigint, value: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(this.heap.canGet(this.executionPointer + 1n, value))
        assert(currentInstruction === CPU.OP_LOADIMMEDIATE3)
        this.r3 = value
        this.executionPointer += 2n

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    loadImmediate3Helper(value: bigint): void {
        this.r3 = value
        this.executionPointer += 2n
    }

    // Load the value from the program into r4
    @method(SigHash.ANYONECANPAY_SINGLE)
    public loadImmediate4(currentInstruction: bigint, value: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(this.heap.canGet(this.executionPointer + 1n, value))
        assert(currentInstruction === CPU.OP_LOADIMMEDIATE4)
        this.r4 = value
        this.executionPointer += 2n

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    loadImmediate4Helper(value: bigint): void {
        this.r4 = value
        this.executionPointer += 2n
    }

    // push the value from the program into the stack
    @method(SigHash.ANYONECANPAY_SINGLE)
    public pushImmediate(currentInstruction: bigint, value: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(this.heap.canGet(this.executionPointer + 1n, value))
        assert(currentInstruction === CPU.OP_PUSHIMMEDIATE)
        this.stack.set(this.stackPointer, value)
        this.stackPointer++
        this.executionPointer += 2n

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    pushImmediateHelper(value: bigint): void {
        this.stack.set(this.stackPointer, value)
        this.stackPointer++
        this.executionPointer += 2n
    }

    // Load the value from memory address r2 into r1
    @method(SigHash.ANYONECANPAY_SINGLE)
    public loadMem(currentInstruction: bigint, value: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_LOADMEM)
        assert(this.heap.canGet(this.r2, value))
        this.r1 = value
        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    loadMemHelper(value: bigint): void {
        this.r1 = value
        this.executionPointer++
    }

    // Store the value in r2 into the address in r1
    @method(SigHash.ANYONECANPAY_SINGLE)
    public store(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_STORE)
        this.heap.set(this.r1, this.r2)
        this.executionPointer++

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    storeHelper(): void {
        this.heap.set(this.r1, this.r2)
        this.executionPointer++
    }

    // Tells the terminal to print a value onto the screen from r1
    @method(SigHash.ANYONECANPAY_SINGLE)
    public print(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_PRINT)
        this.executionPointer++

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    printHelper(): void {
        this.executionPointer++
    }

    // reads the value from the keyboard into r1
    @method(SigHash.ANYONECANPAY_SINGLE)
    public read(currentInstruction: bigint, value: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_READ)
        this.r1 = value
        this.executionPointer++

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    readHelper(value: bigint): void {
        this.r1 = value
        this.executionPointer++
    }

    // jumps to address in r1 if r2 is zero
    @method(SigHash.ANYONECANPAY_SINGLE)
    public jzr(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_JZR)
        if (this.r2 === 0n) {
            this.executionPointer = this.r1
        } else {
            this.executionPointer++
        }

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    jzrHelper(): void {
        if (this.r2 === 0n) {
            this.executionPointer = this.r1
        } else {
            this.executionPointer++
        }
    }

    // jumps to address in r1
    @method(SigHash.ANYONECANPAY_SINGLE)
    public jmp(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_JMP)
        this.executionPointer = this.r1
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    jmpHelper(): void {
        this.executionPointer = this.r1
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public mov12(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_MOV12)
        this.r2 = this.r1
        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public mov13(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_MOV13)
        this.r3 = this.r1
        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public mov14(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_MOV14)
        this.r4 = this.r1
        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public mov21(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_MOV21)
        this.r1 = this.r2
        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public mov23(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_MOV23)
        this.r3 = this.r2
        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public mov24(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_MOV24)
        this.r4 = this.r2
        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public mov31(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_MOV31)
        this.r1 = this.r3
        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public mov32(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_MOV32)
        this.r2 = this.r3
        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public mov34(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_MOV34)
        this.r4 = this.r3
        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public mov41(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_MOV41)
        this.r4 = this.r1
        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public mov42(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_MOV42)
        this.r4 = this.r2
        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method(SigHash.ANYONECANPAY_SINGLE)
    public mov43(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_MOV43)
        this.r3 = this.r4
        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    mov1Helper(value: bigint): void {
        this.r1 = value
        this.executionPointer++
    }

    @method()
    mov2Helper(value: bigint): void {
        this.r2 = value
        this.executionPointer++
    }

    @method()
    mov3Helper(value: bigint): void {
        this.r3 = value
        this.executionPointer++
    }

    @method()
    mov4Helper(value: bigint): void {
        this.r4 = value
        this.executionPointer++
    }

    // Win the bounty in the contract
    @method(SigHash.ANYONECANPAY_NONE)
    public win(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_WIN)
    }

    // jumps to address in r1 if r2 is not zero
    @method(SigHash.ANYONECANPAY_SINGLE)
    public jnz(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_JNZ)
        if (this.r2 !== 0n) {
            this.executionPointer = this.r1
        } else {
            this.executionPointer++
        }

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    jnzHelper(): void {
        if (this.r2 !== 0n) {
            this.executionPointer = this.r1
        } else {
            this.executionPointer++
        }
    }

    // jumps to address in r1 after saving execution pointer on stack
    @method(SigHash.ANYONECANPAY_SINGLE)
    public jsr(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_JSR)
        this.callStack.set(this.callStackPointer, this.executionPointer)
        this.callStackPointer++
        this.executionPointer = this.r1

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    jsrHelper(): void {
        this.callStack.set(this.callStackPointer, this.executionPointer)
        this.callStackPointer++
        this.executionPointer = this.r1
    }

    // jumps to address on stack after removing it
    @method(SigHash.ANYONECANPAY_SINGLE)
    public rsr(currentInstruction: bigint, returnAddress: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_RSR)
        this.callStackPointer--
        assert(this.callStack.canGet(this.callStackPointer, returnAddress))
        this.executionPointer = returnAddress + 1n

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    rsrHelper(returnAddress: bigint): void {
        this.executionPointer = returnAddress + 1n
        this.callStackPointer--
    }

    // jumps to address in r1 after saving execution pointer on stack if r2 is zero
    @method(SigHash.ANYONECANPAY_SINGLE)
    public jsz(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_JSZ)
        if (this.r2 === 0n) {
            this.callStack.set(this.callStackPointer, this.executionPointer)
            this.callStackPointer++
            this.executionPointer = this.r1
        } else {
            this.executionPointer++
        }

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    jszHelper(): void {
        if (this.r2 === 0n) {
            this.callStack.set(this.callStackPointer, this.executionPointer)
            this.callStackPointer++
            this.executionPointer = this.r1
        } else {
            this.executionPointer++
        }
    }

    // jumps to address in r1 after saving execution pointer on stack if r2 is not zero
    @method(SigHash.ANYONECANPAY_SINGLE)
    public jsnz(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_JSNZ)
        if (this.r2 !== 0n) {
            this.callStack.set(this.callStackPointer, this.executionPointer)
            this.callStackPointer++
            this.executionPointer = this.r1
        } else {
            this.executionPointer++
        }

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    jsnzHelper(): void {
        if (this.r2 !== 0n) {
            this.callStack.set(this.callStackPointer, this.executionPointer)
            this.callStackPointer++
            this.executionPointer = this.r1
        } else {
            this.executionPointer++
        }
    }

    // jumps to address in r1 if r2 equals r3
    @method(SigHash.ANYONECANPAY_SINGLE)
    public jeq(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_JEQ)
        if (this.r2 === this.r3) {
            this.executionPointer = this.r1
        } else {
            this.executionPointer++
        }

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    jeqHelper(): void {
        if (this.r2 === this.r3) {
            this.executionPointer = this.r1
        } else {
            this.executionPointer++
        }
    }

    // jumps to address in r1 if r2 does not equal r3
    @method(SigHash.ANYONECANPAY_SINGLE)
    public jne(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_JNE)
        if (this.r2 !== this.r3) {
            this.executionPointer = this.r1
        } else {
            this.executionPointer++
        }

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    jneHelper(): void {
        if (this.r2 !== this.r3) {
            this.executionPointer = this.r1
        } else {
            this.executionPointer++
        }
    }

    // checkpoint and save your progress in a contract, preventing it from resetting
    @method(SigHash.ANYONECANPAY_SINGLE)
    public checkpoint(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_CHECKPOINT)

        this.executionPointer++
        this.initialHeap = this.heap
        this.initialStack = this.stack
        this.initialBasePointer = this.basePointer
        this.initialStackPointer = this.stackPointer
        this.initialExecutionPointer = this.executionPointer
        this.initialR1 = this.r1
        this.initialR2 = this.r2
        this.initialR3 = this.r3
        this.initialR4 = this.r4
        this.initialCallStack = this.callStack
        this.initialCallStackPointer = this.callStackPointer

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    checkpointHelper(): void {
        this.executionPointer++
        this.initialHeap = this.heap
        this.initialStack = this.stack
        this.initialBasePointer = this.basePointer
        this.initialStackPointer = this.stackPointer
        this.initialExecutionPointer = this.executionPointer
        this.initialR1 = this.r1
        this.initialR2 = this.r2
        this.initialR3 = this.r3
        this.initialR4 = this.r4
        this.initialCallStack = this.callStack
        this.initialCallStackPointer = this.callStackPointer
    }

    // loads the amount of the contract into r1
    @method(SigHash.ANYONECANPAY_SINGLE)
    public amount(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_AMOUNT)

        this.r1 = this.ctx.utxo.value
        this.executionPointer++

        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    amountHelper(): void {
        this.r1 = this.ctx.utxo.value
        this.executionPointer++
    }

    // pays the amount in r1 from the contract to the script in r2
    @method(SigHash.ANYONECANPAY_ALL)
    public pay(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_PAY)

        this.executionPointer++
        const outputs = this.buildStateOutput(this.ctx.utxo.value - this.r1) + Utils.buildOutput(int2ByteString(this.r2), this.r1)
        assert(this.ctx.hashOutputs === hash256(outputs), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    payHelper(): void {
        this.executionPointer++
    }

    // bills the amount in r1 as an additional cost to continue the contract
    @method(SigHash.ANYONECANPAY_SINGLE)
    public bill(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_BILL)

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value + this.r1)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    billHelper(): void {
        this.executionPointer++
    }

    // pays the amount in r1 to the script in r2 while keeping the contract balance the same
    @method(SigHash.ANYONECANPAY_ALL)
    public payBill(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_PAYBILL)

        this.executionPointer++
        const outputs = this.buildStateOutput(this.ctx.utxo.value) + Utils.buildOutput(int2ByteString(this.r2), this.r1)
        assert(this.ctx.hashOutputs === hash256(outputs), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    payBillHelper(): void {
        this.executionPointer++
    }

    // pays the amount in r1 to the person executing the code
    @method(SigHash.ANYONECANPAY_SINGLE)
    public payAny(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_PAYANY)

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value - this.r1)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    payAnyHelper(): void {
        this.executionPointer++
    }

    /// temporarily disabled because it makes the script very large

    // // checks the message hash in r1 against the signature r/s pair in r2 r3 and the public key in r4, storing the result in r3
    // @method(SigHash.ANYONECANPAY_SINGLE)
    // public checkDataSig(currentInstruction: bigint) {
    //     assert(this.heap.canGet(this.executionPointer, currentInstruction))
    //     assert(currentInstruction === CPU.OP_CHECKDATASIG)
    //     const valid = SECP256K1.verifySig(this.r1, { r: this.r2, s: this.r3 }, SECP256K1.pubKey2Point(PubKey(int2ByteString(this.r4))))
    //     if (valid) {
    //         this.r3 = 1n
    //     } else {
    //         this.r3 = 0n
    //     }

    //     this.executionPointer++
    //     const output = this.buildStateOutput(this.ctx.utxo.value)
    //     assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    // }

    // @method()
    // checkDataSigHelper(): void {
    //     const valid = SECP256K1.verifySig(this.r1, { r: this.r2, s: this.r3 }, SECP256K1.pubKey2Point(PubKey(int2ByteString(this.r4))))
    //     if (valid) {
    //         this.r3 = 1n
    //     } else {
    //         this.r3 = 0n
    //     }
    //     this.executionPointer++
    // }

    // Computes a pseudorandom value based on the previous UTXO's location in the blockchain and stores it in r1
    @method(SigHash.ANYONECANPAY_SINGLE)
    public random(currentInstruction: bigint, bh: BlockHeader, merkleproof: MerkleProof) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_RANDOM)

        const prevTxid: Sha256 = Sha256(this.ctx.utxo.outpoint.txid)

        // validate block header
        assert(Blockchain.isValidBlockHeader(bh, 500000000n))

        // verify previous transaction in the block
        assert(Blockchain.txInBlock(prevTxid, bh, merkleproof, 32))

        this.r1 = byteString2Int(sha256(
            this.ctx.utxo.outpoint.txid +
            int2ByteString(this.ctx.utxo.outpoint.outputIndex) +
            int2ByteString(bh.nonce)
        ))

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    randomHelper1(bh: BlockHeader): void {
        this.r1 = byteString2Int(sha256(
            this.ctx.utxo.outpoint.txid +
            int2ByteString(this.ctx.utxo.outpoint.outputIndex) +
            int2ByteString((bh as BlockHeader).nonce)
        ))
        this.executionPointer++
    }

    @method()
    randomHelper2(val: bigint): void {
        this.r1 = val
        this.executionPointer++
    }

    // computes sha256 hash on value in r1, storing it in r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public sha256(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_SHA256)

        this.r2 = byteString2Int(sha256(int2ByteString(this.r1)))

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    sha256Helper(): void {
        this.r2 = byteString2Int(sha256(int2ByteString(this.r1)))
        this.executionPointer++
    }

    // computes hash256 hash on value in r1, storing it in r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public hash256(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_HASH256)

        this.r2 = byteString2Int(hash256(int2ByteString(this.r1)))

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    hash256Helper(): void {
        this.r2 = byteString2Int(hash256(int2ByteString(this.r1)))
        this.executionPointer++
    }

    // computes ripemd160 hash on value in r1, storing it in r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public ripemd160(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_RIPEMD160)

        this.r2 = byteString2Int(ripemd160(int2ByteString(this.r1)))

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    ripemd160Helper(): void {
        this.r2 = byteString2Int(ripemd160(int2ByteString(this.r1)))
        this.executionPointer++
    }

    // computes hash160 hash on value in r1, storing it in r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public hash160(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_HASH160)

        this.r2 = byteString2Int(hash160(int2ByteString(this.r1)))

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    hash160Helper(): void {
        this.r2 = byteString2Int(hash160(int2ByteString(this.r1)))
        this.executionPointer++
    }

    // computes sha1 hash on value in r1, storing it in r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public sha1(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_SHA1)

        this.r2 = byteString2Int(sha1(int2ByteString(this.r1)))

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    sha1Helper(): void {
        this.r2 = byteString2Int(sha1(int2ByteString(this.r1)))
        this.executionPointer++
    }

    // does nothing
    @method(SigHash.ANYONECANPAY_SINGLE)
    public nop(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_NOP)

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    nopHelper(): void {
        this.executionPointer++
    }

    // negates r1
    @method(SigHash.ANYONECANPAY_SINGLE)
    public negate(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_NEGATE)
        this.r1 *= -1n

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    negateHelper(): void {
        this.r1 *= -1n
        this.executionPointer++
    }

    // r3 = r1 and r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public and(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_AND)
        this.r3 = and(this.r1, this.r2)

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    andHelper(): void {
        this.r3 = and(this.r1, this.r2)
        this.executionPointer++
    }

    // r3 = r1 or r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public or(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_OR)
        this.r3 = or(this.r1, this.r2)

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    orHelper(): void {
        this.r3 = or(this.r1, this.r2)
        this.executionPointer++
    }

    // r3 = r1 xor r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public xor(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_XOR)
        this.r3 = xor(this.r1, this.r2)

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    xorHelper(): void {
        this.r3 = xor(this.r1, this.r2)
        this.executionPointer++
    }

    // r3 = r1 equals r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public equal(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_EQUAL)
        this.r3 = this.r1 === this.r2 ? 1n : 0n

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    equalHelper(): void {
        this.r3 = this.r1 === this.r2 ? 1n : 0n
        this.executionPointer++
    }

    // r2 = abs r1
    @method(SigHash.ANYONECANPAY_SINGLE)
    public abs(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_ABS)
        this.r2 = abs(this.r1)

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    absHelper(): void {
        this.r2 = abs(this.r1)
        this.executionPointer++
    }

    // r3 = r1 not equals r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public notEqual(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_NOTEQUAL)
        this.r3 = this.r1 === this.r2 ? 0n : 1n

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    notEqualHelper(): void {
        this.r3 = this.r1 === this.r2 ? 0n : 1n
        this.executionPointer++
    }

    // r3 = r1 shifted left r2 bits
    @method(SigHash.ANYONECANPAY_SINGLE)
    public lshift(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_LSHIFT)
        this.r3 = lshift(this.r1, this.r2)

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    lshiftHelper(): void {
        this.r3 = lshift(this.r1, this.r2)
        this.executionPointer++
    }

    // r3 = r1 shifted right r2 bits
    @method(SigHash.ANYONECANPAY_SINGLE)
    public rshift(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_RSHIFT)
        this.r3 = rshift(this.r1, this.r2)

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    rshiftHelper(): void {
        this.r3 = rshift(this.r1, this.r2)
        this.executionPointer++
    }

    // r3 = r1 < r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public lessThan(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_LESSTHAN)
        this.r3 = this.r1 < this.r2 ? 1n : 0n

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    lessThanHelper(): void {
        this.r3 = this.r1 < this.r2 ? 1n : 0n
        this.executionPointer++
    }

    // r3 = r1 > r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public greaterThan(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_GREATERTHAN)
        this.r3 = this.r1 > this.r2 ? 1n : 0n

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    greaterThanHelper(): void {
        this.r3 = this.r1 > this.r2 ? 1n : 0n
        this.executionPointer++
    }

    // r3 = r1 <= r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public lessThanOrEqual(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_LESSTHANOREQUAL)
        this.r3 = this.r1 <= this.r2 ? 1n : 0n

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    lessThanOrEqualHelper(): void {
        this.r3 = this.r1 <= this.r2 ? 1n : 0n
        this.executionPointer++
    }

    // r3 = r1 >= r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public greaterThanOrEqual(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_GREATERTHANOREQUAL)
        this.r3 = this.r1 >= this.r2 ? 1n : 0n

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    greaterThanOrEqualHelper(): void {
        this.r3 = this.r1 >= this.r2 ? 1n : 0n
        this.executionPointer++
    }

    // r3 = min of r1 vs r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public min(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_MIN)
        this.r3 = min(this.r1, this.r2)

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    minHelper(): void {
        this.r3 = min(this.r1, this.r2)
        this.executionPointer++
    }

    // r3 = max of r1 vs r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public max(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_MAX)
        this.r3 = max(this.r1, this.r2)

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    maxHelper(): void {
        this.r3 = max(this.r1, this.r2)
        this.executionPointer++
    }

    // r3 = whether r4 is within r1 and r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public within(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_WITHIN)
        this.r3 = within(this.r4, this.r1, this.r2) ? 1n : 0n

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    withinHelper(): void {
        this.r3 = within(this.r4, this.r1, this.r2) ? 1n : 0n
        this.executionPointer++
    }

    // push r1 onto the stack
    @method(SigHash.ANYONECANPAY_SINGLE)
    public push1(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_PUSH1)

        this.stack.set(this.stackPointer, this.r1)
        this.stackPointer++

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    push1Helper(): void {
        this.stack.set(this.stackPointer, this.r1)
        this.stackPointer++
        this.executionPointer++
    }

    // pop the top stack item into r1
    @method(SigHash.ANYONECANPAY_SINGLE)
    public pop1(currentInstruction: bigint, value: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_POP1)
        this.stackPointer--
        assert(this.stack.canGet(this.stackPointer, value))

        this.r1 = value

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    pop1Helper(value: bigint): void {
        this.r1 = value
        this.stackPointer--
        this.executionPointer++
    }

    // push r2 onto the stack
    @method(SigHash.ANYONECANPAY_SINGLE)
    public push2(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_PUSH2)

        this.stack.set(this.stackPointer, this.r2)
        this.stackPointer++

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    push2Helper(): void {
        this.stack.set(this.stackPointer, this.r2)
        this.stackPointer++
        this.executionPointer++
    }

    // pop the top stack item into r2
    @method(SigHash.ANYONECANPAY_SINGLE)
    public pop2(currentInstruction: bigint, value: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_POP2)
        this.stackPointer--
        assert(this.stack.canGet(this.stackPointer, value))

        this.r2 = value

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    pop2Helper(value: bigint): void {
        this.r2 = value
        this.stackPointer--
        this.executionPointer++
    }

    // push r3 onto the stack
    @method(SigHash.ANYONECANPAY_SINGLE)
    public push3(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_PUSH3)

        this.stack.set(this.stackPointer, this.r3)
        this.stackPointer++

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    push3Helper(): void {
        this.stack.set(this.stackPointer, this.r3)
        this.stackPointer++
        this.executionPointer++
    }

    // pop the top stack item into r3
    @method(SigHash.ANYONECANPAY_SINGLE)
    public pop3(currentInstruction: bigint, value: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_POP3)
        this.stackPointer--
        assert(this.stack.canGet(this.stackPointer, value))

        this.r3 = value

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    pop3Helper(value: bigint): void {
        this.r3 = value
        this.stackPointer--
        this.executionPointer++
    }

    // push r4 onto the stack
    @method(SigHash.ANYONECANPAY_SINGLE)
    public push4(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_PUSH4)

        this.stack.set(this.stackPointer, this.r4)
        this.stackPointer++

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    push4Helper(): void {
        this.stack.set(this.stackPointer, this.r4)
        this.stackPointer++
        this.executionPointer++
    }

    // pop the top stack item into r1
    @method(SigHash.ANYONECANPAY_SINGLE)
    public pop4(currentInstruction: bigint, value: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_POP4)
        this.stackPointer--
        assert(this.stack.canGet(this.stackPointer, value))

        this.r4 = value

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    pop4Helper(value: bigint): void {
        this.r4 = value
        this.stackPointer--
        this.executionPointer++
    }

    // duplicate the top stack item
    @method(SigHash.ANYONECANPAY_SINGLE)
    public dup(currentInstruction: bigint, value: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_DUP)
        assert(this.stack.canGet(this.stackPointer - 1n, value))

        this.stack.set(this.stackPointer, value)
        this.stackPointer++

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    dupHelper(value: bigint): void {
        this.stack.set(this.stackPointer, value)
        this.stackPointer++
        this.executionPointer++
    }

    // drop the top stack item
    @method(SigHash.ANYONECANPAY_SINGLE)
    public drop(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_DROP)

        this.stackPointer--

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    dropHelper(): void {
        this.stackPointer--
        this.executionPointer++
    }

    // sets the base pointer to the current stack pointer after persisting the old one on the stack
    @method(SigHash.ANYONECANPAY_SINGLE)
    public setBase(currentInstruction: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_SETBASE)

        this.stack.set(this.stackPointer, this.basePointer)
        this.stackPointer++
        this.basePointer = this.stackPointer

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    setBaseHelper(): void {
        this.stack.set(this.stackPointer, this.basePointer)
        this.stackPointer++
        this.basePointer = this.stackPointer
        this.executionPointer++
    }

    // restores the old base pointer after clearing the stack
    @method(SigHash.ANYONECANPAY_SINGLE)
    public clearBase(currentInstruction: bigint, oldBase: bigint) {
        assert(this.heap.canGet(this.executionPointer, currentInstruction))
        assert(currentInstruction === CPU.OP_CLEARBASE)

        this.stackPointer = this.basePointer
        assert(this.stack.canGet(this.stackPointer - 1n, oldBase))
        this.basePointer = oldBase
        this.stackPointer--

        this.executionPointer++
        const output = this.buildStateOutput(this.ctx.utxo.value)
        assert(this.ctx.hashOutputs === hash256(output), 'The new puzzle output must reflect the updated state.')
    }

    @method()
    clearBaseHelper(oldBase: bigint): void {
        this.stackPointer = this.basePointer
        this.basePointer = oldBase
        this.stackPointer--
        this.executionPointer++
    }
}
