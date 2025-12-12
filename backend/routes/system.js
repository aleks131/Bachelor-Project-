const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

router.post('/log-error', async (req, res) => {
    try {
        const errorInfo = req.body;
        const logDir = path.join(__dirname, '../../data/logs');
        
        await fs.mkdir(logDir, { recursive: true });
        
        const logFile = path.join(logDir, `errors-${new Date().toISOString().split('T')[0]}.log`);
        const logEntry = `[${new Date().toISOString()}] ${JSON.stringify(errorInfo)}\n`;
        
        await fs.appendFile(logFile, logEntry);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error logging error:', error);
        res.status(500).json({ error: 'Failed to log error' });
    }
});

router.get('/user-activity', async (req, res) => {
    try {
        const analyticsFile = path.join(__dirname, '../../data/analytics.json');
        let analytics = {};
        
        try {
            const data = await fs.readFile(analyticsFile, 'utf8');
            analytics = JSON.parse(data);
        } catch (e) {
            analytics = { userActivity: [] };
        }
        
        const userActivity = analytics.userActivity || [];
        const userStats = {};
        
        userActivity.forEach(activity => {
            const username = activity.user || 'unknown';
            if (!userStats[username]) {
                userStats[username] = {
                    username,
                    pageViews: 0,
                    lastActive: null,
                    appsUsed: new Set(),
                    actions: []
                };
            }
            
            userStats[username].pageViews++;
            if (activity.timestamp) {
                const timestamp = new Date(activity.timestamp);
                if (!userStats[username].lastActive || timestamp > new Date(userStats[username].lastActive)) {
                    userStats[username].lastActive = activity.timestamp;
                }
            }
            
            if (activity.app) {
                userStats[username].appsUsed.add(activity.app);
            }
            
            if (activity.action) {
                userStats[username].actions.push(activity.action);
            }
        });
        
        const stats = Object.values(userStats).map(stat => ({
            username: stat.username,
            pageViews: stat.pageViews,
            lastActive: stat.lastActive,
            appsUsed: Array.from(stat.appsUsed),
            actionCount: stat.actions.length
        }));
        
        res.json({ stats });
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ error: 'Failed to fetch user activity' });
    }
});

module.exports = router;
