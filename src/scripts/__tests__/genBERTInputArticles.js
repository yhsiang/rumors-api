import MockDate from 'mockdate';
import client from 'util/client';
import { loadFixtures, unloadFixtures } from 'util/fixtures';
import { convertAppUserIdToUserId } from 'util/user';
import { range2Objects, writeFeedbacks } from '../genBERTInputArticles';
import fixtures from '../__fixtures__/genBERTInputArticles';

const FIXED_DATE = 612921600000;

const reviewerUserId = convertAppUserIdToUserId({
  appUserId: 'category-reviewer',
  appId: 'RUMORS_AI',
});

describe('range2Objects', () => {
  it('converts range data to array of objects', () => {
    const array = range2Objects([['c1', 'c2'], ['v1', 'v2'], ['v3']]);

    expect(array).toMatchInlineSnapshot(`
      Array [
        Object {
          "c1": "v1",
          "c2": "v2",
        },
        Object {
          "c1": "v3",
        },
      ]
    `);
  });
  it('handles empty range with header', () => {
    const emptyArray = range2Objects([['c1', 'c2']]);
    expect(emptyArray).toMatchInlineSnapshot(`Array []`);
  });
});

describe('writeFeedbacks', () => {
  beforeEach(() => loadFixtures(fixtures));
  afterEach(() => unloadFixtures(fixtures));
  it('writes feedbacks accordingly', async () => {
    // Test input:
    // c1 positive feedback
    // c2 no feedback (left untouched)
    // c3 negative feedback
    //
    const articleCategories = [
      { 'Category ID': 'c1', 'Article ID': 'a1', 'Adopt?': true },
      { 'Category ID': 'c2', 'Article ID': 'a1', 'Adopt?': false },
      {
        'Category ID': 'c3',
        'Article ID': 'a1',
        'Adopt?': false,
        'Deny reason': 'The reason to deny',
      },
    ];

    MockDate.set(FIXED_DATE);
    await writeFeedbacks(articleCategories);
    MockDate.reset();

    const {
      body: { _source: articleDoc },
    } = await client.get({
      index: 'articles',
      type: 'doc',
      id: 'a1',
    });

    // Check if c1 & c3 has 1 positive feedback each
    //
    expect(articleDoc.articleCategories).toMatchInlineSnapshot(`
      Array [
        Object {
          "appId": "WEBSITE",
          "categoryId": "c1",
          "createdAt": "2021-01-01T00:00:00.000Z",
          "negativeFeedbackCount": 0,
          "positiveFeedbackCount": 1,
          "status": "NORMAL",
          "userId": "one-user",
        },
        Object {
          "appId": "WEBSITE",
          "categoryId": "c2",
          "createdAt": "2021-01-01T00:00:00.000Z",
          "negativeFeedbackCount": 0,
          "positiveFeedbackCount": 0,
          "status": "NORMAL",
          "userId": "an-user",
        },
        Object {
          "appId": "WEBSITE",
          "categoryId": "c3",
          "createdAt": "2021-01-01T00:00:00.000Z",
          "negativeFeedbackCount": 1,
          "positiveFeedbackCount": 0,
          "status": "NORMAL",
          "userId": "some-user",
        },
      ]
    `);

    // Check if article category feedbacks are generated correctly
    //
    const {
      body: {
        hits: { total, hits: articleCategoryFeedbacks },
      },
    } = await client.search({
      index: 'articlecategoryfeedbacks',
      body: {
        query: {
          term: {
            appId: 'RUMORS_AI',
          },
        },
      },
    });

    // Only 1 positive & 1 negative feedbacks inserted
    //
    expect(total).toBe(2);

    const { _source: positiveFeedback } = articleCategoryFeedbacks.find(
      ({ _source }) => _source.score === 1
    );
    expect(positiveFeedback.userId).toBe(reviewerUserId);
    expect(positiveFeedback).toMatchInlineSnapshot(`
      Object {
        "appId": "RUMORS_AI",
        "articleId": "a1",
        "categoryId": "c1",
        "createdAt": "1989-06-04T00:00:00.000Z",
        "score": 1,
        "status": "NORMAL",
        "updatedAt": "1989-06-04T00:00:00.000Z",
        "userId": "itezv_k4nL0AzYmLjGPIlwW2PDmpsp9LkDqRaQlIUjHlKNJfo",
      }
    `);

    const { _source: negativeFeedback } = articleCategoryFeedbacks.find(
      ({ _source }) => _source.score === -1
    );
    expect(negativeFeedback.userId).toBe(reviewerUserId);
    expect(negativeFeedback).toMatchInlineSnapshot(`
      Object {
        "appId": "RUMORS_AI",
        "articleId": "a1",
        "categoryId": "c3",
        "comment": "The reason to deny",
        "createdAt": "1989-06-04T00:00:00.000Z",
        "score": -1,
        "status": "NORMAL",
        "updatedAt": "1989-06-04T00:00:00.000Z",
        "userId": "itezv_k4nL0AzYmLjGPIlwW2PDmpsp9LkDqRaQlIUjHlKNJfo",
      }
    `);

    // Cleanup
    //
    await client.deleteByQuery({
      index: 'articlecategoryfeedbacks',
      body: {
        query: {
          term: {
            appId: 'RUMORS_AI',
          },
        },
      },
    });
    await client.delete({ index: 'users', type: 'doc', id: reviewerUserId });
  });
});
