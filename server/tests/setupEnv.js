// Ensure the AI services initialize in OFFLINE/MOCK mode during tests by
// guaranteeing no Gemini key is present. This makes the suite deterministic
// and free of any network dependency.
delete process.env.GEMINI_API_KEY;
