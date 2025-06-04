const Respondent = require('../models/Respondent');
const SurveyResponse = require('../models/SurveyResponse');

// Get all respondents
const getAllRespondents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = {};

    // Add search filter if provided
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    // Get respondents with pagination
    const [respondents, total] = await Promise.all([
      Respondent.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Respondent.countDocuments(query)
    ]);

    // Get response counts for each respondent
    const respondentData = await Promise.all(
      respondents.map(async (respondent) => {
        const responseCount = await SurveyResponse.countDocuments({
          respondent_id: respondent._id
        });

        return {
          id: respondent._id,
          email: respondent.email,
          name: respondent.name,
          metadata: respondent.metadata,
          responses_count: responseCount,
          created_at: respondent.created_at,
          updated_at: respondent.updated_at
        };
      })
    );

    res.json({
      success: true,
      data: {
        respondents: respondentData,
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

// Get a specific respondent
const getRespondent = async (req, res, next) => {
  try {
    const respondent = await Respondent.findById(req.params.id);

    if (!respondent) {
      return res.status(404).json({
        success: false,
        message: 'Respondent not found'
      });
    }

    // Get all responses from this respondent
    const responses = await SurveyResponse.find({
      respondent_id: respondent._id
    })
    .populate('survey_id', 'title')
    .sort({ completed_at: -1 });

    res.json({
      success: true,
      data: {
        respondent: {
          id: respondent._id,
          email: respondent.email,
          name: respondent.name,
          metadata: respondent.metadata,
          created_at: respondent.created_at,
          updated_at: respondent.updated_at,
          responses: responses.map(response => ({
            id: response._id,
            survey_title: response.survey_id.title,
            completed_at: response.completed_at
          }))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRespondents,
  getRespondent
}; 