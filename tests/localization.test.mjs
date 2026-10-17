import test from 'node:test';
import assert from 'node:assert/strict';
import { messages, supportedLanguages } from '../src/features/localization/translations.ts';

test('every supported locale contains the same required interface strings', () => {
  const reference = Object.keys(messages.en).sort();
  assert.deepEqual([...supportedLanguages].sort(), ['de','en','es','fr','ro','ru','uk']);
  for (const language of supportedLanguages) {
    assert.deepEqual(Object.keys(messages[language]).sort(), reference, `${language} is missing a translation`);
    for (const [key, value] of Object.entries(messages[language])) assert.ok(value.trim(), `${language}.${key} is empty`);
  }
});
