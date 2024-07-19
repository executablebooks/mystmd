import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { enumerateTargetsTransform, ReferenceState } from '../src';

type TestFile = {
  cases: TestCase[];
};
type TestCase = {
  title: string;
  before: Root;
  after: Root;
  opts?: Record<string, boolean>;
};

const fixtures = path.join('tests', 'enumerators.yml');

const testYaml = fs.readFileSync(fixtures).toString();
const cases = (yaml.load(testYaml) as TestFile).cases;

describe('enumerateTargets', () => {
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    (_, { before, after, opts }) => {
      const state = new ReferenceState('my-file.md', { frontmatter: opts });
      const transformed = enumerateTargetsTransform(before, { state });
      expect(yaml.dump(transformed)).toEqual(yaml.dump(after));
    },
  );
});
