const Survey = require('../models/Survey');
const SurveyResponse = require('../models/SurveyResponse');
const mongoose = require('mongoose');

// Get survey analytics
const getSurveyAnalytics = async (req, res, next) => {
  try {
    const survey = await Survey.findOne({
      _id: req.params.id,
      user_id: req.user.user_id
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Get all responses for this survey
    const responses = await SurveyResponse.find({ survey_id: survey._id });

    // Calculate completion rate and response time statistics
    const totalResponses = responses.length;
    const completedResponses = responses.filter(r => 
      Object.keys(r.answers).length === survey.questions.length
    ).length;

    // Group responses by date
    const responsesByDate = responses.reduce((acc, response) => {
      const date = response.completed_at.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Calculate device statistics from user agents
    const devices = responses.reduce((acc, response) => {
      const userAgent = response.user_agent || '';
      let device = 'unknown';
      if (userAgent.toLowerCase().includes('mobile')) device = 'mobile';
      else if (userAgent.toLowerCase().includes('tablet')) device = 'tablet';
      else device = 'desktop';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});

    // Calculate drop-off analysis
    const dropOffAnalysis = survey.questions.map(question => {
      const answeredCount = responses.filter(r => r.answers[question.id]).length;
      return {
        question_id: question.id,
        completion_rate: (answeredCount / totalResponses) * 100
      };
    });

    res.json({
      success: true,
      data: {
        survey_id: survey._id,
        overview: {
          total_responses: totalResponses,
          completion_rate: (completedResponses / totalResponses) * 100,
          average_response_time: 0 // Would need additional tracking for this
        },
        trends: {
          daily_responses: Object.entries(responsesByDate).map(([date, count]) => ({
            date,
            responses: count
          }))
        },
        demographics: {
          devices
        },
        drop_off_analysis: dropOffAnalysis
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get question analytics
const getQuestionAnalytics = async (req, res, next) => {
  try {
    const { id: surveyId, questionId } = req.params;

    const survey = await Survey.findOne({
      _id: surveyId,
      user_id: req.user.user_id
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    const question = survey.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Get all responses for this survey
    const responses = await SurveyResponse.find({ survey_id: survey._id });

    const totalResponses = responses.length;
    const answeredResponses = responses.filter(r => r.answers[questionId]);
    const skipRate = ((totalResponses - answeredResponses.length) / totalResponses) * 100;

    // Calculate response distribution for choice questions
    let responseDistribution = {};
    if (['single-choice', 'multiple-choice', 'rating', 'nps'].includes(question.type)) {
      responseDistribution = answeredResponses.reduce((acc, response) => {
        const answer = response.answers[questionId];
        if (Array.isArray(answer)) {
          // Handle multiple-choice
          answer.forEach(choice => {
            acc[choice] = (acc[choice] || 0) + 1;
          });
        } else {
          // Handle single-choice, rating, nps
          acc[answer] = (acc[answer] || 0) + 1;
        }
        return acc;
      }, {});
    }

    res.json({
      success: true,
      data: {
        question_id: questionId,
        question_text: question.question,
        question_type: question.type,
        analytics: {
          total_responses: totalResponses,
          skip_rate: skipRate,
          average_time: 0, // Would need additional tracking for this
          response_distribution: responseDistribution
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get dashboard analytics
const getDashboardAnalytics = async (req, res, next) => {
  try {
    // Get user's surveys
    const surveys = await Survey.find({ user_id: req.user.user_id });
    const surveyIds = surveys.map(s => s._id);

    // Get response counts for each survey
    const responseCounts = await SurveyResponse.aggregate([
      {
        $match: {
          survey_id: { $in: surveyIds }
        }
      },
      {
        $group: {
          _id: '$survey_id',
          total_responses: { $sum: 1 }
        }
      }
    ]);

    const responseCountMap = responseCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.total_responses;
      return acc;
    }, {});

    // Calculate overall statistics
    const totalResponses = responseCounts.reduce((sum, item) => sum + item.total_responses, 0);
    const activeSurveys = surveys.filter(s => s.status === 'active').length;

    // Get top performing surveys
    const topSurveys = surveys
      .map(survey => ({
        survey_id: survey._id,
        title: survey.title,
        total_responses: responseCountMap[survey._id.toString()] || 0
      }))
      .sort((a, b) => b.total_responses - a.total_responses)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        overview: {
          total_surveys: surveys.length,
          total_responses: totalResponses,
          active_surveys: activeSurveys
        },
        top_performing_surveys: topSurveys
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSurveyAnalytics,
  getQuestionAnalytics,
  getDashboardAnalytics
}; 