async function submitLogin() {
  const account = document.getElementById('account').value;
  const password = document.getElementById('password').value;
  const captcha = document.getElementById('captcha').value;
  const csrf = document.getElementById('csrf').textContent;
  const xsrf = document.getElementById('xsrf').textContent;
  const session = document.getElementById('session').textContent;

  if (!account || !password || !captcha) {
    alert('Please fill in all fields');
    return;
  }

  try {
    const response = await axios.post('/api/login', {
      account,
      password,
      captcha,
      csrf,
      xsrf,
      session
    });

    if (response.data.success) {
      window.location.href = response.data.redirectUrl;
    } else {
      alert(response.data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Failed to login. Please try again.');
  }
} 