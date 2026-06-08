import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Client from './models/Client.js';

dotenv.config();

const run = async () => {
  await connectDB();

  const existing = await Client.findOne({ email: 'client@test.com' });
  if (existing) {
    console.log('Client already exists:', existing.email);
    process.exit(0);
  }

  const timestamp = String(Date.now()).slice(-4);
  const pan = `ABCDE${timestamp}F`;
  const gstin = `22ABCDE${timestamp}F2Z${timestamp[0]}`;

  const client = await Client.create({
    clientName: 'Client Test Corp',
    email: 'client@test.com',
    mobile: '9999999999',
    pan,
    gstin,
    clientType: 'Business',
    status: 'Active',
    assignedServices: ['GST Filing'],
    assignedManager: 'Manager',
    notes: 'Auto-created test client for client@test.com',
  });

  console.log('Created client for test:', client._id.toString());
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
