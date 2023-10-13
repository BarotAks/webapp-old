const axios = require('axios');
const assert = require('assert');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

describe('Health Check', () => {
  it('should return status 200 and "OK" when accessing /healthz', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/healthz`);
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data, 'OK');
    } catch (error) {
      assert.fail(error.message);
    }
  });
});
