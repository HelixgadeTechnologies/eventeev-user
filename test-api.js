async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/events/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test-user@example.com", fullName: "Test User", code: "TEST1234" })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
