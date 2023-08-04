import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { Root } from 'mdast';
import { abbreviationTransform, ReferenceState } from '../src';

type TestFile = {
  cases: TestCase[];
};
type TestCase = {
  title: string;
  before: Root;
  after: Root;
  opts?: Record<string, boolean>;
};

const fixtures = path.join('tests', 'abbreviations.yml');

const testYaml = fs.readFileSync(fixtures).toString();
const cases = (yaml.load(testYaml) as TestFile).cases;

describe('abbreviate', () => {
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    (_, { before, after, opts }) => {
      abbreviationTransform(before as Root, opts);
      
      expect(yaml.dump(before)).toEqual(yaml.dump(after));
    },
  );
});
