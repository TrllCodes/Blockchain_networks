const {sortCharacters, keccakHash} = require('./index');

/** Test the utilities functions. */
describe('utils', () => {
  // Test the sortCharacters function.
  describe('sortCharacters', () => {
    it('creates the same string for objects with the same properties in a different order', () => {
      expect(sortCharacters({foo: 'foo', bar: 'bar'}))
        .toEqual(sortCharacters({bar: 'bar', foo: 'foo'}));
    });

    it('creates a different string for different objects', () => {
      expect(sortCharacters({foo: 'foo'}))
        .not.toEqual(sortCharacters({bar: 'bar'}));
    });
  });
  // Test the keccakHash generator function.
  describe('keccakHash', () => {
    it('produces a keccak256 hash', () => {
      /** Check to ensure that the keccak hash produces a consistent value for the same string. */
      expect(keccakHash('foo'))
        .toEqual('b2a7ad9b4a2ee6d984cc5c2ad81d0c2b2902fa410670aa3f2f4f668a1f80611c');
    });
  });
});
