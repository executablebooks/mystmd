import { describe, expect, it } from 'vitest';
import moment from 'moment';
import { formatDate } from './utils';

describe('formatDate', () => {
  it('returns an ISO date string', () => {
    expect(formatDate(moment.utc('2020-06-01 10:10:30').toDate())).toEqual(
      expect.stringMatching('2020-06-01'),
    );
  });
});
