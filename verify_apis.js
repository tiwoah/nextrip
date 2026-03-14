async function testAll() {
  const baseURL = "http://localhost:3000/api";
  
  // Test Chat
  console.log("--- Testing Chat API ---");
  try {
    const chatRes = await fetch(`${baseURL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "Hi!" }] }),
    });
    console.log("Chat Status:", chatRes.status);
    const chatData = await chatRes.json();
    console.log("Chat Response:", JSON.stringify(chatData, null, 2));
  } catch (e) {
    console.log("Chat Test Failed:", e.message);
  }

  // Test Generate
  console.log("\n--- Testing Generate API ---");
  try {
    const genRes = await fetch(`${baseURL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "A 1-day trip to Paris" }),
    });
    console.log("Generate Status:", genRes.status);
    const genData = await genRes.json();
    console.log("Generate Trip ID:", genData.trip_id);
    console.log("Generate Days:", genData.days?.length);
  } catch (e) {
    console.log("Generate Test Failed:", e.message);
  }
}

testAll();
