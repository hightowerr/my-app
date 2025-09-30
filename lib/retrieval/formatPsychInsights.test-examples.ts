/**
 * Test examples for stripMarkdown function.
 * Run with: npx tsx lib/retrieval/formatPsychInsights.test-examples.ts
 */

import { stripMarkdown } from './formatPsychInsights';

interface TestCase {
  description: string;
  input: string;
  expected: string;
}

const testCases: TestCase[] = [
  // Basic markdown
  {
    description: 'Bold text',
    input: '**bold**',
    expected: 'bold',
  },
  {
    description: 'Italic text',
    input: '*italic*',
    expected: 'italic',
  },
  {
    description: 'Code text',
    input: '`code`',
    expected: 'code',
  },
  {
    description: 'Link',
    input: '[text](https://example.com)',
    expected: 'text',
  },
  {
    description: 'Strikethrough',
    input: '~~strikethrough~~',
    expected: 'strikethrough',
  },

  // Nested markdown
  {
    description: 'Nested bold and italic',
    input: '***nested***',
    expected: 'nested',
  },
  {
    description: 'Bold with italic inside',
    input: '**bold with *italic* inside**',
    expected: 'bold with italic inside',
  },
  {
    description: 'Multiple nested levels',
    input: '***bold italic*** and **just bold**',
    expected: 'bold italic and just bold',
  },

  // Escaped markdown
  {
    description: 'Escaped asterisk',
    input: 'This \\* is not italic',
    expected: 'This * is not italic',
  },
  {
    description: 'Escaped underscore',
    input: 'var\\_name should not be italic',
    expected: 'var_name should not be italic',
  },
  {
    description: 'Escaped backtick',
    input: 'Use \\`backticks\\` for code',
    expected: 'Use `backticks` for code',
  },

  // Complex real-world cases
  {
    description: 'Mixed markdown',
    input: '**Scarcity**: The *countdown timer* creates urgency',
    expected: 'Scarcity: The countdown timer creates urgency',
  },
  {
    description: 'Markdown with punctuation',
    input: '**Social Proof** (e.g., "5,000 users")',
    expected: 'Social Proof (e.g., "5,000 users")',
  },
  {
    description: 'List items',
    input: '- Item 1\n- Item 2',
    expected: 'Item 1 Item 2',
  },
  {
    description: 'Headings',
    input: '## Heading\nContent',
    expected: 'Heading Content',
  },
  {
    description: 'Code block',
    input: '```javascript\nconst x = 1;\n```',
    expected: '',
  },
  {
    description: 'Blockquote',
    input: '> This is a quote',
    expected: 'This is a quote',
  },

  // Edge cases
  {
    description: 'Empty string',
    input: '',
    expected: '',
  },
  {
    description: 'Only whitespace',
    input: '   \n\t  ',
    expected: '',
  },
  {
    description: 'Unmatched markdown',
    input: '**unmatched',
    expected: 'unmatched',
  },
  {
    description: 'Multiple spaces',
    input: 'text   with    spaces',
    expected: 'text with spaces',
  },
  {
    description: 'HTML tags',
    input: 'Text with <strong>HTML</strong>',
    expected: 'Text with HTML',
  },
  {
    description: 'Malformed markdown',
    input: '**bold *italic** mixed*',
    expected: 'bold *italic mixed',
  },
];

function runTests() {
  console.log('Running stripMarkdown tests...\n');

  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    const result = stripMarkdown(testCase.input);
    const success = result === testCase.expected;

    if (success) {
      passed++;
      console.log(`✅ Test ${index + 1}: ${testCase.description}`);
    } else {
      failed++;
      console.log(`❌ Test ${index + 1}: ${testCase.description}`);
      console.log(`   Input:    "${testCase.input}"`);
      console.log(`   Expected: "${testCase.expected}"`);
      console.log(`   Got:      "${result}"`);
      console.log('');
    }
  });

  console.log(`\n${passed} passed, ${failed} failed out of ${testCases.length} tests`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { runTests, testCases };
