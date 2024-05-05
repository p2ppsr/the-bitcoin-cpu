import CPU from './contracts/CPU'
import executeRealInstruction from './executeRealInstruction'
import executeMockInstruction from './executeMockInstruction.ts'
import { createAction, getHeight, createSignature, getPublicKey, CreateActionResult, stampLogFormat } from '@babbage/sdk-ts'
import { PubKey, Sig, bsv, toByteString, HashedMap } from 'scrypt-ts'
import { Transaction } from '@bsv/sdk'
import { verifyTruthy, deserializeHashedMap } from './utils.ts'

export default async (
    puzzleAction: { action: CreateActionResult, serializedHeap: string },
    executedOperations: { op: bigint, value?: bigint }[]
) => {
    const solverHex = await getPublicKey({
        protocolID: [0, 'computation'],
        keyID: '1'
    })
    const solver = PubKey(bsv.PublicKey.fromString(solverHex).toByteString())
    const height = BigInt(await getHeight())

    // start solving
    const initialHeap = deserializeHashedMap(puzzleAction.serializedHeap)
    const emptyStack = new HashedMap<bigint, bigint>()
    const emptyCallStack = new HashedMap<bigint, bigint>()
    const tx = Transaction.fromHex(verifyTruthy(puzzleAction.action.rawTx))
    const parsedOfferTX = new bsv.Transaction(puzzleAction.action.rawTx)
    const lockingScript = tx.outputs[0].lockingScript.toHex()
    const cpu = CPU.fromLockingScript(lockingScript, {
        'heap': initialHeap,
        'initialHeap': initialHeap,
        'stack': emptyStack,
        'initialStack': emptyStack,
        'callStack': emptyCallStack,
        'initialCallStack': emptyCallStack
    }) as CPU
    const mockCpu = CPU.fromLockingScript(lockingScript, {
        'heap': initialHeap,
        'initialHeap': initialHeap,
        'stack': emptyStack,
        'initialStack': emptyStack,
        'callStack': emptyCallStack,
        'initialCallStack': emptyCallStack
    }) as CPU
    mockCpu.solutionHelper(solver, height)
    const nextScript = mockCpu.lockingScript
    const unlockingScript = await cpu.getUnlockingScript(async (self) => {
        const bsvtx = new bsv.Transaction()
        bsvtx.from({
            txId: verifyTruthy(puzzleAction.action.txid),
            outputIndex: 0,
            script: lockingScript,
            satoshis: tx.outputs[0].satoshis as number
        })
        bsvtx.addOutput(new bsv.Transaction.Output({
            script: nextScript,
            satoshis: tx.outputs[0].satoshis as number * Number(cpu.bountyMultiplier)
        }))
        const hashType =
            bsv.crypto.Signature.SIGHASH_SINGLE |
            bsv.crypto.Signature.SIGHASH_ANYONECANPAY |
            bsv.crypto.Signature.SIGHASH_FORKID
        const hashbuf = bsv.crypto.Hash.sha256(
            bsv.Transaction.Sighash.sighashPreimage(
                bsvtx,
                hashType,
                0,
                bsv.Script.fromBuffer(Buffer.from(lockingScript, 'hex')),
                new bsv.crypto.BN(tx.outputs[0].satoshis as number)
            )
        )
        const SDKSignature = await createSignature({
            protocolID: [0, 'computation'],
            keyID: '1',
            data: hashbuf
        })
        const signature = bsv.crypto.Signature.fromString(
            Buffer.from(SDKSignature).toString('hex')
        )
        signature.nhashtype = hashType
        self.to = { tx: bsvtx, inputIndex: 0 }
        self.from = { tx: parsedOfferTX, outputIndex: 0 }
        self.startSolving(
            solver,
            Sig(toByteString(signature.toTxFormat().toString('hex'))),
            height
        )
    })
    const broadcastActionParams = {
        inputs: {
            [verifyTruthy(puzzleAction.action.txid)]: {
                ...verifyTruthy(puzzleAction.action),
                rawTx: verifyTruthy(puzzleAction.action.rawTx),
                outputsToRedeem: [{
                    index: 0,
                    unlockingScript: unlockingScript.toHex()
                }]
            }
        },
        outputs: [{
            script: nextScript.toHex(),
            satoshis: tx.outputs[0].satoshis as number * Number(cpu.bountyMultiplier),
            basket: 'computation'
        }],
        description: `Start solving a puzzle`,
        acceptDelayedBroadcast: false,
        log: ''
    }
    let currentTX = await createAction(broadcastActionParams)
    if (currentTX.log) { console.log('broadcastPuzzleSolution.ts:108\n',stampLogFormat(currentTX.log)) }
    let currentHeap = cpu.heap
    let currentStack = cpu.stack
    let currentInitialHeap = cpu.initialHeap
    let currentInitialStack = cpu.initialStack
    let currentCallStack = cpu.callStack
    let currentInitialCallStack = cpu.initialCallStack

    for (let i = 0; i < executedOperations.length - 1; i++) {
        const tx = Transaction.fromHex(currentTX.rawTx as string)
        const parsedPreviousTX = new bsv.Transaction(currentTX.rawTx)
        const lockingScript = tx.outputs[0].lockingScript.toHex()
        const cpu = CPU.fromLockingScript(lockingScript, {
            'heap': currentHeap,
            'stack': currentStack,
            'initialHeap': currentInitialHeap,
            'initialStack': currentInitialStack,
            'callStack': currentCallStack,
            'initialCallStack': currentInitialCallStack,
        }) as CPU
        let mockCpu = CPU.fromLockingScript(lockingScript, {
            'heap': currentHeap,
            'stack': currentStack,
            'initialHeap': currentInitialHeap,
            'initialStack': currentInitialStack,
            'callStack': currentCallStack,
            'initialCallStack': currentInitialCallStack
        }) as CPU
        const mockResult = executeMockInstruction(mockCpu, executedOperations[i].op, executedOperations[i].value as bigint, true)
        mockCpu = mockResult.cpu
        const nextScript = mockCpu.lockingScript
        const unlockingScript = await cpu.getUnlockingScript(async (self) => {
            const bsvtx = new bsv.Transaction()
            bsvtx.from({
                txId: currentTX.txid as string,
                outputIndex: 0,
                script: lockingScript,
                satoshis: tx.outputs[0].satoshis as number
            })
            bsvtx.addOutput(new bsv.Transaction.Output({
                script: nextScript,
                satoshis: tx.outputs[0].satoshis as number
            }))
            self.to = { tx: bsvtx, inputIndex: 0 }
            self.from = { tx: parsedPreviousTX, outputIndex: 0 }
            executeRealInstruction(self, executedOperations[i].op, executedOperations[i].value as bigint)
        })
        const newOutputAmount = tx.outputs[0].satoshis as number
        // TODO: For BILL, PAY and other opcodes that change the amount needed in the UTXO, adjust newOutputAmount accordingly
        currentTX = await createAction({
            inputs: {
                [currentTX.txid as string]: {
                    ...verifyTruthy(currentTX),
                    rawTx: currentTX.rawTx as string,
                    outputsToRedeem: [{
                        index: 0,
                        unlockingScript: unlockingScript.toHex()
                    }]
                }
            },
            outputs: [{
                script: nextScript.toHex(),
                satoshis: newOutputAmount,
                basket: 'computation'
            }],
            description: `Step solving a puzzle`,
            acceptDelayedBroadcast: false,
            log: ''
        })
        if (currentTX.log) { console.log('broadcastPuzzleSolution.ts:177\n',stampLogFormat(currentTX.log)) }
        currentHeap = cpu.heap
        currentStack = cpu.stack
        currentInitialHeap = cpu.initialHeap
        currentInitialStack = cpu.initialStack
        currentCallStack = cpu.callStack
        currentInitialCallStack = cpu.initialCallStack
    }
    // claim winnings
    const preWinTX = Transaction.fromHex(currentTX.rawTx as string)
    const parsedPreWinTX = new bsv.Transaction(currentTX.rawTx)
    const preWinLockingScript = preWinTX.outputs[0].lockingScript.toHex()
    const preWinCPU = CPU.fromLockingScript(preWinLockingScript, {
        'heap': currentHeap,
        'stack': currentStack,
        'initialHeap': currentInitialHeap,
        'initialStack': currentInitialStack,
        'callStack': currentCallStack,
        'initialCallStack': currentInitialCallStack
    }) as CPU
    const winScript = await preWinCPU.getUnlockingScript(async (self) => {
        const bsvtx = new bsv.Transaction()
        bsvtx.from({
            txId: currentTX.txid as string,
            outputIndex: 0,
            script: preWinLockingScript,
            satoshis: preWinTX.outputs[0].satoshis as number
        })
        self.to = { tx: bsvtx, inputIndex: 0 }
        self.from = { tx: parsedPreWinTX, outputIndex: 0 }
        self.win(CPU.OP_WIN)
    })
    const finalAction = await createAction({
        inputs: {
            [currentTX.txid as string]: {
                ...verifyTruthy(currentTX),
                rawTx: currentTX.rawTx as string,
                outputsToRedeem: [{
                    index: 0,
                    unlockingScript: winScript.toHex()
                }]
            },
        },
        description: `Finish solving a puzzle`,
        acceptDelayedBroadcast: false,
        log: ''
    })
    if (finalAction.log) console.log('broadcastPuzzleSolution:224\n', stampLogFormat(finalAction.log))
    alert('CPU Puzzle is Solved and Unlocked! The bounty is returned to your MetaNet Client.')
}
