import CPU from './contracts/CPU'

export default (c: CPU, i: bigint, v: bigint): CPU => {
    switch (i) {
        case CPU.OP_ADD:
            c.add(i)
            break
        case CPU.OP_SUB:
            c.sub(i)
            break
        case CPU.OP_MUL:
            c.mul(i)
            break
        case CPU.OP_DIV:
            c.div(i)
            break
        case CPU.OP_MOD:
            c.mod(i)
            break
        case CPU.OP_LENGTH:
            c.length(i)
            break
        case CPU.OP_SPLIT:
            c.split(i)
            break
        case CPU.OP_CAT:
            c.cat(i)
            break
        case CPU.OP_LOADIMMEDIATE1:
            c.loadImmediate1(i, v)
            break
        case CPU.OP_LOADIMMEDIATE2:
            c.loadImmediate2(i, v)
            break
        case CPU.OP_LOADIMMEDIATE3:
            c.loadImmediate3(i, v)
            break
        case CPU.OP_LOADIMMEDIATE4:
            c.loadImmediate4(i, v)
            break
        case CPU.OP_PUSHIMMEDIATE:
            c.pushImmediate(i, v)
            break
        case CPU.OP_LOADMEM:
            c.loadMem(i, v)
            break
        case CPU.OP_STORE:
            c.store(i)
            break
        case CPU.OP_PRINT:
            c.print(i)
            break
        case CPU.OP_READ:
            c.read(i, v)
            break
        case CPU.OP_JZR:
            c.jzr(i)
            break
        case CPU.OP_JMP:
            c.jmp(i)
            break
        case CPU.OP_WIN:
            break
        case CPU.OP_LOSE:
            break
        case CPU.OP_MOV12:
            c.mov12(i)
            break
        case CPU.OP_MOV13:
            c.mov13(i)
            break
        case CPU.OP_MOV14:
            c.mov14(i)
            break
        case CPU.OP_MOV21:
            c.mov21(i)
            break
        case CPU.OP_MOV23:
            c.mov23(i)
            break
        case CPU.OP_MOV24:
            c.mov24(i)
            break
        case CPU.OP_MOV31:
            c.mov31(i)
            break
        case CPU.OP_MOV32:
            c.mov32(i)
            break
        case CPU.OP_MOV34:
            c.mov34(i)
            break
        case CPU.OP_MOV41:
            c.mov41(i)
            break
        case CPU.OP_MOV42:
            c.mov42(i)
            break
        case CPU.OP_MOV43:
            c.mov43(i)
            break
        case CPU.OP_JNZ:
            c.jnz(i)
            break
        case CPU.OP_JSR:
            c.jsr(i)
            break
        case CPU.OP_RSR:
            c.rsr(i, v)
            break
        case CPU.OP_JSZ:
            c.jsz(i)
            break
        case CPU.OP_JSNZ:
            c.jsnz(i)
            break
        case CPU.OP_JEQ:
            c.jeq(i)
            break
        case CPU.OP_JNE:
            c.jne(i)
            break
        case CPU.OP_CHECKPOINT:
            c.checkpoint(i)
            break
        case CPU.OP_AMOUNT:
            c.amount(i)
            break
        case CPU.OP_PAY:
            c.pay(i)
            break
        case CPU.OP_BILL:
            c.bill(i)
            break
        case CPU.OP_PAYBILL:
            c.payBill(i)
            break
        case CPU.OP_PAYANY:
            c.payAny(i)
            break
        case CPU.OP_CHECKDATASIG:
            // temporarily disabled
            break
        case CPU.OP_RANDOM:
            // TODO: Random numbers
            // c.random(i, bh, mr)
            break
        case CPU.OP_SHA256:
            c.sha256(i)
            break
        case CPU.OP_HASH256:
            c.hash256(i)
            break
        case CPU.OP_RIPEMD160:
            c.ripemd160(i)
            break
        case CPU.OP_HASH160:
            c.hash160(i)
            break
        case CPU.OP_SHA1:
            c.sha1(i)
            break
        case CPU.OP_NOP:
            c.nop(i)
            break
        case CPU.OP_NEGATE:
            c.negate(i)
            break
        case CPU.OP_AND:
            c.and(i)
            break
        case CPU.OP_OR:
            c.or(i)
            break
        case CPU.OP_XOR:
            c.xor(i)
            break
        case CPU.OP_EQUAL:
            c.equal(i)
            break
        case CPU.OP_ABS:
            c.abs(i)
            break
        case CPU.OP_NOTEQUAL:
            c.notEqual(i)
            break
        case CPU.OP_LSHIFT:
            c.lshift(i)
            break
        case CPU.OP_RSHIFT:
            c.rshift(i)
            break
        case CPU.OP_LESSTHAN:
            c.lessThan(i)
            break
        case CPU.OP_GREATERTHAN:
            c.greaterThan(i)
            break
        case CPU.OP_LESSTHANOREQUAL:
            c.lessThanOrEqual(i)
            break
        case CPU.OP_GREATERTHANOREQUAL:
            c.greaterThanOrEqual(i)
            break
        case CPU.OP_MIN:
            c.min(i)
            break
        case CPU.OP_MAX:
            c.max(i)
            break
        case CPU.OP_WITHIN:
            c.within(i)
            break
        case CPU.OP_PUSH1:
            c.push1(i)
            break
        case CPU.OP_POP1:
            c.pop1(i, v)
            break
        case CPU.OP_DROP:
            c.drop(i)
            break
        case CPU.OP_DUP:
            c.dup(i, v)
            break
        case CPU.OP_SETBASE:
            c.setBase(i)
            break
        case CPU.OP_CLEARBASE:
            c.clearBase(i, v)
            break
        case CPU.OP_PUSH2:
            c.push2(i)
            break
        case CPU.OP_POP2:
            c.pop2(i, v)
            break
        case CPU.OP_PUSH3:
            c.push3(i)
            break
        case CPU.OP_POP3:
            c.pop3(i, v)
            break
        case CPU.OP_PUSH4:
            c.push4(i)
            break
        case CPU.OP_POP4:
            c.pop4(i, v)
            break
    }
    return c
}