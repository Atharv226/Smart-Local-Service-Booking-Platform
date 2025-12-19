

const API_URL = 'http://localhost:5000/api';


async function run() {
  try {
    // 1. Register Provider
    const providerPhone = `999${Date.now().toString().slice(-7)}`;
    const providerRes = await fetch(`${API_URL}/auth/register/provider`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Provider',
        age: 30,
        mobileNumber: providerPhone,
        password: 'password123',
        serviceType: 'Home Repair & Maintenance',
        serviceArea: 'Mumbai',
        availableTimings: '9-5',
      }),
    });
    const providerData = await providerRes.json();
    if (!providerRes.ok) throw new Error(`Provider reg failed: ${JSON.stringify(providerData)}`);
    console.log('✅ Provider Registered:', providerData.user.id);
    const providerToken = providerData.token;
    const providerId = providerData.provider._id;

    // 2. Register Customer
    const customerPhone = `888${Date.now().toString().slice(-7)}`;
    const customerRes = await fetch(`${API_URL}/auth/register/customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Customer',
        mobileNumber: customerPhone,
        password: 'password123',
        email: 'test@example.com',
        address: 'Test Address',
      }),
    });
    const customerData = await customerRes.json();
    if (!customerRes.ok) throw new Error(`Customer reg failed: ${JSON.stringify(customerData)}`);
    console.log('✅ Customer Registered:', customerData.user.id);
    const customerToken = customerData.token;

    // 3. Customer creates booking
    // Note: The frontend might be sending the User ID or the Provider ID.
    // My fix in customerRoutes.js handles both. Let's try sending the Provider ID first (ideal case).
    console.log(`Creating booking for provider ${providerId}...`);
    const bookingRes = await fetch(`${API_URL}/customers/bookings`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        providerId: providerId,
        description: 'Fix my leak',
        serviceType: 'Home Repair & Maintenance',
        scheduledTime: new Date().toISOString(),
      }),
    });
    const bookingData = await bookingRes.json();
    if (!bookingRes.ok) throw new Error(`Booking creation failed: ${JSON.stringify(bookingData)}`);
    console.log('✅ Booking Created:', bookingData._id);

    // 4. Provider fetches jobs
    console.log('Provider fetching jobs...');
    const jobsRes = await fetch(`${API_URL}/providers/jobs`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${providerToken}`
      },
    });
    const jobsData = await jobsRes.json();
    if (!jobsRes.ok) throw new Error(`Fetch jobs failed: ${JSON.stringify(jobsData)}`);
    
    console.log(`✅ Jobs fetched: ${jobsData.length}`);
    if (jobsData.length > 0 && jobsData[0]._id === bookingData._id) {
      console.log('🎉 SUCCESS: Provider sees the new booking!');
    } else {
      console.error('❌ FAILURE: Booking not found in provider jobs list.');
      console.log('Jobs received:', JSON.stringify(jobsData, null, 2));
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

run();
