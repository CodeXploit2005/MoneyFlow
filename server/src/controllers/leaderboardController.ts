import { LeaderboardService } from '../services/leaderboardService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getLeaderboard = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { period = 'month', sortBy = 'revenue' } = req.query;

    const ranking = await LeaderboardService.getGroupLeaderboard({
      groupId,
      period,
      sortBy
    });

    return sendSuccess(res, ranking);
  } catch (error) {
    return sendError(res, 'Lỗi lấy bảng xếp hạng: ' + error.message, 500);
  }
};
