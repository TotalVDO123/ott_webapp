import path from 'path';

import { config } from 'dotenv';

// Load the example provided environment variables if in test mode
if (process.env.NODE_ENV === 'test') {
  config({ path: path.resolve(__dirname, '../', '.env.example') });
}
