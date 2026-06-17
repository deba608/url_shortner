async function test() {
  console.log("Hitting the endpoint...");
  const res = await fetch('http://localhost:3000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'noreply.dev.sh@gmail.com' }) // This MUST be a registered email
  });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Data:", data);
}
test();
