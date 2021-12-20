const Interpreter = require('./index');
const Trie = require('../store/trie');
const {
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
} = Interpreter.OPCODE_MAP;
//Test the interpreter
describe('Interpreter', () => {
  describe('runCode()', () => {
    //Test the addition opCode.
    describe('and the code includes ADD', () => {
      it('adds two values', () => {
        expect(
          new Interpreter().runCode([PUSH, 2, PUSH, 3, ADD, STOP]).result
        ).toEqual(5);
      });
    });
    //Test the subtraction opCode.
    describe('and the code includes SUB', () => {
      it('subtracts one value from another', () => {
        expect(
          new Interpreter().runCode([PUSH, 2, PUSH, 3, SUB, STOP]).result
        ).toEqual(1);
      });
    });
    //Test the multiplication opCode.
    describe('and the code includes MUL', () => {
      it('multiplies one value by another', () => {
        expect(
          new Interpreter().runCode([PUSH, 2, PUSH, 3, MUL, STOP]).result
        ).toEqual(6);
      });
    });
    //Test the division opCode.
    describe('and the code includes DIV', () => {
      it('divides one value from another', () => {
        expect(
          new Interpreter().runCode([PUSH, 2, PUSH, 3, DIV, STOP]).result
        ).toEqual(1.5);
      });
    });
    //Test the less than opCode.
    describe('and the code includes LT', () => {
      it('checks if one value is less than another (false)', () => {
        expect(
          new Interpreter().runCode([PUSH, 2, PUSH, 3, LT, STOP]).result
        ).toEqual(0);
      });
    });

    describe('and the code includes LT', () => {
      it('checks if one value is less than another (true)', () => {
        expect(
          new Interpreter().runCode([PUSH, 3, PUSH, 2, LT, STOP]).result
        ).toEqual(1);
      });
    });
    //Test the greater than opCode.
    describe('and the code includes GT', () => {
      it('checks that one value is greater than another (false)', () => {
        expect(
          new Interpreter().runCode([PUSH, 3, PUSH, 2, GT, STOP]).result
        ).toEqual(0);
      });
    });

    describe('and the code includes GT', () => {
      it('checks that one value is greater than another (true)', () => {
        expect(
          new Interpreter().runCode([PUSH, 2, PUSH, 3, GT, STOP]).result
        ).toEqual(1);
      });
    });
    //Test the equality opCode.
    describe('and the code includes EQ', () => {
      it('checks that one value is equal to another (false)', () => {
        expect(
          new Interpreter().runCode([PUSH, 2, PUSH, 3, EQ, STOP]).result
        ).toEqual(0);
      });
    });

    describe('and the code includes EQ', () => {
      it('checks that one value is equal to another (true)', () => {
        expect(
          new Interpreter().runCode([PUSH, 2, PUSH, 2, EQ, STOP]).result
        ).toEqual(1);
      });
    });
    //Test the AND opCode.
    describe('and the code includes AND', () => {
      it('ands two conditions (false)', () => {
        expect(
          new Interpreter().runCode([PUSH, 1, PUSH, 0, AND, STOP]).result
        ).toEqual(0);
      });
    });

    describe('and the code includes AND', () => {
      it('ands two conditions (true)', () => {
        expect(
          new Interpreter().runCode([PUSH, 1, PUSH, 1, AND, STOP]).result
        ).toEqual(1);
      });
    });
    //Test the OR opCode.
    describe('and the code includes OR', () => {
      it('ors two conditions', () => {
        expect(
          new Interpreter().runCode([PUSH, 1, PUSH, 0, OR, STOP]).result
        ).toEqual(1);
      });
    });
    //Test the JUMP opCode.
    describe('and the code includes JUMP', () => {
      it('jumps to a destination', () => {
        expect(
          new Interpreter().runCode(
            [PUSH, 6, JUMP, PUSH, 0, JUMP, PUSH, 'jump successful!', STOP]
          ).result
        ).toEqual('jump successful!');
      });
    });
    //Test the conditional JUMPI opCode.
    describe('and the code includes JUMPI', () => {
      it('jumps to a destination based on a conditional', () => {
        expect(
          new Interpreter().runCode(
            [PUSH, 8, PUSH, 1, JUMPI, PUSH, 0, JUMP, PUSH, 'jump successful!', STOP]
          ).result
        ).toEqual('jump successful!');
      });
    });

    describe('and the code includes STORE', () => {
      it('stores a value', () => {
        const interpreter = new Interpreter({
          storageTrie: new Trie()
        });
        const key = 'foo';
        const value = 'bar';

        interpreter.runCode([PUSH, value, PUSH, key, STORE, STOP]);

        expect(interpreter.storageTrie.get({key})).toEqual(value);
      });
    });

    describe('and the code includes LOAD', () => {
      it('loads a stored value', () => {
        const interpreter = new Interpreter({
          storageTrie: new Trie()
        });
        const key = 'foo';
        const value = 'bar';

        expect(interpreter.runCode(
          [PUSH, value, PUSH, key, STORE, PUSH, key, LOAD, STOP]
        ).result
      ).toEqual(value);
      });
    });

    describe('and the code includes an invalid JUMP destination', () => {
      it('throws a destination error', () => {
        expect(
          () => new Interpreter().runCode(
            [PUSH, 99, JUMP, PUSH, 0, JUMP, PUSH, 'jump successful!', STOP]
          )
        ).toThrow('Invalid destination: 99');
      });
    });
    //Test for an invalid PUSH opCode.
    describe('and the code includes an invalid PUSH value', () => {
      it('throws a PUSH error', () => {
        expect(
          () => new Interpreter().runCode([PUSH, 0, PUSH])
        ).toThrow("The 'PUSH' opCode cannot be last.");
      });
    });
    //Test that the interpreter catches an infinite loop in the code.
    describe('and the code includes an infinite loop', () => {
      it('throws an Execution Limit error', () => {
        expect(
          () => new Interpreter().runCode([PUSH, 0, JUMP, STOP])
        ).toThrow('Check for an infinite loop. Execution limit of 25000 exceeded');
      });
    });
  });
});
