const request = require('supertest');
const app = require('../src/server');
const Survey = require('../src/models/Survey');
const SurveyResponse = require('../src/models/SurveyResponse');
const Respondent = require('../src/models/Respondent');

describe('Response Endpoints', () => {
  let token;
  let userId;
  let surveyId;

  beforeEach(async () => {
    // Register and login user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    
    token = registerRes.body.data.token;
    userId = registerRes.body.data.user.id;

    // Create a test survey
    const survey = await Survey.create({
      user_id: userId,
      title: 'Test Survey',
      description: 'Test Description',
      questions: [
        {
          id: 'q1',
          type: 'single-choice',
          question: 'Test Question?',
          options: ['Option 1', 'Option 2'],
          required: true
        }
      ],
      status: 'active'
    });
    surveyId = survey._id;
  });

  describe('POST /api/responses/:id', () => {
    it('should submit a response', async () => {
      const responseData = {
        respondent: {
          email: 'respondent@example.com',
          name: 'Test Respondent'
        },
        answers: {
          q1: 'Option 1'
        }
      };

      const res = await request(app)
        .post(`/api/responses/${surveyId}`)
        .send(responseData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.response_id).toBeDefined();

      // Verify response was saved
      const response = await SurveyResponse.findById(res.body.data.response_id);
      expect(response).toBeDefined();
      expect(response.answers.q1).toBe('Option 1');

      // Verify respondent was created
      const respondent = await Respondent.findOne({ email: 'respondent@example.com' });
      expect(respondent).toBeDefined();
      expect(respondent.name).toBe('Test Respondent');
    });

    it('should not submit response to non-existent survey', async () => {
      const res = await request(app)
        .post('/api/responses/507f1f77bcf86cd799439011')
        .send({
          respondent: {
            email: 'respondent@example.com',
            name: 'Test Respondent'
          },
          answers: {
            q1: 'Option 1'
          }
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should not submit response to inactive survey', async () => {
      // Make survey inactive
      await Survey.findByIdAndUpdate(surveyId, { status: 'draft' });

      const res = await request(app)
        .post(`/api/responses/${surveyId}`)
        .send({
          respondent: {
            email: 'respondent@example.com',
            name: 'Test Respondent'
          },
          answers: {
            q1: 'Option 1'
          }
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should not submit response without required answers', async () => {
      const res = await request(app)
        .post(`/api/responses/${surveyId}`)
        .send({
          respondent: {
            email: 'respondent@example.com',
            name: 'Test Respondent'
          },
          answers: {}
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Missing required answers');
    });
  });

  describe('GET /api/responses/:id/responses', () => {
    beforeEach(async () => {
      // Create some test responses
      const respondent = await Respondent.create({
        email: 'respondent@example.com',
        name: 'Test Respondent'
      });

      await SurveyResponse.create([
        {
          survey_id: surveyId,
          respondent_id: respondent._id,
          answers: { q1: 'Option 1' },
          ip_address: '127.0.0.1',
          user_agent: 'test-agent'
        },
        {
          survey_id: surveyId,
          respondent_id: respondent._id,
          answers: { q1: 'Option 2' },
          ip_address: '127.0.0.1',
          user_agent: 'test-agent'
        }
      ]);
    });

    it('should get survey responses', async () => {
      const res = await request(app)
        .get(`/api/responses/${surveyId}/responses`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.responses).toHaveLength(2);
      expect(res.body.data.pagination.total_items).toBe(2);
    });

    it('should not get responses without authentication', async () => {
      const res = await request(app)
        .get(`/api/responses/${surveyId}/responses`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should not get responses for non-existent survey', async () => {
      const res = await request(app)
        .get('/api/responses/507f1f77bcf86cd799439011/responses')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should paginate responses', async () => {
      const res = await request(app)
        .get(`/api/responses/${surveyId}/responses?page=1&limit=1`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.responses).toHaveLength(1);
      expect(res.body.data.pagination.total_pages).toBe(2);
    });
  });
}); 