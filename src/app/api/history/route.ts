import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    
    // Fetch all decisions, newest first
    const decisions = db.prepare(`
      SELECT id, founder_id, category, summary, content, created_at
      FROM decisions
      ORDER BY created_at DESC
    `).all() as any[];

    // Fetch all conflicts where the newer decision (decision_b) caused it
    // Include details of the older decision (decision_a) to give context
    const conflicts = db.prepare(`
      SELECT 
        c.id, c.decision_b_id, c.severity, c.conflict_type, c.status,
        da.founder_id as prior_founder, da.summary as prior_summary
      FROM conflicts c
      JOIN decisions da ON c.decision_a_id = da.id
    `).all() as any[];

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
