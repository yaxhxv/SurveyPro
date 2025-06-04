const Survey = require('../models/Survey');

// Get all surveys for the authenticated user
const getAllSurveys = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const query = { user_id: req.user.user_id };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    // Get surveys with pagination
    const [surveys, total] = await Promise.all([
      Survey.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Survey.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        surveys: surveys.map(survey => ({
          id: survey._id,
          title: survey.title,
          description: survey.description,
          status: survey.status,
          questions_count: survey.questions.length,
          created_at: survey.created_at,
          updated_at: survey.updated_at,
          published_at: survey.published_at
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

// Create a new survey
const createSurvey = async (req, res, next) => {
  try {
    const { title, description, questions } = req.body;

    const survey = new Survey({
      user_id: req.user.user_id,
      title,
      description,
      questions: questions.map(q => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options || [],
        required: q.required || false
      }))
    });

    await survey.save();

    res.status(201).json({
      success: true,
      message: 'Survey created successfully',
      data: {
        survey: {
          id: survey._id,
          title: survey.title,
          description: survey.description,
          status: survey.status,
          questions: survey.questions,
          created_at: survey.created_at,
          updated_at: survey.updated_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific survey
const getSurvey = async (req, res, next) => {
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

    res.json({
      success: true,
      data: {
        survey: {
          id: survey._id,
          title: survey.title,
          description: survey.description,
          status: survey.status,
          questions: survey.questions,
          created_at: survey.created_at,
          updated_at: survey.updated_at,
          published_at: survey.published_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update a survey
const updateSurvey = async (req, res, next) => {
  try {
    const { title, description, questions } = req.body;

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

    if (survey.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a published survey'
      });
    }

    survey.title = title;
    survey.description = description;
    survey.questions = questions.map(q => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options || [],
      required: q.required || false
    }));

    await survey.save();

    res.json({
      success: true,
      message: 'Survey updated successfully',
      data: {
        survey: {
          id: survey._id,
          title: survey.title,
          description: survey.description,
          status: survey.status,
          questions: survey.questions,
          created_at: survey.created_at,
          updated_at: survey.updated_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete a survey
const deleteSurvey = async (req, res, next) => {
  try {
    const survey = await Survey.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user.user_id
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    res.json({
      success: true,
      message: 'Survey deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Publish a survey
const publishSurvey = async (req, res, next) => {
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

    if (survey.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Survey is already published'
      });
    }

    survey.status = 'active';
    survey.published_at = new Date();
    await survey.save();

    res.json({
      success: true,
      message: 'Survey published successfully',
      data: {
        survey: {
          id: survey._id,
          status: survey.status,
          published_at: survey.published_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSurveys,
  createSurvey,
  getSurvey,
  updateSurvey,
  deleteSurvey,
  publishSurvey
}; 