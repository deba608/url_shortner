async function test() {
  const email = 'noreply.dev.sh@gmail.com';
  console.log("Registering...");
  await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: "Dev", email, password: "password123" })
  });

  console.log("Triggering forgot password...");
  const res = await fetch('http://localhost:3000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Data:", data);
}
test();
