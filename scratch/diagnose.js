async function test() {
  console.log("Testing forgot password endpoint...");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pdebashish608@gmail.com' }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data:", data);
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error("❌ REQUEST TIMED OUT after 5 seconds — backend is hanging!");
    } else {
      console.error("❌ Error:", err.message);
    }
  }
}
test();
