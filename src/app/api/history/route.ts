import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    
    // Fetch all decisions, newest first
    const decisionsResult = await db.execute(`
      SELECT id, founder_id, category, summary, content, created_at
      FROM decisions
      ORDER BY created_at DESC
    `);
    const decisions = decisionsResult.rows as any[];

    // Fetch all conflicts where the newer decision (decision_b) caused it
    // Include details of the older decision (decision_a) to give context
    const conflictsResult = await db.execute(`
      SELECT 
        c.id, c.decision_b_id, c.severity, c.conflict_type, c.status,
        da.founder_id as prior_founder, da.summary as prior_summary
      FROM conflicts c
      JOIN decisions da ON c.decision_a_id = da.id
    `);
    const conflicts = conflictsResult.rows as any[];

    // Map conflicts into their respective triggering decisions
    const history = decisions.map((d) => {
      const relatedConflicts = conflicts.filter(c => c.decision_b_id === d.id);
      return {
        ...d,
        conflicts: relatedConflicts.map(c => ({
          id: c.id,
          severity: c.severity,
          conflict_type: c.conflict_type,
          status: c.status,
          prior_founder: c.prior_founder,
          prior_summary: c.prior_summary
        }))
      };
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('History GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await initDb();
    await db.execute('DELETE FROM conflicts');
    await db.execute('DELETE FROM decisions');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History DELETE error:', error);
    return NextResponse.json({ error: 'Failed to clear history' }, { status: 500 });
  }
}
