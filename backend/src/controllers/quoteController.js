import * as quoteService from '../services/quoteService.js';

export async function listQuotes(req, res, next) {
  try {
    const orgId = req.organizationId;
    const { status, search } = req.query;
    const quotes = await quoteService.getQuotes(orgId, { status, search });
    res.json({ quotes });
  } catch (err) {
    next(err);
  }
}

export async function getQuote(req, res, next) {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;
    const quote = await quoteService.getQuoteById(orgId, id);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found.' });
    }
    res.json({ quote });
  } catch (err) {
    next(err);
  }
}

export async function createQuote(req, res, next) {
  try {
    const orgId = req.organizationId;
    const userId = req.user.id;
    const quote = await quoteService.createQuote(orgId, userId, req.body);
    res.status(201).json({ quote, message: 'Quote created successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function updateQuoteStatus(req, res, next) {
  try {
    const orgId = req.organizationId;
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;
    const quote = await quoteService.updateQuoteStatus(orgId, userId, id, status);
    res.json({ quote, message: `Quote status updated to ${status}.` });
  } catch (err) {
    next(err);
  }
}

export async function convertQuoteToInvoice(req, res, next) {
  try {
    const orgId = req.organizationId;
    const userId = req.user.id;
    const { id } = req.params;
    const result = await quoteService.convertQuoteToInvoice(orgId, userId, id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function signQuote(req, res, next) {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;
    const { signatureDataUrl, signedByName } = req.body;
    if (!signatureDataUrl || !signedByName) {
      return res.status(400).json({ error: 'Signature data and signer name are required.' });
    }
    const quote = await quoteService.signQuote(orgId, id, signatureDataUrl, signedByName);
    res.json({ quote, message: 'Quote signed and approved successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function deleteQuote(req, res, next) {
  try {
    const orgId = req.organizationId;
    const userId = req.user.id;
    const { id } = req.params;
    await quoteService.deleteQuote(orgId, userId, id);
    res.json({ success: true, message: 'Quote deleted successfully.' });
  } catch (err) {
    next(err);
  }
}
