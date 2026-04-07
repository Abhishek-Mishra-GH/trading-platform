const aiService = require('../services/aiService');

const histories = new Map();

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id.toString();

    if (!histories.has(userId)) histories.set(userId, []);
    const history = histories.get(userId);

    const result = await aiService.chatWithContext(req.user._id, message, history.slice(-10));
    
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: result.response });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getHistory = async (req, res) => {
  const userId = req.user._id.toString();
  res.json(histories.get(userId) || []);
};

exports.getStockInsight = async (req, res) => {
  try {
    const insight = await aiService.generateStockInsight(req.params.symbol);
    res.json({ insight });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.clearHistory = async (req, res) => {
  const userId = req.user._id.toString();
  histories.set(userId, []);
  res.json({ message: 'History cleared' });
};
