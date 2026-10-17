import * as arAgingService from '../services/arAgingService.js';

export async function getAgingSummary(req, res, next) {
  try {
    const orgId = req.organizationId;
    const summary = await arAgingService.getAgingSummary(orgId);
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

export async function getDunningRules(req, res, next) {
  try {
    const orgId = req.organizationId;
    const rules = await arAgingService.getDunningRules(orgId);
    res.json({ rules });
  } catch (err) {
    next(err);
  }
}

export async function saveDunningRule(req, res, next) {
  try {
    const orgId = req.organizationId;
    const userId = req.user.id;
    const rules = await arAgingService.saveDunningRule(orgId, userId, req.body);
    res.json({ rules, message: 'Dunning policy saved successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function deleteDunningRule(req, res, next) {
  try {
    const orgId = req.organizationId;
    const userId = req.user.id;
    const { id } = req.params;
    await arAgingService.deleteDunningRule(orgId, userId, id);
    res.json({ success: true, message: 'Dunning rule deleted.' });
  } catch (err) {
    next(err);
  }
}

export async function applyLateFee(req, res, next) {
  try {
    const orgId = req.organizationId;
    const userId = req.user.id;
    const { id } = req.params;
    const result = await arAgingService.applyLateFee(orgId, userId, id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function sendDunningReminder(req, res, next) {
  try {
    const orgId = req.organizationId;
    const userId = req.user.id;
    const { id } = req.params;
    const result = await arAgingService.sendDunningReminder(orgId, userId, id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
