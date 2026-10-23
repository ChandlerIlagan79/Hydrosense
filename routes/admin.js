const express = require('express');
const router = express.Router();
const User = require('../models/user');
const HydrationTest = require('../models/HydrationTest');
const { Parser } = require('json2csv');

// ============================================================================
// ADMIN USERS ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/users
 * Fetch all users with their hydration test data
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).lean();
    
    // Enrich users with their hydration test data
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const tests = await HydrationTest.find({ userId: user._id }).lean();
        return {
          ...user,
          hydrationResults: tests,
          totalTests: tests.length,
          avgTestDuration: tests.length > 0 
            ? (tests.reduce((sum, t) => sum + (t.testDuration || 0), 0) / tests.length).toFixed(2)
            : 0
        };
      })
    );

    res.json({ success: true, users: enrichedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

/**
 * GET /api/admin/stats
 * Get comprehensive admin statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTests = await HydrationTest.countDocuments();
    
    // Get tests from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsers = await User.countDocuments({ 
      createdAt: { $gte: sevenDaysAgo } 
    });
    const recentTests = await HydrationTest.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Calculate average test duration
    const testStats = await HydrationTest.aggregate([
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$testDuration' },
          minDuration: { $min: '$testDuration' },
          maxDuration: { $max: '$testDuration' }
        }
      }
    ]);

    // Hydration level distribution
    const hydrationDistribution = await HydrationTest.aggregate([
      {
        $group: {
          _id: '$hydrationLevel',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // First test vs repeat tests
    const firstTests = await HydrationTest.countDocuments({ isFirstTest: true });
    const repeatTests = totalTests - firstTests;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalTests,
        newUsers,
        recentTests,
        firstTests,
        repeatTests,
        avgDuration: testStats[0] ? parseFloat(testStats[0].avgDuration).toFixed(2) : 0,
        minDuration: testStats[0]?.minDuration || 0,
        maxDuration: testStats[0]?.maxDuration || 0,
        hydrationDistribution,
        userGrowth: {
          total: totalUsers,
          lastWeek: newUsers
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

/**
 * POST /api/admin/reset-password
 * Reset user password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { userId, newPassword, sendEmail } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Password reset successfully',
      tempPassword: newPassword,
      emailSent: sendEmail
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

/**
 * POST /api/admin/send-email
 * Send email to a specific user
 */
router.post('/send-email', async (req, res) => {
  try {
    const { userId, subject, message } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // TODO: Implement actual email sending using emailService
    res.json({ 
      success: true, 
      message: `Email sent to ${user.email}`
    });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
});

/**
 * POST /api/admin/send-bulk-email
 * Send email to multiple users
 */
router.post('/send-bulk-email', async (req, res) => {
  try {
    const { userIds, subject, message } = req.body;

    const users = await User.find({ _id: { $in: userIds } });
    
    // TODO: Implement actual bulk email sending using emailService
    const results = {
      success: users.map(u => ({ userId: u._id, email: u.email })),
      failed: []
    };

    res.json({ 
      success: true,
      message: `Email sent to ${users.length} users`,
      results
    });
  } catch (error) {
    console.error('Bulk email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send bulk email' });
  }
});

/**
 * GET /api/admin/export/csv
 * Export users data as CSV
 */
router.get('/export/csv', async (req, res) => {
  try {
    const users = await User.find({}).lean();
    
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const tests = await HydrationTest.find({ userId: user._id }).lean();
        return {
          fullName: user.fullName,
          email: user.email,
          totalTests: tests.length,
          avgDuration: tests.length > 0 
            ? (tests.reduce((sum, t) => sum + (t.testDuration || 0), 0) / tests.length).toFixed(2)
            : 0,
          joinedDate: new Date(user.createdAt).toISOString().split('T')[0]
        };
      })
    );

    const fields = ['fullName', 'email', 'totalTests', 'avgDuration', 'joinedDate'];
    const parser = new Parser({ fields });
    const csv = parser.parse(enrichedUsers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=acqua_users.csv');
    res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
});

/**
 * GET /api/admin/export/json
 * Export users data as JSON
 */
router.get('/export/json', async (req, res) => {
  try {
    const users = await User.find({}).lean();
    
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const tests = await HydrationTest.find({ userId: user._id }).lean();
        return {
          ...user,
          hydrationResults: tests,
          exportDate: new Date().toISOString()
        };
      })
    );

    res.json({ success: true, users: enrichedUsers });
  } catch (error) {
    console.error('JSON export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export JSON' });
  }
});

/**
 * GET /api/admin/feedback
 * Fetch all feedback
 */
router.get('/feedback', async (req, res) => {
  try {
    // TODO: Implement feedback fetching when feedback model is available
    res.json({ success: true, feedback: [] });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch feedback' });
  }
});

/**
 * GET /api/admin/feedback/stats
 * Get feedback statistics
 */
router.get('/feedback/stats', async (req, res) => {
  try {
    // TODO: Implement feedback stats when feedback model is available
    res.json({ 
      success: true, 
      stats: {
        totalFeedback: 0,
        averageRating: 0,
        feedbackWithComments: 0,
        ratingDistribution: []
      }
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/admin/export/feedback-csv
 * Export feedback as CSV
 */
router.get('/export/feedback-csv', async (req, res) => {
  try {
    // TODO: Implement feedback export when feedback model is available
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=acqua_feedback.csv');
    res.send('No feedback data available');
  } catch (error) {
    console.error('Feedback CSV export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export feedback' });
  }
});

/**
 * GET /api/admin/export/feedback-json
 * Export feedback as JSON
 */
router.get('/export/feedback-json', async (req, res) => {
  try {
    // TODO: Implement feedback export when feedback model is available
    res.json({ success: true, feedback: [] });
  } catch (error) {
    console.error('Feedback JSON export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export feedback' });
  }
});

module.exports = router;
