import CPU from './contracts/CPU'
import { fromByteString, int2ByteString, byteString2Int, toByteString } from 'scrypt-ts'

export default (cpu: CPU, instruction: bigint): { cpu: CPU, value?: bigint | undefined } => {
    let value: bigint | undefined = undefined
    let inputValue: bigint = 0n
    let promptResult: string | null = ''
    switch (instruction) {
        case CPU.OP_ADD:
            cpu.addHelper()
            break
        case CPU.OP_SUB:
            cpu.subHelper()
            break
        case CPU.OP_MUL:
            cpu.mulHelper()
            break
        case CPU.OP_DIV:
            cpu.divHelper()
            break
        case CPU.OP_MOD:
            cpu.modHelper()
            break
        case CPU.OP_LENGTH:
            cpu.lengthHelper()
            break
        case CPU.OP_SPLIT:
            cpu.splitHelper()
            break
        case CPU.OP_CAT:
            cpu.catHelper()
            break
        case CPU.OP_LOADIMMEDIATE1:
            value = cpu.heap.get(cpu.executionPointer + 1n)
            cpu.loadImmediate1Helper(value)
            break
        case CPU.OP_LOADIMMEDIATE2:
            value = cpu.heap.get(cpu.executionPointer + 1n)
            cpu.loadImmediate2Helper(value)
            break
        case CPU.OP_LOADIMMEDIATE3:
            value = cpu.heap.get(cpu.executionPointer + 1n)
            cpu.loadImmediate3Helper(value)
            break
        case CPU.OP_LOADIMMEDIATE4:
            value = cpu.heap.get(cpu.executionPointer + 1n)
            cpu.loadImmediate4Helper(value)
            break
        case CPU.OP_PUSHIMMEDIATE:
            value = cpu.heap.get(cpu.executionPointer + 1n)
            cpu.pushImmediateHelper(value)
            break
        case CPU.OP_LOADMEM:
            value = cpu.heap.get(cpu.r2)
            cpu.loadMemHelper(value)
            break
        case CPU.OP_STORE:
            cpu.storeHelper()
            break
        case CPU.OP_PRINT:
            cpu.printHelper()
            // For debugging purposes we will infer these values
            // In an actual program, the application would give them special meaning
            // We assume all values less than 255 are integers
            // Larger values are assumed to be strings.
            if (cpu.r1 <= 255n) {
                alert(cpu.r1)
            } else {
                const bs = fromByteString(int2ByteString(cpu.r1))
                alert(bs)
            }
            break
        case CPU.OP_READ:
            promptResult = prompt('INPUT')
            if (promptResult === null) {
                promptResult = ''
            }
            try {
                inputValue = BigInt(promptResult)
            } catch (e) {
                inputValue = byteString2Int(toByteString(promptResult, true))
            }
            value = inputValue
            cpu.readHelper(inputValue)
            break
        case CPU.OP_JZR:
            cpu.jzrHelper()
            break
        case CPU.OP_JMP:
            cpu.jmpHelper()
            break
        case CPU.OP_WIN:
            alert('YOU WIN')
            break
        case CPU.OP_LOSE:
            alert('YOU LOSE')
            break
        case CPU.OP_MOV12:
            value = cpu.r1
            cpu.mov2Helper(value)
            break
        case CPU.OP_MOV13:
            value = cpu.r1
            cpu.mov3Helper(value)
            break
        case CPU.OP_MOV14:
            value = cpu.r1
            cpu.mov4Helper(value)
            break
        case CPU.OP_MOV21:
            value = cpu.r2
            cpu.mov1Helper(value)
            break
        case CPU.OP_MOV23:
            value = cpu.r2
            cpu.mov3Helper(value)
            break
        case CPU.OP_MOV24:
            value = cpu.r2
            cpu.mov4Helper(value)
            break
        case CPU.OP_MOV31:
            value = cpu.r3
            cpu.mov1Helper(value)
            break
        case CPU.OP_MOV32:
            value = cpu.r3
            cpu.mov2Helper(value)
            break
        case CPU.OP_MOV34:
            value = cpu.r3
            cpu.mov4Helper(value)
            break
        case CPU.OP_MOV41:
            value = cpu.r4
            cpu.mov1Helper(value)
            break
        case CPU.OP_MOV42:
            value = cpu.r4
            cpu.mov2Helper(value)
            break
        case CPU.OP_MOV43:
            value = cpu.r4
            cpu.mov3Helper(value)
            break
        case CPU.OP_JNZ:
            cpu.jnzHelper()
            break
        case CPU.OP_JSR:
            cpu.jsrHelper()
            break
        case CPU.OP_RSR:
            value = cpu.callStack.get(cpu.callStackPointer - 1n)
            cpu.rsrHelper(value)
            break
        case CPU.OP_JSZ:
            cpu.jszHelper()
            break
        case CPU.OP_JSNZ:
            cpu.jsnzHelper()
            break
        case CPU.OP_JEQ:
            cpu.jeqHelper()
            break
        case CPU.OP_JNE:
            cpu.jneHelper()
            break
        case CPU.OP_CHECKPOINT:
            cpu.checkpointHelper()
            break
        case CPU.OP_AMOUNT:
            cpu.amountHelper()
            break
        case CPU.OP_PAY:
            cpu.payHelper()
            break
        case CPU.OP_BILL:
            cpu.billHelper()
            break
        case CPU.OP_PAYBILL:
            cpu.payBillHelper()
            break
        case CPU.OP_PAYANY:
            cpu.payAnyHelper()
            break
        case CPU.OP_CHECKDATASIG:
            // temporarily disabled
            break
        case CPU.OP_RANDOM:
            // TODO: Random numbers based on current UTXO
            cpu.randomHelper2(1n)
            break
        case CPU.OP_SHA256:
            cpu.sha256Helper()
            break
        case CPU.OP_HASH256:
            cpu.hash256Helper()
            break
        case CPU.OP_RIPEMD160:
            cpu.ripemd160Helper()
            break
        case CPU.OP_HASH160:
            cpu.hash160Helper()
            break
        case CPU.OP_SHA1:
            cpu.sha1Helper()
            break
        case CPU.OP_NOP:
            cpu.nopHelper()
            break
        case CPU.OP_NEGATE:
            cpu.negateHelper()
            break
        case CPU.OP_AND:
            cpu.andHelper()
            break
        case CPU.OP_OR:
            cpu.orHelper()
            break
        case CPU.OP_XOR:
            cpu.xorHelper()
            break
        case CPU.OP_EQUAL:
            cpu.equalHelper()
            break
        case CPU.OP_ABS:
            cpu.absHelper()
            break
        case CPU.OP_NOTEQUAL:
            cpu.notEqualHelper()
            break
        case CPU.OP_LSHIFT:
            cpu.lshiftHelper()
            break
        case CPU.OP_RSHIFT:
            cpu.rshiftHelper()
            break
        case CPU.OP_LESSTHAN:
            cpu.lessThanHelper()
            break
        case CPU.OP_GREATERTHAN:
            cpu.greaterThanHelper()
            break
        case CPU.OP_LESSTHANOREQUAL:
            cpu.lessThanOrEqualHelper()
            break
        case CPU.OP_GREATERTHANOREQUAL:
            cpu.greaterThanOrEqualHelper()
            break
        case CPU.OP_MIN:
            cpu.minHelper()
            break
        case CPU.OP_MAX:
            cpu.maxHelper()
            break
        case CPU.OP_WITHIN:
            cpu.withinHelper()
            break
        case CPU.OP_PUSH1:
            cpu.push1Helper()
            break
        case CPU.OP_POP1:
            value = cpu.stack.get(cpu.stackPointer - 1n)
            console.log(cpu.stack, cpu.stackPointer - 1n)
            cpu.pop1Helper(value)
            break
        case CPU.OP_DUP:
            value = cpu.stack.get(cpu.stackPointer - 1n)
            cpu.dupHelper(value)
            break
        case CPU.OP_DROP:
            cpu.dropHelper()
            break
        case CPU.OP_SETBASE:
            cpu.setBaseHelper()
            break
        case CPU.OP_CLEARBASE:
            value = cpu.stack.get(cpu.basePointer - 1n)
            cpu.clearBaseHelper(value)
            break
        case CPU.OP_PUSH2:
            cpu.push2Helper()
            break
        case CPU.OP_POP2:
            value = cpu.stack.get(cpu.stackPointer - 1n)
            cpu.pop2Helper(value)
            break
        case CPU.OP_PUSH3:
            cpu.push3Helper()
            break
        case CPU.OP_POP3:
            value = cpu.stack.get(cpu.stackPointer - 1n)
            cpu.pop3Helper(value)
            break
        case CPU.OP_PUSH4:
            cpu.push4Helper()
            break
        case CPU.OP_POP4:
            value = cpu.stack.get(cpu.stackPointer - 1n)
            cpu.pop4Helper(value)
            break
        default:
            throw new Error('Invalid operation.')
    }
    return {
        cpu,
        value
    }
}