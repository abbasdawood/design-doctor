
import { resetCounter, librariesCount } from '../utils';

describe('Utils', () => {
  describe('resetCounter', () => {
    it('should reset the librariesCount to empty objects', () => {
      // Call the resetCounter function
      resetCounter();
      
      // Check that all the properties have been reset
      expect(librariesCount.components).toEqual({});
      expect(librariesCount.localComponents).toEqual({});
      expect(librariesCount.detachedComponents).toEqual({});
      expect(librariesCount.colourStyles).toEqual({});
      expect(librariesCount.textStyles).toEqual({});
    });
  });
});
