/**
 * Helper para integración con la API REST v2 de PayPal Sandbox
 */
const getPayPalAccessToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const apiBase = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

  // Si son credenciales de prueba por defecto, simular respuesta
  if (!clientId || clientId.startsWith('sb-sample') || !clientSecret || clientSecret.startsWith('sb-sample')) {
    return { isSimulated: true, token: 'simulated_paypal_token' };
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error obteniendo access token de PayPal: ${errorText}`);
  }

  const data = await response.json();
  return { isSimulated: false, token: data.access_token };
};

const createPayPalOrder = async (orderId, amount, currency = 'USD') => {
  const authData = await getPayPalAccessToken();
  const apiBase = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

  if (authData.isSimulated) {
    // Retornar ID simulado de PayPal Sandbox para facilitar desarrollo sin credenciales reales
    return {
      id: `SIMULATED_PAYPAL_${Date.now()}`,
      status: 'CREATED',
      links: []
    };
  }

  const response = await fetch(`${apiBase}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderId.toString(),
          amount: {
            currency_code: currency,
            value: Number(amount).toFixed(2)
          },
          description: `Compra BookFlow - Pedido #${orderId}`
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`PayPal createOrder falló: ${JSON.stringify(error)}`);
  }

  return await response.json();
};

const capturePayPalOrder = async (paypalOrderId) => {
  const authData = await getPayPalAccessToken();
  const apiBase = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

  if (authData.isSimulated || paypalOrderId.startsWith('SIMULATED_')) {
    return {
      id: paypalOrderId,
      status: 'COMPLETED',
      payer: {
        email_address: 'sandbox-buyer@bookflow.dev',
        payer_id: 'SIMULATED_PAYER_123'
      },
      update_time: new Date().toISOString()
    };
  }

  const response = await fetch(`${apiBase}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`PayPal captureOrder falló: ${JSON.stringify(error)}`);
  }

  return await response.json();
};

module.exports = {
  createPayPalOrder,
  capturePayPalOrder
};
