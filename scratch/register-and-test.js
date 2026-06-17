async function registerAndTest() {
  const email = 'pdebashish608@gmail.com';
  const password = 'testpass123';

  console.log("1. Registering", email, "...");
  const regRes = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: "Debashish", email, password })
  });
  const regData = await regRes.json();
  console.log("   Status:", regRes.status, "| Response:", regData.message || regData.error);

  console.log("\n2. Triggering forgot password for", email, "...");
  const forgotRes = await fetch('http://localhost:3000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const forgotData = await forgotRes.json();
  console.log("   Status:", forgotRes.status, "| Response:", forgotData.message || forgotData.error);

  if (forgotRes.ok) {
    console.log("\n✅ Email should be arriving in", email, "inbox now!");
  }
}
registerAndTest();
