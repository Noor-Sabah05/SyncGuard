import { NextRequest, NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    const conflictsResult = await db.execute(`
      SELECT
        c.id, c.severity, c.conflict_type, c.explanation, c.suggested_resolution, c.status, c.created_at,
        da.id as da_id, da.founder_id as da_founder, da.summary as da_summary, da.created_at as da_date,
        db2.id as db_id, db2.founder_id as db_founder, db2.summary as db_summary, db2.created_at as db_date
      FROM conflicts c
      JOIN decisions da ON c.decision_a_id = da.id
      JOIN decisions db2 ON c.decision_b_id = db2.id
      WHERE c.status = 'open'
      ORDER BY
        CASE c.severity WHEN 'red' THEN 1 WHEN 'amber' THEN 2 WHEN 'blue' THEN 3 END,
        c.created_at DESC
      `);
      const conflicts = conflictsResult.rows;

    return NextResponse.json({ conflicts });
  } catch (error) {
    console.error('Conflicts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, action, resolutionText, founder_id } = await request.json();
    if (!id || !action) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
    }

    await initDb();

    // Log the resolution as a new decision if provided
    if (resolutionText && founder_id) {
      const conflictDataResult = await db.execute({
        sql: 'SELECT conflict_type FROM conflicts WHERE id = ?',
        args: [id],
      });
      const row = conflictDataResult.rows[0];

      const conflictData = row
        ? { conflict_type: String(row.conflict_type) }
        : undefined;
      
      const cType = conflictData ? conflictData.conflict_type : 'Conflict';
      const summary = `Resolved: ${cType}`;
      const content = `Conflict Resolution (${action}):\n${resolutionText}`;
      
      await db.execute({
        sql: 'INSERT INTO decisions (founder_id, category, content, summary) VALUES (?, ?, ?, ?)',
        args: [founder_id, 'Other', content, summary],
      });
    }

    if (action === 'resolve') {
      await db.execute({ sql: 'UPDATE conflicts SET status = ? WHERE id = ?', args: ['resolved', id] });
    } else if (action === 'override') {
      await db.execute({ sql: 'UPDATE conflicts SET status = ? WHERE id = ?', args: ['overridden', id] });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Conflicts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
