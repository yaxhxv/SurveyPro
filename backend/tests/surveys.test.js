const request = require('supertest');
const app = require('../src/server');
const Survey = require('../src/models/Survey');

describe('Survey Endpoints', () => {
  let token;
  let userId;

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
  });

  describe('POST /api/surveys', () => {
    it('should create a new survey', async () => {
      const surveyData = {
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
        ]
      };

      const res = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${token}`)
        .send(surveyData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.survey.title).toBe(surveyData.title);
      expect(res.body.data.survey.questions).toHaveLength(1);
    });

    it('should not create survey without authentication', async () => {
      const res = await request(app)
        .post('/api/surveys')
        .send({
          title: 'Test Survey',
          description: 'Test Description',
          questions: []
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/surveys', () => {
    beforeEach(async () => {
      // Create some test surveys
      await Survey.create([
        {
          user_id: userId,
          title: 'Survey 1',
          description: 'Description 1',
          questions: [],
          status: 'draft'
        },
        {
          user_id: userId,
          title: 'Survey 2',
          description: 'Description 2',
          questions: [],
          status: 'active'
        }
      ]);
    });

    it('should get all surveys for user', async () => {
      const res = await request(app)
        .get('/api/surveys')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.surveys).toHaveLength(2);
    });

    it('should filter surveys by status', async () => {
      const res = await request(app)
        .get('/api/surveys?status=active')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.surveys).toHaveLength(1);
      expect(res.body.data.surveys[0].status).toBe('active');
    });
  });

  describe('PUT /api/surveys/:id', () => {
    let surveyId;

    beforeEach(async () => {
      const survey = await Survey.create({
        user_id: userId,
        title: 'Original Title',
        description: 'Original Description',
        questions: [],
        status: 'draft'
      });
      surveyId = survey._id;
    });

    it('should update survey', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        questions: [
          {
            id: 'q1',
            type: 'text',
            question: 'New Question?',
            required: true
          }
        ]
      };

      const res = await request(app)
        .put(`/api/surveys/${surveyId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.survey.title).toBe(updateData.title);
      expect(res.body.data.survey.questions).toHaveLength(1);
    });

    it('should not update published survey', async () => {
      // First publish the survey
      await Survey.findByIdAndUpdate(surveyId, { status: 'active' });

      const res = await request(app)
        .put(`/api/surveys/${surveyId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Title',
          description: 'Updated Description',
          questions: []
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Cannot update a published survey');
    });
  });

  describe('DELETE /api/surveys/:id', () => {
    let surveyId;

    beforeEach(async () => {
      const survey = await Survey.create({
        user_id: userId,
        title: 'Test Survey',
        description: 'Test Description',
        questions: [],
        status: 'draft'
      });
      surveyId = survey._id;
    });

    it('should delete survey', async () => {
      const res = await request(app)
        .delete(`/api/surveys/${surveyId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify survey is deleted
      const survey = await Survey.findById(surveyId);
      expect(survey).toBeNull();
    });

    it('should not delete non-existent survey', async () => {
      const res = await request(app)
        .delete('/api/surveys/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/surveys/:id/publish', () => {
    let surveyId;

    beforeEach(async () => {
      const survey = await Survey.create({
        user_id: userId,
        title: 'Test Survey',
        description: 'Test Description',
        questions: [],
        status: 'draft'
      });
      surveyId = survey._id;
    });

    it('should publish survey', async () => {
      const res = await request(app)
        .post(`/api/surveys/${surveyId}/publish`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.survey.status).toBe('active');
      expect(res.body.data.survey.published_at).toBeDefined();
    });

    it('should not publish already published survey', async () => {
      // First publish the survey
      await Survey.findByIdAndUpdate(surveyId, { status: 'active' });

      const res = await request(app)
        .post(`/api/surveys/${surveyId}/publish`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Survey is already published');
    });
  });
}); 