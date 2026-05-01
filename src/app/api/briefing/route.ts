import { NextRequest, NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { generate_daily_briefing } from '@/lib/gemini';

export async function GET(request: NextRequest) {
  try {
    const founder = request.nextUrl.searchParams.get('founder') || 'Unknown Founder';
    await initDb();

    const recentDecisionsResult = await db.execute(
      `SELECT category, summary, created_at FROM decisions
       WHERE created_at >= datetime('now', '-7 days')
       ORDER BY created_at DESC LIMIT 20`
    );
    const recentDecisions = recentDecisionsResult.rows.map((row) => ({
      category: String(row.category),
      summary: String(row.summary),
      created_at: String(row.created_at),
    }));

    const openConflictsResult = await db.execute(
      `SELECT conflict_type as conflictType, explanation, severity FROM conflicts WHERE status = 'open'`
    );
    const openConflicts = openConflictsResult.rows.map((row) => ({
      conflictType: String(row.conflictType),
      explanation: String(row.explanation),
      severity: String(row.severity),
    }));

    const conflictCountResult = await db.execute(
      `SELECT COUNT(*) as count FROM conflicts WHERE status = 'open'`
    );
    const conflictCountRow = conflictCountResult.rows[0];

    const conflictCount = conflictCountRow
      ? Number(conflictCountRow.count)
      : 0;
    
    let tasks;
    try {
      tasks = await generate_daily_briefing(founder, recentDecisions, openConflicts);
    } catch (aiError) {
      console.error('AI briefing error:', aiError);
      tasks = [
        { priority: 'green' as const, title: 'Log your first decision', context: 'Get started by logging a team decision.', action: 'Log Now' },
        { priority: 'blue' as const, title: 'Explore the dashboard', context: 'Familiarize yourself with SyncGuard features.', action: 'Explore' },
      ];
    }

    return NextResponse.json({
      tasks,
      conflictCount,
    });

  }
  catch (error) {
    console.error('Briefing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
