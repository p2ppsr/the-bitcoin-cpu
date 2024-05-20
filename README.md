![](/public/BitcoinCPU.png)

## Overview

The CPU is coded in sCrypt. There is a heap, a stack, and four registers. Code begins executing at the beginning of the heap. There is an execution pointer, a stack pointer, and a base pointer. The execution pointer is incremented after each instruction. Each instruction constitutes a new Bitcoin transaction, which increments the state of the CPU forward, analogous to a clock cycle.

Programs executable by the CPU comprise various opcodes. OP_PRINT can be used for output while OP_READ allows the program to receive input from the caller. Some opcodes can impact the rules that govern the contract — for example, OP_WIN will release all funds in the contract and allow the CPU to be disassembled, while OP_BILL requires the person executing the program to provide additional funds. If the CPU ever reaches OP_LOSE, there is no way to continue execution, analogous to a halt.

## Stopping Malicious Partial Solutions in Multi-Stage Contract Transaction Chains

Since a complex sequence of many transactions are used in order to define a complete solution and claim a smart contract's bounty (each a CPU clock cycle), we are left with a problem: how to prevent malicious actors from broadcasting partial solutions that put the state of the CPU into an untennable position, where no solution could ever be found from that point on.

To solve this problem, we introduce the concept of a solver's bond paid before a solution can be attempted: before the solver can cycle the CPU on-chain, they must post a bond into the contract. The contract records its initial state (before any transactions), and if after a pre-defined timeout, the solver has not completed their solution, anyone may call a public method that would reset the state of the contract, causing the solver to forfeit their bond. To illustrate, consider the following examples:

1. Alice creates a program that evaluates proposed solutions for hypersonic airfoil designs, offering a bounty of 100 BSV to anyone who provides a set of parameters that would meet her criteria when evaluated.
2. Bob, wishing to sabotage Alice and ruin her contract, will now attempt to broadcast a partial solution that would make future solutions untennable. To start, Bob must put forth a bond of 50 BSV (bounty multiplier 0.5). This starts a timer for Bob to close out the contract.
3. Bob broadcasts his bond commitment and is now free, for the next 24 hours, to broadcast his solution. He proceeds to input bogus data and send the transactions.
4. For the next 24 hours, no one will be able to attempt solutions, because Bob has locked the contract. However, after this timer has expired, anyone can reset the program back to its original state.
5. Carol, being honest, has been working off-chain. It would only make sense for her to broadcast once she knows she has found a valid solution.
6. After Bob's timer expires, Carol spends Bob's latest UTXO, returning the contract back to its initial state. Carol replaces Bob as the solver. Bob has forfeit his 50 BSV which now joins the original bounty amount.
7. Carol, starting to solve the bounty, puts forward a bond of 75 BSV (bounty multiplier of 0.5 x the new 150 BSV bounty). Carol is now free to attempt the solution for 24 hours by broadcasting transactions that cycle the CPU.
8. Carol, having already computed the solution off-chain, simply broadcasts the chain of transactions immediately. She receives 225 BSV in total: her 75 BSV bond plus the 150 BSV originally in the contract.

This sequence has demonstrated that even in the face of a malicious actor who is attempting to broadcast a malicious partial solution, the state of the contract can be reset. The attacker forfeits their bond, further incentivizing a real solution to be found.

## Writing Smart Contracts with the Everett CPU

Smart contracts can be described by initializing the CPU with heap memory that contains a program defining the constraints of the contract. At initialization, the original heap is always recorded so that it can be reset in case of malicious partial solutions.

The architecture supports many operations, from basic arithmetic and logic to subroutines and conditional jumps. Stack operations and register move operations are also supported. Due to the unique nature of the emulated environment, there are some interesting characteristics and observations about the machine:

- There is no limit to stack or heap memory — the program is free to allocate memory at any location, and jump to it. On-chain, these are represented with sCrypt HashedMap types, which utilize merkle trees and off-chain values.
- Due to this use of merkle trees, certain regions of memory can be kept confidential until they are needed within currently-executing code. The needed values could then be revealed to potential solvers off-chain, on a "need-to-know" basis.
- There is no requirement that memory elements or registers use only a single "byte" of data. As demonstrated by opcodes like OP_PAY, where an entire output script is read from a CPU register and enforced in the spending transaction, the use of BigInt types means there is no fundamental limit to the size of memory elements in the computer.

## Running the CPU Debugger

First, clone this repository. Then, install dependencies and start the dev environment:

```sh
cd cpu-debugger
npm i
npm run dev
```

The browser should open. The control panel will be at the top, with the heap to the left and he stack to the right. Various registers are in the middle. Below, you will find the assembler, with assembly code on the left and assembled machine code on the right. Here are some notes on basic usage:

- Start by writing assembly code in the bottom left pane of the assembler, and assembling it into machine code which will appear on the right. (If there are errors, they will be shown using alert boxes).
- Copy your assembled machine code from the right hand pane of the assembler directly into the heap, making sure to preserve new-line characters.
- Once you have loaded the heap with your program, select the "Boot" option from the controls at the top and the CPU will initialize with the instruction pointer at zero. You will not be able to edit the heap text field after the CPU is booted. You can see an indicator in the heap as to the current position of the execution pointer.
- You may now cycle the CPU forward by clicking the "Increment" button, and the execution pointer will advance. You can view the values of the heap, stack and registers in the CPU debugger window.
- If you are running a program that will *NOT* result in an infinite loop, you can select the "Run" option from the control panel. The program should proceed nearly to completion. You may need to select "Increment" a final time to execute the last OP_WIN instruction.

You should now be able to write and execute programs that work on the CPU. Next, we will detail the process of publishing programs to chain for people to solve, and solving such puzzles.

> NOTE: To follow this section of the tutorial, ensure that you have installed the [Babbage MetaNet Client](https://projectbabbage.com/metanet-client) on Stageline or Mainline, and that it is currently running on your machine.

- First, write your puzzle in the assembler and assemble it to machine code. Load the machine code into the heap as normal, making sure to preserve new-line characters.
- Open your browser console. Instead of selecting "Boot", select "Export Puzzle" and after giving the system time to compose your new contract, the MetaNet Client should prompt you for authorization.
- If successful, an alert will pop up with the TXID. A very large (several megabytes) piece of text will appear in your browser console. Copy it and save it to file, so that you can access and import it later.
- Your CPU will now be booted with the puzzle action loaded. You may cycle the CPU, input and output data as normal. If your program executes OP_WIN, the "Broadcast" button on the top-right should become active.
- Select the Broadcast button from the control panel and a series of Bitcoin transactions will be sent, first posting your solver's bond and then claiming your solution, unlocking the value in the contract.

If you didn't want to solve it yourself, you can how share or publish the puzzle file you exported and saved earlier, so that someone else can attempt to solve it. The steps for importing a saved puzzle file are as follows:

1. Start the CPU debugger and select the "Import Puzzle" option.
2. Paste the large puzzle data payload when prompted.
3. After a short delay, the CPU should now be booted and ready for you to start providing your solution to the puzzle.
4. After providing the solution, and after the CPU has executed OP_WIN, it can be broadcast to the network and the bounty can be claimed.

## Everett Instruction Set Architecture (ISA)

Due to the low-level integration of smart contracting capabilities within the CPU, we have created a new ISA, including opcodes and an assembly language. Full documentation is to be provided.

Here are some simple programs that can be assembled using the CPU debugger's built-in assembler:

### Example: Fibonacci Numbers in Stack

> Warning: This program would execute forever, only use "Increment" and not "Run" to execute it.

The program will push numbers in the fibonacci sequence onto the CPU's stack.

```
:init load r3 1      ; load 1 into both r1 and r2 to start
      load r2 1      
      push r1        ; push the two values onto the stack
      push r2

:loop mov r2 r1      ; the second number becomes the first number
      mov r3 r2      ; the previous addition becomes the second number
      add            ; first and second numbers are added and the result is stored in r3
      push r3        ; push thee new number onto the stack
      load r1 loop   ; first number is overwritten with memory address of the beginning of the loop
      jmp            ; jump back to the beginning of the loop to continue
```

### Example: Compute Fibonacci Numbers and Win

The program will cycle until the number 233 is computed and then the user will win after around 100 CPU cycles.

```
:init load r3 1      ; load 1 into both r1 and r2 to start
      load r2 1

:loop mov r2 r1      ; the second number becomes the first number
      mov r3 r2      ; the previous addition currently in r3 becomes the second number
      add            ; first and second numbers in r1 and r2 are added and the result is stored in r3
      mov r2 r4      ; we are about to compare r3 with r2 so we save the old r2 into r4 for now
      load r2 233    ; the winning number is loaded into r2 for comparison with the added number in r3
      load r1 win    ; the address of where we would jump if we win goes into r1
      jeq            ; If r2 equals r3 we jump to r1 and win the game
      mov r4 r2      ; didn't win, now old r2 is put back from r4 so that we can proceed with the loop
      load r1 loop   ; memory address of the beginning of the loop is loaded into r1
      jmp            ; jump back to the beginning of the loop to continue

:win                 ; win marker to end after complete
win                  ; frees up the coins for the winner and breaks down the CPU
```

### Example: Password checking program

This example demonstrates OP_READ and OP_PRINT by having the user guess the password of 1234.

```
:start   load r3 1234                                       ; the correct password is loaded into r3
         load r1 "Password: "                               ; password prompt message is loaded into r1
         print                                              ; password prompt message from r1 is printed to the screen
         read                                               ; a user-entered value is read into r1
         mov r1 r2                                          ; the value is moved to r2 for later comparison with r3
         load r1 success                                    ; load the success address in r1
         jeq                                                ; jump to success address if passwords are equal
         load r1 "Wrong password! Consider using Authrite." ; load failure message in r1
         print                                              ; print failure message
         load r1 start                                      ; load start address into r1
         jmp                                                ; jump to start address
:success win                                                ; unlock the contract with the password
```

### Example: Is Bitcoin Turing Complete?

To make the above code more interesting, we can introduce OP_BILL which requires the person executing the contract to pay in order to continue.

We will ask the user if Bitcoin is Turing complete. If they answer yes, the program will let them win. If they answer no, they can try again but only after paying 4 million BSV into the contract.

```
:start   load r3 1                                          ; the CORRECT answer is loaded into r3
         load r1 "Is Bitcoin Turing complete? [0/1]:"       ; question is loaded into r1
         print                                              ; question from r1 is printed to the screen
         read                                               ; a user-entered value is read into r1
         mov r1 r2                                          ; the value is moved to r2 for later comparison with r3
         load r1 success                                    ; load the success address in r1
         jeq                                                ; jump to success address if answer is correct
         load r1 "Pay 1 BSV and try that again."            ; load failure message in r1
         print                                              ; print failure message
         load r1 400000000000000                            ; load the number of satoshis to bill into r1
         bill                                               ; bill the user for their incompetence
         load r1 start                                      ; load start address back into r1
         jmp                                                ; jump to start address
:success win                                                ; unlock the contract with the correct answer
```

### Example: Push Pop Cat Greeter

![A cat is greeting you while holding a push pop popsickle](./public/push-pop-cat-greeter.webp)

This example demonstrates stack operations by asking a user to enter their name. The name is then pushed, registers are moved, and the name is popped back into the right place. Finally, the name and greeting are concatenated before being displayed.

```
load r2 "Greetings, "        ; load the greeting in r2
load r1 "Enter your name:"   ; load the prompt for the name in r1
print                        ; print the prompt for the name from r1
read                         ; read the user input into r1
push r1                      ; push the user input onto the stack
mov r2 r1                    ; move the greeting to r1
pop r2                       ; pop the top stack item into r2
cat                          ; concatenate r1 and r2 into r3
mov r3 r1                    ; move the final message from r3 into r1
print                        ; print the message from r1 to the screen
win                          ; release the contract and break down the CPU
```

### Example: Subroutine Guessing Game

In this example, we will build a guessing game. A user can guess a number and learn if it is higher or lower than the correct answer. When they guess the answer, they will win. A subroutine is used for checking answers and displaying higher or lower feedback.

```
load r4 42                                 ; store the secret value in r4 to start

:prompt load r1 "Enter your guess:"        ; load a prompt into r1
        print                              ; show the prompt to the user
        read                               ; ask the user for their guess
        setBase                            ; establish a new stack frame for the subroutine
        push r4                            ; push the correct answer as the first stack element
        push r1                            ; push the guess as the second stack element
        load r1 check                      ; load the subroutine address for the jump
        jsr                                ; jump to the subroutine call
        clearBase                          ; clear any stack elements from the subroutine's stack frame
        load r1 "Try again? [yes/no]"      ; load a try again prompt
        print                              ; print the try again prompt
        read                               ; read the user's response into r1
        load r3 "yes"                      ; load the affirmative response for comparison
        mov r1 r2                          ; move the user response into r2 for comparison with r3
        load r1 prompt                     ; load prompt code address for conditional jump
        jeq                                ; if user entered yes, jump to the prompt code
        lose                               ; user indicated no desire to continue, halt program (dead CPU)

:check  pop r2                             ; the top stack value is the guess which goes into r2
        pop r3                             ; next we have the correct answer which is loaded into r3
        load r1 win                        ; address of the success code is loaded for conditional jump
        jeq                                ; jump to success code if r2 equals r3 (user guessed right)
        mov r3 r1                          ; correct answer moved from r3 to r1 for comparison
        lessthan                           ; check correct answer is less than the guessed answer, r3 will be 1 if so
        mov r3 r2                          ; the result is moved to r2 for evaluation
        load r1 high                       ; load address of too high code for conditional jump
        jnz                                ; jump to the too high code if r2 is 1 (correct answer is less)
:low    load r1 "Your guess is too low!"   ; load too low message in r1
        print                              ; print the too low message from r1
        rsr                                ; return back to the prompt loop
:high   load r1 "Your guess is too high!"  ; load a too high message
        print                              ; print the too high message
        rsr                                ; return back to the prompt loop
:win    load r1 "Your guess was correct!"  ; load a success message
        print                              ; print the success message
        win                                ; break down the CPU and claim the reward
```

### Example: Recursive Subroutine Factorial Computation

This example demonstrates recursive subroutine calls by computing factorials.

```
:start
      load r1 "Enter a number:"  ; Prompt for input
      print                      ; Display prompt
      read                       ; Read the input number into r1
      setBase                    ; Create a new stack frame for the subroutine
      push r1                    ; push the factorial we are computing onto the stack
      load r1 factorial          ; load the address of the factorial code for subroutine jump
      jsr                        ; Jump to factorial subroutine
      pop r1                     ; pop return value off the stack into r1 for printing
      clearBase                  ; clear the no-longer-needed stack frame
      print                      ; Print the factorial result
      win                        ; End of program

:factorial
      pop r3                     ; Pop the value we are computing into r3 for comparison with r2
      load r2 1                  ; Load the base case number into r2
      load r1 end_basecase       ; Load end base-case code address for conditional jump
      jeq                        ; If input is 1, end recursion
      mov r3 r1                  ; Move input into r1 for subtraction by 1
      sub                        ; Calculate input - 1
      push r1                    ; Save a copy of the n value for after recursion
      setBase                    ; new stack frame for the recursive call
      push r3                    ; push the value to compute
      load r1 factorial          ; load address of factorial code for recursive call
      jsr                        ; Recursively call factorial with input - 1 on stack
:end_recursion
      pop r2                     ; Obtain the computed factorial
      clearBase                  ; Destroy the stack frame of the recursive call
      pop r1                     ; Recover the original value we were computing from earlier
      mul                        ; Multiply n * factorial(n-1)
      push r3                    ; Leave the computed factorial on the stack for the caller
      rsr                        ; Return from subroutine
:end_basecase
      push 0x01                  ; Leave the computed factorial of one for the caller
      rsr                        ; Return from subroutine
```

### Example: Runtime Programmable Computer (ROM)

This example allows a user to write, execute and read memory locations in the heap. At runtime, the user can enter instructions to load into the heap and then jump to the start of their program, enabling them to dynamically execute arbitrary code on the CPU.

```
:start load r1 "0=write, 1=jump, 2=read:"  ; load prompt into r1
       print                               ; print prompt on screen
       read                                ; read user input
       mov r1 r3                           ; move user input to r3 for comparison
       load r2 0                           ; load 0 for comparison
       load r1 write                       ; load write code address for conditional jump
       jeq                                 ; jump to write if user entered 0
       load r2 1                           ; load 1 for comparison
       load r1 jump                        ; load jump address for comditional jump
       jeq                                 ; jump to jump code if user entered 1
       load r2 2                           ; load 2 for comparison
       load r1 read                        ; load read code address for conditional jump
       jeq                                 ; jump to read code if user entered 2
       load r1 "Invalid selection."        ; load invalid entry message
       print                               ; print invalid entry message
       load r1 start                       ; ho back to the beginning
       jmp                                 ; ^
:write load r1 "Address to write:"         ; ask for an address to write
       print                               ;
       read                                ;
       mov r1 r2                           ; move user input into r2
       load r1 "Data to write:"            ; ask for data to write
       read                                ;
       store                               ; store the r1 data into the address at r2
       load r1 start                       ; back to the beginning
       jmp                                 ;
:jump  load r1 "Jump to:"                  ; ask where to jump
       print                               ;
       read                                ;
       jmp                                 ; jump there.
:read  load r1 "Address to read:"          ; ask where to read from
       print                               ;
       read                                ;
       mov r1 r2                           ; move address into r2
       loadmem                             ; load from address r2 into r1
       print                               ; print r1
       load r1 start                       ; back to the beginning
       jmp                                 ;
```


## Target Problem Sets

The CPU excels at problems where the number of iterations is not known at the time the problem is proposed. Conventional predicate-based code can be used in conjunction with loop unrolling when the number can be approximated, but this approach enables the solver to dynamically interact with the contract. With future expansion into areas like checkpointing and data signature verification, the proposer, or even other parties entirely, can interact with contracts dynamically while they're being worked on.

## Implications

The implications of being able to execute general computation within Bitcoin, including the ability for jumps and subroutines, are significant. The path is now clear for ports of existing CPU architectures like the 6502, as well as high-level language compilation like C and even Solidity. The wider economic implications are also significant, with the ability for people to propose new types of contracts. People can create simulated worlds in which the efficiency of various processes are assessed, such as the routing of shipping containers across logistics networks. Those that provide the best solutions given the constraints are financially rewarded. Memory-mapped I/O can be connected to the heap as required by various applications, and used in conjunction with the load and store instructions. It's also conceptually possible to run AI inference, utilizing the results as a way to evaluate the success of various proposed puzzle solutions.

In closing, Bitcoin was always as Turing complete as any existing machine. Transactions drive the execution of programs, which do not need to fit within a single script. A potentially never-ending loop can be executed for as long as a solver is willing to bear the necessary transaction fees — something he would only do if it eventually leads to the correct solution.

# License

The license for the code in this repository is the Open BSV License.

Feel free to use it, but only on the Bitcoin SV blockchain, as defined by the BSV Association.
