// =========================================================================
// LLM Provider Factory
// =========================================================================
// Single entry point that resolves which provider the app uses, based on
// centralized config. Consuming services call getProvider() and never touch
// a concrete provider class or vendor SDK directly (Dependency Inversion).

const { getGeminiClient } = require('../../config/aiConfig');
const GeminiProvider = require('./GeminiProvider');
const MockProvider = require('./MockProvider');
const FallbackProvider = require('./FallbackProvider');

let _provider = null;

/**
 * Returns the singleton provider:
 *  - Online: Gemini wrapped with a Mock fallback (resilient).
 *  - Offline: Mock only.
 */
const getProvider = () => {
  if (!_provider) {
    const client = getGeminiClient();
    _provider = client
      ? new FallbackProvider(new GeminiProvider(client), new MockProvider())
      : new MockProvider();
    console.log(`[AI] Provider initialized: ${client ? 'Gemini (with offline fallback)' : 'Offline Mock'}`);
  }
  return _provider;
};

module.exports = { getProvider };
