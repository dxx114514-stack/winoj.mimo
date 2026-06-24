const API = 'http://localhost:3000/api/v1';

async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  return res.json();
}

async function seed() {
  console.log('Logging in as admin...');
  const login = await api('POST', '/auth/login', { username: 'admin', password: 'admin123' });
  if (!login.access_token) { console.error('Login failed:', login); process.exit(1); }
  const token = login.access_token;
  console.log('Logged in.');

  console.log('Creating problem...');
  const problem = await api('POST', '/problems', {
    title: 'A + B Problem',
    description: 'Given two integers A and B, calculate their sum A + B.\n\nThis is a classic problem to test if the sandbox works correctly.',
    input_desc: 'The input contains two integers A and B, separated by a space.\n1 <= A, B <= 1000',
    output_desc: 'Output the sum A + B.',
    hint: 'Use standard input/output. Read two integers and print their sum.',
    time_limit: 1000,
    memory_limit: 256,
    problem_type: 'traditional',
    compare_mode: 'text_strict',
    is_public: true
  }, token);
  if (!problem.id) { console.error('Create problem failed:', problem); process.exit(1); }
  console.log(`Created problem #${problem.id}: ${problem.title}`);

  console.log('Adding test cases...');
  const tcResult = await api('POST', `/problems/${problem.id}/testcases`, {
    test_cases: [
      { input_data: '1 2', output_data: '3', score: 25 },
      { input_data: '100 200', output_data: '300', score: 25 },
      { input_data: '0 0', output_data: '0', score: 25 },
      { input_data: '999 1', output_data: '1000', score: 25 },
    ]
  }, token);
  console.log(tcResult.message);

  console.log(`\nDone!`);
  console.log(`  IDE:      http://localhost:3000/pages/ide.html`);
  console.log(`  Problem:  http://localhost:3000/pages/problem.html?id=${problem.id}`);
  console.log(`  Submit:   http://localhost:3000/pages/submit.html?id=${problem.id}`);
}

seed().catch(err => { console.error(err); process.exit(1); });
