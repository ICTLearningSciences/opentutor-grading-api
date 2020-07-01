import createApp, { appStart, appStop } from '../../app';
import { expect } from 'chai';
import { Express } from 'express';
import mongoUnit from 'mongo-unit';
import request from 'supertest';

describe('setGrade', () => {
  let app: Express;

  beforeEach(async () => {
    await mongoUnit.load(require('../fixtures/mongodb/data-default.js'));
    app = await createApp();
    await appStart();
  });

  afterEach(async () => {
    await appStop();
    await mongoUnit.drop();
  });

  it(`returns an error if invalid sessionId`, async () => {
    const response = await request(app)
      .post('/grading-api')
      .send({
        query: `mutation { 
          setGrade(sessionId: "invalidsession") { 
            username
          } 
        }`,
      });

    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property('errors[0].message');
  });

  it(`returns an error if no sessionId`, async () => {
    const response = await request(app)
      .post('/grading-api')
      .send({
        query: `mutation { 
          setGrade(userAnswerIndex: 0, userExpectationIndex: 0, grade: "Bad") { 
            username
          } 
        }`,
      });

    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property('errors[0].message');
  });

  it(`returns an error if no userAnswerIndex`, async () => {
    const response = await request(app)
      .post('/grading-api')
      .send({
        query: `mutation { 
          setGrade(sessionId: "session 1", userExpectationIndex: 0, grade: "Bad") { 
            username
          } 
        }`,
      });

    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property('errors[0].message');
  });

  it(`returns an error if no userExpectationIndex`, async () => {
    const response = await request(app)
      .post('/grading-api')
      .send({
        query: `mutation { 
          setGrade(sessionId: "session 1", userAnswerIndex: 0, grade: "Bad") { 
            username
          } 
        }`,
      });

    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property('errors[0].message');
  });

  it(`returns an error if no grade`, async () => {
    const response = await request(app)
      .post('/grading-api')
      .send({
        query: `mutation { 
          setGrade(sessionId: "session 1", userAnswerIndex: 0, userExpectationIndex: 0) { 
            username
          } 
        }`,
      });

    expect(response.status).to.equal(200);
    expect(response.body).to.have.deep.nested.property('errors[0].message');
  });

  it('returns updated user session', async () => {
    const response = await request(app)
      .post('/grading-api')
      .send({
        query: `mutation { 
          setGrade(sessionId: "session 1", userAnswerIndex: 0, userExpectationIndex: 0, grade: "Bad") { 
            username
            question {
              text
              expectations {
                text
              }
            }
            userResponses {
              text
              expectationScores {
                classifierGrade
                graderGrade
              }
            }
          } 
        }`,
      });

    const userSession = response.body.data.setGrade;
    expect(response.status).to.equal(200);
    expect(userSession).to.eql({
      username: 'username1',
      question: {
        text: 'question?',
        expectations: [
          { text: 'expected text 1' },
          { text: 'expected text 2' },
        ],
      },
      userResponses: [
        {
          text: 'answer1',
          expectationScores: [
            {
              classifierGrade: 'Good',
              graderGrade: 'Bad',
            },
          ],
        },
        {
          text: 'answer2',
          expectationScores: [
            {
              classifierGrade: 'Bad',
              graderGrade: '',
            },
          ],
        },
      ],
    });
  });

  it('updates user session in database', async () => {
    await request(app)
      .post('/grading-api')
      .send({
        query: `mutation { 
          setGrade(sessionId: "session 1", userAnswerIndex: 0, userExpectationIndex: 0, grade: "Bad") { 
            username
            question {
              text
              expectations {
                text
              }
            }
            userResponses {
              text
              expectationScores {
                classifierGrade
                graderGrade
              }
            }
          } 
        }`,
      });

    const response = await request(app)
      .post('/grading-api')
      .send({
        query: `query { 
          userSession(sessionId: "session 1") { 
            username
            question {
              text
              expectations {
                text
              }
            }
            userResponses {
              text
              expectationScores {
                classifierGrade
                graderGrade
              }
            }
          } 
        }`,
      });
    const userSession = response.body.data.userSession;
    expect(response.status).to.equal(200);
    expect(userSession).to.eql({
      username: 'username1',
      question: {
        text: 'question?',
        expectations: [
          { text: 'expected text 1' },
          { text: 'expected text 2' },
        ],
      },
      userResponses: [
        {
          text: 'answer1',
          expectationScores: [
            {
              classifierGrade: 'Good',
              graderGrade: 'Bad',
            },
          ],
        },
        {
          text: 'answer2',
          expectationScores: [
            {
              classifierGrade: 'Bad',
              graderGrade: '',
            },
          ],
        },
      ],
    });
  });
});
