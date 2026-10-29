import { Injectable } from '@nestjs/common';
import { Role } from '../common/enums';
import { LeaderboardEntryResponse } from '../common/api/leaderboard.response';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { ApiListResponse } from '../common/api';
import { PrismaService } from '../prisma/prisma.service';

type UserRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async list(viewer: AuthUser): Promise<ApiListResponse<LeaderboardEntryResponse>> {
    const attempts = await this.prisma.attempt.findMany({
      where: {
        status: 'SETTLED',
        passed: true,
        user: { role: Role.USER },
      },
      select: {
        userId: true,
        rewardAmount: true,
      },
    });

    const totals = new Map<string, { totalRewards: number; quizzesPassed: number }>();
    for (const attempt of attempts) {
      const reward = attempt.rewardAmount ?? 0;
      const current = totals.get(attempt.userId) ?? { totalRewards: 0, quizzesPassed: 0 };
      current.totalRewards += reward;
      current.quizzesPassed += 1;
      totals.set(attempt.userId, current);
    }

    const userIds = [...totals.keys()];
    if (userIds.length === 0) {
      return { items: [] };
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    const userById = new Map(users.map((user) => [user.id, user]));

    const ranked = userIds
      .map((userId) => {
        const stats = totals.get(userId)!;
        const user = userById.get(userId);
        return {
          userId,
          displayName: formatDisplayName(user),
          email: user?.email ?? '',
          totalRewards: stats.totalRewards,
          quizzesPassed: stats.quizzesPassed,
        };
      })
      .sort((a, b) => {
        if (b.totalRewards !== a.totalRewards) return b.totalRewards - a.totalRewards;
        if (b.quizzesPassed !== a.quizzesPassed) return b.quizzesPassed - a.quizzesPassed;
        return a.displayName.localeCompare(b.displayName);
      });

    const includeEmail = viewer.role === Role.ADMIN;
    const items: LeaderboardEntryResponse[] = ranked.map((row, index) => ({
      rank: index + 1,
      displayName: row.displayName,
      totalRewards: row.totalRewards,
      quizzesPassed: row.quizzesPassed,
      ...(includeEmail ? { email: row.email } : {}),
    }));

    return { items };
  }
}

function formatDisplayName(user: UserRow | undefined): string {
  if (!user) return 'Unknown player';
  const parts = [user.firstName, user.lastName].filter((part) => part && part.trim());
  if (parts.length > 0) return parts.join(' ');
  const local = user.email.split('@')[0]?.trim();
  return local || user.email;
}
