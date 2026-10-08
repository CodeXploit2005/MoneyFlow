import { LeaderboardService } from '../services/leaderboardService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getLeaderboard = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { period = 'month', sortBy = 'revenue', year, month } = req.query;
    if (!['today', 'week', 'month', 'year', 'all'].includes(String(period)) || !['revenue', 'profit', 'orders'].includes(String(sortBy))) return sendError(res, 'Bộ lọc bảng xếp hạng không hợp lệ', 400);
    if ((year === undefined) !== (month === undefined)) return sendError(res, 'Cần chọn cả tháng và năm', 400);

    const ranking = await LeaderboardService.getGroupLeaderboard({
      groupId,
      period,
      sortBy,
      year: year === undefined ? undefined : Number(year),
      month: month === undefined ? undefined : Number(month)
    });

    return sendSuccess(res, ranking);
  } catch (error) {
    return sendError(res, 'Lỗi lấy bảng xếp hạng: ' + error.message, 400);
  }
};
