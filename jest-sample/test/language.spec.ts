import { Language } from '../src';

describe('Language', () => {
    it('Should return the local language code', () => {
        const languageCode = Language.getLocalized();

        expect(languageCode).toBe('en-us');
    });

});
