import {
  getUserOrganizations,
  createOrganization,
  getOrganization,
  updateOrganization,
  getOrganizationMembers,
  addOrganizationMember,
} from '../services/organizationService.js';
import { lockAccountingPeriod } from '../services/ledgerService.js';
import { getAuditLogs } from '../services/auditService.js';

export async function listOrganizations(req, res, next) {
  try {
    const orgs = await getUserOrganizations(req.user.id);
    res.json(orgs);
  } catch (err) {
    next(err);
  }
}

export async function createNewOrganization(req, res, next) {
  try {
    const { name, legalName, taxId, currency, accountingMethod } = req.body;
    const org = await createOrganization({
      userId: req.user.id,
      name,
      legalName,
      taxId,
      currency,
      accountingMethod,
    });
    res.status(201).json(org);
  } catch (err) {
    next(err);
  }
}

export async function getCurrentOrganization(req, res, next) {
  try {
    const org = await getOrganization(req.organizationId, req.user.id);
    res.json(org);
  } catch (err) {
    next(err);
  }
}

export async function updateCurrentOrganization(req, res, next) {
  try {
    const updated = await updateOrganization(req.organizationId, req.user.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function listMembers(req, res, next) {
  try {
    const members = await getOrganizationMembers(req.organizationId, req.user.id);
    res.json(members);
  } catch (err) {
    next(err);
  }
}

export async function inviteMember(req, res, next) {
  try {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    const result = await addOrganizationMember(req.organizationId, req.user.id, { email, role });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function lockPeriod(req, res, next) {
  try {
    const { lockDate } = req.body;
    if (!lockDate) {
      return res.status(400).json({ error: 'lockDate (YYYY-MM-DD) is required.' });
    }
    const result = await lockAccountingPeriod(req.organizationId, lockDate, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listAuditTrail(req, res, next) {
  try {
    const logs = await getAuditLogs(req.organizationId, {
      limit: req.query.limit || 50,
      entityType: req.query.entity_type,
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
}
