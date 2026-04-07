const Watchlist = require('../models/Watchlist');

exports.getWatchlist = async (req, res) => {
  try {
    const list = await Watchlist.findOneAndUpdate(
      { userId: req.user._id },
      { $setOnInsert: { userId: req.user._id, stocks: [] } },
      { upsert: true, new: true }
    );
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addToWatchlist = async (req, res) => {
  try {
    const { symbol } = req.body;
    const list = await Watchlist.findOneAndUpdate(
      { userId: req.user._id },
      { 
        $setOnInsert: { userId: req.user._id },
        $addToSet: { stocks: { symbol } } 
      },
      { upsert: true, new: true }
    );
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.removeFromWatchlist = async (req, res) => {
  try {
    const list = await Watchlist.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { stocks: { symbol: req.params.symbol } } },
      { new: true }
    );
    res.json(list || { stocks: [] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
