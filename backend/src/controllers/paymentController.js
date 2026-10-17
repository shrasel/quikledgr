import {
  recordPayment as recordPaymentService,
  getPayments as getPaymentsService,
  createPaymentIntent as createPaymentIntentService,
  generateClientPortalToken as generatePortalTokenService,
} from '../services/paymentService.js';

export async function listPayments(req, res, next) {
  try {
    const orgId = req.organizationId;
    const payments = await getPaymentsService(orgId, req.query);
    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
}

export async function recordPayment(req, res, next) {
  try {
    const orgId = req.organizationId;
    const userId = req.user.id;
    const result = await recordPaymentService(orgId, userId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function createIntent(req, res, next) {
  try {
    const orgId = req.organizationId;
    const { invoiceId, amount, paymentMethodType } = req.body;
    if (!invoiceId) {
      return res.status(400).json({ error: 'Invoice ID is required' });
    }
    const intent = await createPaymentIntentService(orgId, invoiceId, { amount, paymentMethodType });
    res.json({ success: true, data: intent });
  } catch (err) {
    next(err);
  }
}

export async function generatePortalToken(req, res, next) {
  try {
    const orgId = req.organizationId;
    const { clientEmail, clientName } = req.body;
    if (!clientEmail) {
      return res.status(400).json({ error: 'Client email is required' });
    }
    const tokenData = await generatePortalTokenService(orgId, clientEmail, clientName);
    res.json({ success: true, data: tokenData });
  } catch (err) {
    next(err);
  }
}
