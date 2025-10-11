#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

const SAMPLE_FILE = path.resolve(__dirname, 'sample-dynamodb-items.json');
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

if (!TABLE_NAME) {
  console.error('DYNAMODB_TABLE_NAME environment variable is required.');
  process.exit(1);
}

let items;
try {
  const raw = fs.readFileSync(SAMPLE_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new Error('"items" array missing or empty in sample-dynamodb-items.json');
  }
  items = parsed.items;
} catch (error) {
  console.error('Failed to load sample items:', error.message);
  process.exit(1);
}

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

const BATCH_SIZE = 25;

async function batchWrite(chunk) {
  const params = {
    RequestItems: {
      [TABLE_NAME]: chunk.map((item) => ({ PutRequest: { Item: item } }))
    }
  };

  await client.send(new BatchWriteCommand(params));
}

async function main() {
  console.log(`Loading ${items.length} items into ${TABLE_NAME} (region: ${REGION})`);

  const chunks = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    chunks.push(items.slice(i, i + BATCH_SIZE));
  }

  let written = 0;
  for (const chunk of chunks) {
    await batchWrite(chunk);
    written += chunk.length;
    console.log(`✓ Wrote ${written}/${items.length} items`);
  }

  console.log('Sample data load complete.');
}

main().catch((error) => {
  console.error('Failed to import sample data:', error);
  process.exit(1);
});
