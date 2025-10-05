const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const apiCanaryBlueprint = async function () {
  const url = process.env.TARGET_URL;
  const response = await synthetics.executeHttpStep('GET /healthz/ui', url, {
    method: 'GET',
    validateResponse: (res) => res.statusCode === 200
  });
  log.info(`Status: ${response.statusCode}`);
};

exports.handler = async () => {
  await apiCanaryBlueprint();
};
