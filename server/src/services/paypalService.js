/**
 * Servicio de integración con la API REST v2 de PayPal Sandbox (Runtime JS)
 */

const getApiUrl = () => {
  return process.env.PAYPAL_API_URL || process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
};

const getCredentials = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
  return { clientId, clientSecret };
};

const generateAccessToken = async () => {
  const { clientId, clientSecret } = getCredentials();
  const apiUrl = getApiUrl();

  if (!clientId || clientId.startsWith('sb-sample') || !clientSecret || clientSecret.startsWith('sb-sample')) {
    return 'simulated_paypal_access_token';
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al autenticar con PayPal Sandbox: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
};

const createPayPalOrder = async (totalAmount) => {
  const accessToken = await generateAccessToken();
  const apiUrl = getApiUrl();

  if (accessToken === 'simulated_paypal_access_token') {
    return {
      id: `SIMULATED_PAYPAL_${Date.now()}`,
      status: 'CREATED',
      links: []
    };
  }

  const response = await fetch(`${apiUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: Number(totalAmount).toFixed(2)
          },
          description: 'Compra de libros electrónicos en BookFlow'
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Error creando orden en PayPal: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
};

const capturePayPalOrder = async (paypalOrderId) => {
  if (paypalOrderId.startsWith('SIMULATED_')) {
    return {
      id: paypalOrderId,
      status: 'COMPLETED',
      purchase_units: [
        {
          payments: {
            captures: [
              {
                id: `CAPTURE_${paypalOrderId}`,
                status: 'COMPLETED',
                amount: { currency_code: 'USD', value: '10.00' }
              }
            ]
          }
        }
      ]
    };
  }

  const accessToken = await generateAccessToken();
  const apiUrl = getApiUrl();

  const response = await fetch(`${apiUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Error capturando orden en PayPal: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
};

module.exports = {
  generateAccessToken,
  createPayPalOrder,
  capturePayPalOrder
};
