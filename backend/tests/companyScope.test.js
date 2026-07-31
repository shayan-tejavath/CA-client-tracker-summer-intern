import test from 'node:test';
import assert from 'node:assert/strict';
import { getCompanyFilter, getCompanyId } from '../utils/companyScope.js';

test('getCompanyId resolves company context from req.user.companyId', () => {
  const req = {
    user: {
      companyId: 'company-123',
    },
  };

  assert.equal(getCompanyId(req), 'company-123');
  assert.deepEqual(getCompanyFilter(req), { companyId: 'company-123' });
});

test('getCompanyId falls back to req.user.company.id', () => {
  const req = {
    user: {
      company: {
        id: 'company-456',
      },
    },
  };

  assert.equal(getCompanyId(req), 'company-456');
  assert.deepEqual(getCompanyFilter(req), { companyId: 'company-456' });
});

test('getCompanyFilter returns null when no company context is available', () => {
  assert.equal(getCompanyId({ user: {} }), null);
  assert.equal(getCompanyFilter({ user: {} }), null);
});
