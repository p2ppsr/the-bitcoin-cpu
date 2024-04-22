import { useState } from 'react'
import assembleProgram from './assembler.ts'

export default function Assembler() {
    const [assembly, setAssembly] = useState('')
    const [machineCode, setMachineCode] = useState<bigint[]>([])
    const handleAssemble = () => {
        try {
            setMachineCode(assembleProgram(assembly))
        } catch (e) {
            console.error(e)
            alert((e as Error).message)
        }
    }
    let parsedMachineCode = ''
    for (const instruction of machineCode) {
        parsedMachineCode += `${String(instruction)}\n`
    }
    return (
        <center>
            <h1>Assembler</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridGap: '1em' }}>
                <textarea rows={30} value={assembly} onChange={e => setAssembly(e.target.value)} />
                <textarea rows={30} value={parsedMachineCode} readOnly />
            </div>
            <br />
            <button onClick={handleAssemble}>Assemble</button>
        </center>
    )
}