// Characterization tests for the text extractor's error/validation behavior.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { extractTextFromFile } = require('../services/textExtractor');

describe('textExtractor.extractTextFromFile', () => {
  test('rejects unsupported extensions for existing files', async () => {
    const tmp = path.join(os.tmpdir(), `extractor-test-${Date.now()}.txt`);
    fs.writeFileSync(tmp, 'plain text');
    try {
      await expect(
        extractTextFromFile(tmp, path.basename(tmp))
      ).rejects.toThrow(/Unsupported file extension/i);
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  test('rejects missing files for supported extensions', async () => {
    await expect(
      extractTextFromFile('/tmp/does-not-exist-12345.pdf', 'does-not-exist-12345.pdf')
    ).rejects.toThrow(/File not found/i);
  });
});
