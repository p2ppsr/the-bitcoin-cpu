import { useState } from 'react'
import { HashedMap } from 'scrypt-ts'
import CPU from './contracts/CPU.ts'
import CPUArtifact from '../artifacts/CPU.json'
CPU.loadArtifact(CPUArtifact)
import { createAction, CreateActionResult } from '@babbage/sdk-ts'
import { verifyTruthy, serializeHashedMap, deserializeHashedMap } from './utils.ts'
import executeMockInstruction from './executeMockInstruction.ts'
import broadcastPuzzleSolution from './broadcastPuzzleSolution.ts'
import { Transaction } from '@bsv/sdk'
import Assembler from './Assembler.tsx'

export default function App() {
  const [cpu, setCpu] = useState<CPU>()
  const [initialHeap, setInitialHeap] = useState('')
  const [booted, setBooted] = useState(false)
  const [executedInstructions, setExecutedInstructions] = useState<{ op: bigint, value?: bigint | undefined }[]>([])
  const [canBroadcast, setCanBroadcast] = useState(false)
  const [cpuHeap, setCpuHeap] = useState('')
  const [cpuStack, setCpuStack] = useState('')
  const [cpuCallStack, setCpuCallStack] = useState('')
  const [puzzleAction, setPuzzleAction] = useState<{ action: CreateActionResult, serializedHeap: string }>()

  const handleExport = async () => {
    const stack = new HashedMap<bigint, bigint>()
    const heap = new HashedMap<bigint, bigint>()
    const callStack = new HashedMap<bigint, bigint>()
    const parsedCode = initialHeap.split('\n').map(x => BigInt(x))
    for (let i = 0; i < parsedCode.length; i++) {
      heap.set(BigInt(i), parsedCode[i])
    }
    const cpu = new CPU(heap, stack, callStack)
    setCpu(cpu)
    setBooted(true)
    let newCpuHeap = ''
    for (let i = 0; i < cpu.heap.size; i++) {
      if (BigInt(i) === cpu.executionPointer) {
        newCpuHeap += cpu.heap.get(BigInt(i)) + '    <===\n'
      } else {
        newCpuHeap += cpu.heap.get(BigInt(i)) + '\n'
      }
    }
    setCpuHeap(newCpuHeap)
    const script = cpu.lockingScript.toHex()
    const satoshis = Number(prompt('Enter the amount of satoshis for the puzzle:'))
    const exportPuzzleParams = {
      description: 'Propose a puzzle',
      outputs: [{
        script,
        satoshis
      }]
    }
    const action = await createAction(exportPuzzleParams)
    const serializedHeap = serializeHashedMap(cpu.heap)
    const newPuzzleAction = {
      action,
      serializedHeap
    }
    setPuzzleAction(newPuzzleAction)
    console.log(JSON.stringify(newPuzzleAction))
    alert('Success! Check browser console for large puzzle data payload, which can later be re-imported.\n\nPuzzle TXID:\n\n' + newPuzzleAction.action.txid)
  }

  const handleImport = () => {
    const imported = prompt('Provide the puzzle to import:')
    const parsed: { action: CreateActionResult, serializedHeap: string } = JSON.parse(imported as string)
    const heap = deserializeHashedMap(parsed.serializedHeap)
    const emptyStack = new HashedMap<bigint, bigint>()
    const emptyCallStack = new HashedMap<bigint, bigint>()
    const tx = Transaction.fromHex(parsed.action.rawTx)
    const lockingScript = tx.outputs[0].lockingScript.toHex()
    const newCpu = CPU.fromLockingScript(lockingScript, {
      'heap': heap,
      'initialHeap': heap,
      'stack': emptyStack,
      'initialStack': emptyStack,
      'callStack': emptyCallStack,
      'initialCallStack': emptyCallStack
    }) as CPU
    setPuzzleAction(parsed)
    setCpu(newCpu)
    setBooted(true)
    let newCpuHeap = ''
    for (let i = 0; i < newCpu.heap.size; i++) {
      if (BigInt(i) === newCpu.executionPointer) {
        newCpuHeap += newCpu.heap.get(BigInt(i)) + '    <===\n'
      } else {
        newCpuHeap += newCpu.heap.get(BigInt(i)) + '\n'
      }
    }
    setCpuHeap(newCpuHeap)
  }

  const handleLoad = () => {
    const stack = new HashedMap<bigint, bigint>()
    const heap = new HashedMap<bigint, bigint>()
    const callStack = new HashedMap<bigint, bigint>()
    const parsedCode = initialHeap.split('\n').map(x => BigInt(x))
    for (let i = 0; i < parsedCode.length; i++) {
      heap.set(BigInt(i), parsedCode[i])
    }
    const cpu = new CPU(heap, stack, callStack)
    setCpu(cpu)
    setBooted(true)
    let newCpuHeap = ''
    for (let i = 0; i < cpu.heap.size; i++) {
      if (BigInt(i) === cpu.executionPointer) {
        newCpuHeap += cpu.heap.get(BigInt(i)) + '    <===\n'
      } else {
        newCpuHeap += cpu.heap.get(BigInt(i)) + '\n'
      }
    }
    let newCpuStack = ''
    for (let i = 0; i < cpu.stackPointer; i++) {
      const item = cpu.stack.get(BigInt(i))
      if (typeof item === 'undefined') continue
      newCpuStack += item + '\n'
    }
    let newCpuCallStack = ''
    for (let i = 0; i < cpu.callStackPointer; i++) {
      const item = cpu.callStack.get(BigInt(i))
      if (typeof item === 'undefined') continue
      newCpuCallStack += item + '\n'
    }
    setCpuHeap(newCpuHeap)
    setCpuStack(newCpuStack)
    setCpuCallStack(newCpuCallStack)
  }

  const executeInstruction = (originalCPU: CPU) => {
    const instruction = originalCPU.heap.get(originalCPU.executionPointer)
    const { value, cpu } = executeMockInstruction(originalCPU, instruction)
    if (instruction === CPU.OP_WIN || instruction === CPU.OP_CHECKPOINT) {
      setCanBroadcast(true)
    }
    let newCpuHeap = ''
    for (let i = 0; i < cpu.heap.size; i++) {
      if (BigInt(i) === cpu.executionPointer) {
        newCpuHeap += cpu.heap.get(BigInt(i)) + '    <===\n'
      } else {
        newCpuHeap += cpu.heap.get(BigInt(i)) + '\n'
      }
    }
    let newCpuStack = ''
    for (let i = 0; i < cpu.stackPointer; i++) {
      const item = cpu.stack.get(BigInt(i))
      if (typeof item === 'undefined') continue
      newCpuStack += item + '\n'
    }
    let newCpuCallStack = ''
    for (let i = 0; i < cpu.callStackPointer; i++) {
      const item = cpu.callStack.get(BigInt(i))
      if (typeof item === 'undefined') continue
      newCpuCallStack += item + '\n'
    }
    setCpuHeap(newCpuHeap)
    setCpuStack(newCpuStack)
    setCpuCallStack(newCpuCallStack)
    setExecutedInstructions(e => {
      e.push({ op: instruction, value })
      return e
    })
    setCpu(cpu)
  }

  const handleIncrement = () => {
    executeInstruction(cpu as CPU)
  }

  const handleRun = () => {
    do {
      executeInstruction(cpu as CPU)
    } while (
      cpu?.heap.get(cpu.executionPointer) !== CPU.OP_WIN &&
      cpu?.heap.get(cpu.executionPointer) !== CPU.OP_LOSE
    )
  }

  const handleReset = () => {
    if (canBroadcast) {
      const sure = confirm('You have a broadcastable solution! Clear it?')
      if (!sure) {
        return
      }
    }
    setCpu(undefined)
    setBooted(false)
    setExecutedInstructions([])
    setCanBroadcast(false)
  }

  const handleBroadcast = async () => {
    await broadcastPuzzleSolution(verifyTruthy(puzzleAction), executedInstructions)
  }

  return (
    <center>
      <h1>The Everett CPU</h1>
      <br />
      <br />
      <div style={{ display: 'grid', width: '100%', gridTemplateColumns: 'repeat(8, 1fr)', gridGap: '1em' }}>
        <button onClick={handleExport} disabled={booted}>Export Puzzle</button>
        <button onClick={handleImport} disabled={booted}>Import Puzzle</button>
        <button onClick={handleLoad} disabled={booted || initialHeap.length < 1}>Boot</button>
        <button onClick={handleIncrement} disabled={!booted || canBroadcast}>Increment</button>
        <button onClick={handleRun} disabled={!booted || canBroadcast}>Run</button>
        <button onClick={handleReset} disabled={!booted}>Reset</button>
        <p>Executed Instructions: {executedInstructions.length}</p>
        <button onClick={handleBroadcast} disabled={!canBroadcast}>Broadcast</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        <div>
          <h1>Heap</h1>
          <textarea rows={50} value={booted ? cpuHeap : initialHeap} readOnly={booted} onChange={e => setInitialHeap(e.target.value)} style={{ width: '20em', maxHeight: '50em', overflowY: 'scroll' }} />
          <br />
          <br />
        </div>
        <div>
          <h1>Registers</h1>
          <h2>Register 1</h2>
          <input readOnly type='text' value={cpu ? Number(cpu?.r1) : 0} />
          <h2>Register 2</h2>
          <input readOnly type='text' value={cpu ? Number(cpu?.r2) : 0} />
          <h2>Register 3</h2>
          <input readOnly type='text' value={cpu ? Number(cpu?.r3) : 0} />
          <h2>Register 4</h2>
          <input readOnly type='text' value={cpu ? Number(cpu?.r4) : 0} />
          <h2>Execution Pointer</h2>
          <input readOnly type='text' value={cpu ? Number(cpu?.executionPointer) : 0} />
          <h2>Stack Pointer</h2>
          <input readOnly type='text' value={cpu ? Number(cpu?.stackPointer) : 0} />
          <h2>Base Pointer</h2>
          <input readOnly type='text' value={cpu ? Number(cpu?.basePointer) : 0} />
        </div>
        <div>
          <h1>Stack</h1>
          <textarea readOnly rows={50} value={booted ? cpuStack : ''} style={{ width: '20em', maxHeight: '50em', overflowY: 'scroll' }} />
        </div>
        <div>
          <h1>Call Stack</h1>
          <textarea readOnly rows={50} value={booted ? cpuCallStack : ''} style={{ width: '20em', maxHeight: '50em', overflowY: 'scroll' }} />
        </div>
      </div>
      <Assembler />
    </center>
  )
}
