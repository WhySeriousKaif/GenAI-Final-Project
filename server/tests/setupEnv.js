// Ensure the AI services initialize in OFFLINE/MOCK mode during tests by
// guaranteeing no OpenAI key is present. This makes the suite deterministic
// and free of any network dependency.
delete process.env.OPENAI_API_KEY;
