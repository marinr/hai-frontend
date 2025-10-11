const https = require('https');
const fs = require('fs');

// Read test data
const testData = JSON.parse(fs.readFileSync('./test-data.json', 'utf8'));

// API Gateway URL - update this after deployment
const API_URL = process.env.API_URL || 'https://2ntyt8anuj.execute-api.eu-central-1.amazonaws.com';

const createdIds = {
  properties: {},
  staff: {},
  guests: {},
  reservations: {}
};

function makeRequest(method, path, body = null) {
  const url = new URL(path, API_URL);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data || '{}'));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function seedProperties() {
  console.log('\n=== Seeding Properties ===');
  for (const property of testData.properties) {
    try {
      const result = await makeRequest('POST', '/properties', property);
      createdIds.properties[property.room_number] = result.id;
      console.log(`✓ Created property ${property.room_number}: ${result.id}`);
    } catch (error) {
      console.error(`✗ Failed to create property ${property.room_number}:`, error.message);
    }
  }
}

async function seedStaff() {
  console.log('\n=== Seeding Staff ===');
  for (const staff of testData.staff) {
    try {
      const result = await makeRequest('POST', '/staff', staff);
      const key = `${staff.name.toLowerCase()}_${staff.surname.toLowerCase()}`;
      createdIds.staff[key] = result.id;
      console.log(`✓ Created staff ${staff.name} ${staff.surname}: ${result.id}`);
    } catch (error) {
      console.error(`✗ Failed to create staff ${staff.name} ${staff.surname}:`, error.message);
    }
  }
}

async function seedGuests() {
  console.log('\n=== Seeding Guests ===');
  for (const guest of testData.guests) {
    try {
      const result = await makeRequest('POST', '/guests', guest);
      const key = `${guest.name.toLowerCase()}_${guest.surname.toLowerCase()}`;
      createdIds.guests[key] = result.id;
      console.log(`✓ Created guest ${guest.name} ${guest.surname}: ${result.id}`);
    } catch (error) {
      console.error(`✗ Failed to create guest ${guest.name} ${guest.surname}:`, error.message);
    }
  }
}

async function seedReservations() {
  console.log('\n=== Seeding Reservations ===');
  
  const reservationMapping = [
    { room: '101', guest: 'sarah_johnson', index: 0 },
    { room: '102', guest: 'michael_brown', index: 1 },
    { room: '201', guest: 'emma_wilson', index: 2 },
    { room: '202', guest: 'hans_mueller', index: 3 }
  ];

  for (const mapping of reservationMapping) {
    const reservation = { ...testData.reservations[mapping.index] };
    reservation.room_id = createdIds.properties[mapping.room];
    reservation.guest_id = createdIds.guests[mapping.guest];

    if (!reservation.room_id || !reservation.guest_id) {
      console.error(`✗ Missing IDs for reservation ${mapping.index + 1}`);
      continue;
    }

    try {
      const result = await makeRequest('POST', '/reservations', reservation);
      createdIds.reservations[mapping.index + 1] = result.id;
      console.log(`✓ Created reservation ${mapping.index + 1}: ${result.id}`);
    } catch (error) {
      console.error(`✗ Failed to create reservation ${mapping.index + 1}:`, error.message);
    }
  }
}

async function seedMessages() {
  console.log('\n=== Seeding Messages ===');
  
  const messageMapping = [
    { guest: 'sarah_johnson', reservation: 1 },
    { guest: 'sarah_johnson', reservation: 1 },
    { guest: 'michael_brown', reservation: 2 },
    { guest: 'emma_wilson', reservation: 3 },
    { guest: 'hans_mueller', reservation: 4 }
  ];

  for (let i = 0; i < testData.messages.length; i++) {
    const message = { ...testData.messages[i] };
    const mapping = messageMapping[i];
    
    message.guest_id = createdIds.guests[mapping.guest];
    message.reservation_id = createdIds.reservations[mapping.reservation];

    if (!message.guest_id || !message.reservation_id) {
      console.error(`✗ Missing IDs for message ${i + 1}`);
      continue;
    }

    try {
      const result = await makeRequest('POST', '/messages', message);
      console.log(`✓ Created message ${i + 1}: ${result.id}`);
    } catch (error) {
      console.error(`✗ Failed to create message ${i + 1}:`, error.message);
    }
  }
}

async function seedTasks() {
  console.log('\n=== Seeding Tasks ===');
  
  const taskMapping = [
    { staff: 'maria_garcia', reservation: 1 },
    { staff: 'john_smith', reservation: 1 },
    { staff: 'anna_kowalski', reservation: 2 },
    { staff: 'john_smith', reservation: 3 },
    { staff: 'maria_garcia', reservation: 3 },
    { staff: 'david_chen', reservation: 4 },
    { staff: 'anna_kowalski', reservation: 4 }
  ];

  for (let i = 0; i < testData.tasks.length; i++) {
    const task = { ...testData.tasks[i] };
    const mapping = taskMapping[i];
    
    task.staff_id = createdIds.staff[mapping.staff];
    task.reservation_info_id = createdIds.reservations[mapping.reservation];

    if (!task.staff_id || !task.reservation_info_id) {
      console.error(`✗ Missing IDs for task ${i + 1}`);
      continue;
    }

    try {
      const result = await makeRequest('POST', '/tasks', task);
      console.log(`✓ Created task ${i + 1}: ${result.id}`);
    } catch (error) {
      console.error(`✗ Failed to create task ${i + 1}:`, error.message);
    }
  }
}

async function main() {
  if (!process.env.API_URL && API_URL === 'YOUR_API_GATEWAY_URL_HERE') {
    console.error('ERROR: Please set API_URL environment variable or update the script');
    console.error('Usage: API_URL=https://your-api.execute-api.region.amazonaws.com node seed-data.js');
    process.exit(1);
  }

  console.log(`Seeding data to: ${API_URL}`);
  
  try {
    await seedProperties();
    await seedStaff();
    await seedGuests();
    await seedReservations();
    await seedMessages();
    await seedTasks();
    
    console.log('\n=== Seeding Complete ===');
    console.log('\nCreated IDs:');
    console.log('Properties:', createdIds.properties);
    console.log('Staff:', createdIds.staff);
    console.log('Guests:', createdIds.guests);
    console.log('Reservations:', createdIds.reservations);
    
  } catch (error) {
    console.error('\n=== Seeding Failed ===');
    console.error(error);
    process.exit(1);
  }
}

main();
