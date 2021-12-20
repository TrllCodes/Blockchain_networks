/**
 * Add more opCodes to the smart contract language (study beigepapers)
 * Keep an eye out for the "halt" problem while developing the new language
 */

/** The all caps notation indicates a global constant. */
/** WAYS TO IMPROVE: add more operands, ensure that every used argument matches opCode,
 ensure that values are only numerical data types for particular opCodes. */
const STOP = 'STOP';
const ADD = 'ADD';
const SUB = 'SUB';
const MUL = 'MUL';
const DIV = 'DIV';
const PUSH = 'PUSH';
/** The logic for the comparison-based operands will be for the code to push
either a 1 or a zero on to the stack, where 1 represents true and 0 represents
false for the given condition. */
const LT = 'LT';
const GT = 'GT';
const EQ = 'EQ';
const AND = 'AND';
const OR = 'OR';
const JUMP = 'JUMP';
const JUMPI = 'JUMPI';
const STORE = 'STORE';
const LOAD = 'LOAD';

const OPCODE_MAP = {
  STOP,
  ADD,
  SUB,
  MUL,
  DIV,
  PUSH,
  LT,
  GT,
  EQ,
  AND,
  OR,
  JUMP,
  JUMPI,
  STORE,
  LOAD
};

const OPCODE_GAS_MAP = {
  STOP: 0,
  ADD: 1,
  SUB: 1,
  MUL: 1,
  DIV: 1,
  PUSH: 0,
  LT: 1,
  GT: 1,
  EQ: 1,
  AND: 1,
  OR: 1,
  JUMP: 2,
  JUMPI: 2,
  STORE: 5,
  LOAD: 5
};
const EXECUTION_COMPLETE = 'Program execution complete';
const EXECUTION_LIMIT = 25000;

class Interpreter {
 /** This class will serve to execute code within the virtual machine.
 * The constructor state field keeps track of changes in data as the Interpreter
 * executes code. It contains a program counter to track the number of
 * programs being run; an empty stack array into which values from the executed
 * code are placed; an empty code array which will store the programs being
 * executed as items within the array; and a steps-to-execution counter which will
 * prevent overly large programs from eating up memory. */
 constructor({storageTrie} = {}) {
   this.state = {
     programCounter: 0,
     stack: [],
     code: [],
     executionCount: 0
   };
   this.storageTrie = storageTrie;
 }
 // Jump function, for use in JUMP & JUMPI
 jump() {
   const destination = this.state.stack.pop();
   //Make sure that the jump goes to a valid index
   if (
     destination < 0
     || destination > this.state.code.length
   ) {
     throw new Error(`Invalid destination: ${destination}`);
   }

   this.state.programCounter = destination;
   //this ensures that the programCounter doesnt increment beyond the jump point.
   this.state.programCounter--;
 }
 /** The runCode module will serve as the actual place where code is executed
 within the Interpreter class. */
 runCode(code) {
   this.state.code = code;
   let gasUsed = 0;
   /** Run a while loop that runs for the length of the code array. The opCode
   * constant (opCode is the technical term for instruction) will access the code
   * that needs to be executed by going into the code array and accessing the
   * specific piece of code at the index position indicated by
   * this.state.programCounter. Then it moves forward in the array with
   * the ++ command, eventually ending the while loop once this.state.programCounter
   * is no longer less than the code array length. */
   while (this.state.programCounter < this.state.code.length) {
     this.state.executionCount++; // advance the steps-execution counter
     // check for infinite loops in the steps execution count
     if (this.state.executionCount > EXECUTION_LIMIT) {
       throw new Error(
         `Check for an infinite loop. Execution limit of ${EXECUTION_LIMIT} exceeded`
       );
     }
     // opCode is located at the index position of the programCounter within the code.
     const opCode = this.state.code[this.state.programCounter];

     gasUsed += OPCODE_GAS_MAP[opCode];

     let value;
     let key;

     try {
       switch (opCode) {
         case STOP:
           throw new Error(EXECUTION_COMPLETE);
         case PUSH:
           this.state.programCounter++; // advance the program counter.
           //Make sure the PUSH command cannot progress to an invalid index.
           if (this.state.programCounter === this.state.code.length) {
             throw new Error(`The 'PUSH' opCode cannot be last.`);
           }
           // Otherwise, proceed to push the value into the stack.
           value = this.state.code[this.state.programCounter];
           this.state.stack.push(value);
           break;
         case ADD:
         case SUB:
         case MUL:
         case DIV:
         case LT:
         case GT:
         case EQ:
         case AND:
         case OR:
           const a = this.state.stack.pop();
           const b = this.state.stack.pop();

           let result;

           if (opCode === ADD) result = a + b;
           if (opCode === SUB) result = a - b;
           if (opCode === MUL) result = a * b;
           if (opCode === DIV) result = a / b;
           if (opCode === LT) result = a < b ? 1 : 0;
           if (opCode === GT) result = a > b ? 1 : 0;
           if (opCode === EQ) result = a === b ? 1 : 0;
           if (opCode === AND) result = a && b;
           if (opCode === OR) result = a || b;

           this.state.stack.push(result);
           break;
         case JUMP:
           this.jump();
           break;
         case JUMPI:
           const condition = this.state.stack.pop();

           if (condition === 1) {
             this.jump();
           }
           break;
         case STORE:
           key = this.state.stack.pop();
           value = this.state.stack.pop();

           this.storageTrie.put({key, value});
           break;
         case LOAD:
           key = this.state.stack.pop();
           value = this.storageTrie.get({key});

           this.state.stack.push(value)
           break;
         default:
           break;
       }
     } catch (error) { //once it catches the STOP opCode, it should return the final value.
       if (error.message === EXECUTION_COMPLETE) {
         return {
           result: this.state.stack[this.state.stack.length-1],
           gasUsed
         }
       }

       throw error;
     }

     this.state.programCounter++;
   }
 }
}

Interpreter.OPCODE_MAP = OPCODE_MAP;
module.exports = Interpreter;


// /** TEST CASES */
// //Test addition function.
// let code = [PUSH, 2, PUSH, 3, ADD, STOP];
// let result = new Interpreter().runCode(code);
// console.log('Result of 3 ADD 2:', result);
// //Test subtraction function.
// code = [PUSH, 2, PUSH, 3, SUB, STOP];
// result = new Interpreter().runCode(code);
// console.log('Result of 3 SUB 2:', result);
// //Test multiplication function.
// code = [PUSH, 2, PUSH, 3, MUL, STOP];
// result = new Interpreter().runCode(code);
// console.log('Result of 3 MUL 2:', result);
// //Test division function.
// code = [PUSH, 2, PUSH, 3, DIV, STOP];
// result = new Interpreter().runCode(code);
// console.log('Result of 3 DIV 2:', result);
// //Test less than function.
// code = [PUSH, 2, PUSH, 3, LT, STOP];
// result = new Interpreter().runCode(code);
// console.log('Result of 3 LT 2:', result);
// //Test greater than function.
// code = [PUSH, 2, PUSH, 3, GT, STOP];
// result = new Interpreter().runCode(code);
// console.log('Result of 3 GT 2:', result);
// //Test equal-to function.
// code = [PUSH, 2, PUSH, 2, EQ, STOP];
// result = new Interpreter().runCode(code);
// console.log('Result of 2 EQ 2:', result);
// //Test and operand function.
// code = [PUSH, 1, PUSH, 0, AND, STOP];
// result = new Interpreter().runCode(code);
// console.log('Result of 0 AND 1:', result);
// //Test or operand function.
// code = [PUSH, 1, PUSH, 0, OR, STOP];
// result = new Interpreter().runCode(code);
// console.log('Result of 1 OR 0:', result);
// //Test jump function.
// code = [PUSH, 6, JUMP, PUSH, 0, JUMP, PUSH, 'jump successful!', STOP];
// result = new Interpreter().runCode(code);
// console.log('Result of JUMP:', result);
// //Test conditional jump function.
// code = [PUSH, 8, PUSH, 1, JUMPI, PUSH, 0, JUMP, PUSH, 'jump successful!', STOP];
// result = new Interpreter().runCode(code);
// console.log('Result of JUMPI:', result);
// //Test invalid destination error function.
// code = [PUSH, 99, JUMP, PUSH, 0, JUMP, PUSH, 'jump successful!', STOP];
// try {
//   new Interpreter().runCode(code);
// } catch (error) {
//   console.log('Invalid destination error:', error.message);
// }
// //Test invalid push error function.
// code = [PUSH, 0, PUSH];
// try {
//   new Interpreter().runCode(code);
// } catch (error) {
//   console.log('Expected invalid PUSH error:', error.message);
// }
// //Test invalid execution limit function.
// code = [PUSH, 0, JUMP, STOP];
// try {
//   new Interpreter().runCode(code);
// } catch (error) {
//   console.log('Expected invalid execution error:', error.message);
// }
