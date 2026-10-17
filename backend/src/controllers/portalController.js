import {
  getClientPortalData as getClientPortalDataService,
  processPortalPayment as processPortalPaymentService,
  createPaymentIntent as createPaymentIntentService,
} from '../services/paymentService.js';

export async function getPortalData(req, res, next) {
  try {
    const token = req.query.token || req.params.token;
    if (!token) {
      return res.status(400).json({ error: 'Client portal token is missing' });
    }
    const data = await getClientPortalDataService(token);
    res.json({ success: true, data });
  } catch (err) {
    if (err.message.includes('expired') || err.message.includes('invalid')) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}

export async function payPortalInvoice(req, res, next) {
  try {
    const token = req.body.token || req.headers['x-portal-token'] || req.query.token;
    if (!token) {
      return res.status(400).json({ error: 'Client portal token is missing' });
    }
    const result = await processPortalPaymentService(token, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function calculatePortalIntent(req, res, next) {
  try {
    const token = req.body.token || req.query.token;
    if (!token) {
      return res.status(400).json({ error: 'Client portal token is missing' });
    }
    const portalData = await getClientPortalDataService(token);
    const orgId = portalData.organization.id;
    const { invoiceId, amount, paymentMethodType } = req.body;

    const intent = await createPaymentIntentService(orgId, invoiceId, { amount, paymentMethodType });
    res.json({ success: true, data: intent });
  } catch (err) {
    next(err);
  }
}
