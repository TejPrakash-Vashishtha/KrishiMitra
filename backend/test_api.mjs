const baseUrl = 'http://localhost:5000/api/auth';

async function testApi() {
  console.log('Testing Registration...');
  const phone = '+91' + Math.floor(1000000000 + Math.random() * 9000000000); // random 10 digit number with +91
  const pin = '1234';
  
  const regRes = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Farmer',
      phone: phone,
      password: pin,
      role: 'FARMER',
      district: 'Bhubaneswar'
    })
  });
  
  const regData = await regRes.json();
  console.log('Registration Response:', regRes.status, regData);
  
  if (regData.success) {
    console.log('\nTesting Login...');
    const loginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone,
        password: pin
      })
    });
    const loginData = await loginRes.json();
    console.log('Login Response:', loginRes.status, loginData);
    
    console.log('\nTesting Login with wrong password...');
    const wrongLoginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone,
        password: 'wrong'
      })
    });
    const wrongLoginData = await wrongLoginRes.json();
    console.log('Wrong Login Response:', wrongLoginRes.status, wrongLoginData);
  }
}

testApi();
