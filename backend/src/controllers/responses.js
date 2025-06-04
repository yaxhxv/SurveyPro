const Survey = require('../models/Survey');
const Respondent = require('../models/Respondent');
const SurveyResponse = require('../models/SurveyResponse');

// Get public survey
const getPublicSurvey = async (req, res, next) => {
  try {
    const survey = await Survey.findOne({
      _id: req.params.id,
      status: 'active'
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found or not active'
      });
    }

    res.json({
      success: true,
      data: {
        survey: {
          id: survey._id,
          title: survey.title,
          description: survey.description,
          questions: survey.questions
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Submit survey response
const submitResponse = async (req, res, next) => {
  try {
    const { respondent, answers } = req.body;

    // Find or create respondent
    let respondentDoc = await Respondent.findOne({ email: respondent.email });
    if (!respondentDoc) {
      respondentDoc = new Respondent({
        email: respondent.email,
        name: respondent.name,
        metadata: {
          ip_address: req.ip,
          user_agent: req.get('user-agent')
        }
      });
      await respondentDoc.save();
    }

    // Verify survey exists and is active
    const survey = await Survey.findOne({
      _id: req.params.id,
      status: 'active'
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found or not active'
      });
    }

    // Validate required questions
    const missingRequired = survey.questions
      .filter(q => q.required && !answers[q.id])
      .map(q => q.id);

    if (missingRequired.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required answers',
        errors: {
          answers: [`Missing answers for questions: ${missingRequired.join(', ')}`]
        }
      });
    }

    // Create response
    const response = new SurveyResponse({
      survey_id: survey._id,
      respondent_id: respondentDoc._id,
      answers,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    await response.save();

    res.status(201).json({
      success: true,
      message: 'Response submitted successfully',
      data: {
        response_id: response._id
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get survey responses (requires authentication)
const getSurveyResponses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Verify survey exists and user owns it
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

    // Get responses with pagination
    const [responses, total] = await Promise.all([
      SurveyResponse.find({ survey_id: survey._id })
        .populate('respondent_id', 'email name')
        .sort({ completed_at: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SurveyResponse.countDocuments({ survey_id: survey._id })
    ]);

    res.json({
      success: true,
      data: {
        responses: responses.map(response => ({
          id: response._id,
          respondent: {
            id: response.respondent_id._id,
            email: response.respondent_id.email,
            name: response.respondent_id.name
          },
          answers: response.answers,
          completed_at: response.completed_at
        })),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicSurvey,
  submitResponse,
  getSurveyResponses
}; 