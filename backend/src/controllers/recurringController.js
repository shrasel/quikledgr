import * as recurringService from '../services/recurringService.js';

export async function listRecurringProfiles(req, res, next) {
  try {
    const orgId = req.organizationId;
    const { status, search } = req.query;
    const profiles = await recurringService.getRecurringProfiles(orgId, { status, search });
    res.json({ profiles });
  } catch (err) {
    next(err);
  }
}

export async function getRecurringProfile(req, res, next) {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;
    const profile = await recurringService.getRecurringProfileById(orgId, id);
    if (!profile) {
      return res.status(404).json({ error: 'Recurring profile not found.' });
    }
    res.json({ profile });
  } catch (err) {
    next(err);
  }
}

export async function createRecurringProfile(req, res, next) {
  try {
    const orgId = req.organizationId;
    const userId = req.user.id;
    const profile = await recurringService.createRecurringProfile(orgId, userId, req.body);
    res.status(201).json({ profile, message: 'Recurring profile created successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function updateRecurringProfile(req, res, next) {
  try {
    const orgId = req.organizationId;
    const userId = req.user.id;
    const { id } = req.params;
    const profile = await recurringService.updateRecurringProfile(orgId, userId, id, req.body);
    res.json({ profile, message: 'Recurring profile updated successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function updateRecurringStatus(req, res, next) {
  try {
    const orgId = req.organizationId;
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;
    const profile = await recurringService.updateRecurringStatus(orgId, userId, id, status);
    res.json({ profile, message: `Recurring profile status set to ${status}.` });
  } catch (err) {
    next(err);
  }
}

export async function processDueProfiles(req, res, next) {
  try {
    const orgId = req.organizationId;
    const userId = req.user.id;
    const result = await recurringService.triggerProcessDue(orgId, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function generateProfileNow(req, res, next) {
  try {
    const orgId = req.organizationId;
    const userId = req.user.id;
    const { id } = req.params;
    const result = await recurringService.generateNow(orgId, userId, id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteRecurringProfile(req, res, next) {
  try {
    const orgId = req.organizationId;
    const userId = req.user.id;
    const { id } = req.params;
    await recurringService.deleteRecurringProfile(orgId, userId, id);
    res.json({ success: true, message: 'Recurring profile deleted successfully.' });
  } catch (err) {
    next(err);
  }
}
