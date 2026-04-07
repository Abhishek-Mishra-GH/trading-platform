const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../controllers/watchlistController');

router.get('/', protect, getWatchlist);
router.post('/add', protect, addToWatchlist);
router.delete('/remove/:symbol', protect, removeFromWatchlist);

module.exports = router;
