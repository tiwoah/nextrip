const OpenAI = require('openai');

async function testEndpoint() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = "https://vjioo4r1vyvcozuj.us-east-2.aws.endpoints.huggingface.cloud/v1";
  
  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });

  const messages = [
    { role: "system", content: "You are a helpful assistant. Respond only in JSON." },
    { role: "user", content: "Say hello in JSON format: { 'message': 'hello' }" }
  ];

  console.log("--- TEST 1: With response_format: { type: 'json_object' } ---");
  try {
    const res1 = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: messages,
      response_format: { type: "json_object" },
      max_tokens: 100,
    });
    console.log("Finish Reason:", res1.choices[0].finish_reason);
    console.log("Content:", JSON.stringify(res1.choices[0].message.content));
  } catch (e) {
    console.log("Test 1 Failed:", e.message);
  }

  console.log("\n--- TEST 2: Without response_format ---");
  try {
    const res2 = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: messages,
      max_tokens: 100,
    });
    console.log("Finish Reason:", res2.choices[0].finish_reason);
    console.log("Content:", JSON.stringify(res2.choices[0].message.content));
  } catch (e) {
    console.log("Test 2 Failed:", e.message);
  }
}

testEndpoint();
