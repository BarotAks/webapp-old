const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
const app = require('../../index'); // Update the path to your Express app

chai.use(chaiHttp);

const BASE_URL = 'http://localhost:3000';

describe('Health Check', () => {
  it('should return status 200 and "OK" when accessing /healthz', async () => {
    try {
      const response = await chai.request(app).get('/healthz');
      chai.expect(response).to.have.status(200);
      chai.expect(response.text).to.equal('OK');
    } catch (error) {
      assert.fail(error.message);
    }
  });
    // After all tests are finished, exit with code 0 (success)
    after(() => {
      process.exit(0);
    });
  });
  
