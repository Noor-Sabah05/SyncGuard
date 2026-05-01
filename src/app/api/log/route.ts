import { NextRequest, NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { detect_conflict, ConflictResult } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, category, founder_id } = body;

    if (!content || !category || !founder_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await initDb();

    // Get prior decisions for conflict check
    const priorDecisionsResult = await db.execute(
      `SELECT id, founder_id, category, summary, created_at FROM decisions ORDER BY created_at DESC LIMIT 50`
    );
    const priorDecisions = priorDecisionsResult.rows as { id: number; founder_id: string; category: string; summary: string; created_at: string }[];

    // Run AI conflict detection
    let result: ConflictResult;
    try {
      result = await detect_conflict(content, priorDecisions);
    } catch (aiError) {
      console.error('AI error, saving without conflict check:', aiError);
      result = { hasConflict: false, summary: content.slice(0, 200) };
    }

    // Save the new decision
    const info = await db.execute({
      sql: 'INSERT INTO decisions (founder_id, category, content, summary) VALUES (?, ?, ?, ?)',
      args: [founder_id, category, content, result.summary],
    });
    const newDecisionId = Number(info.lastInsertRowid);

    // If conflict detected, save it
    let conflictId = null;
    if (result.hasConflict && result.priorDecisionId) {
      // Verify the prior decision exists
      const priorExistsResult = await db.execute({
        sql: 'SELECT id FROM decisions WHERE id = ?',
        args: [result.priorDecisionId],
      });
      if (priorExistsResult.rows.length > 0) {
        const conflictInfo = await db.execute({
          sql: `INSERT INTO conflicts (decision_a_id, decision_b_id, severity, conflict_type, explanation, suggested_resolution)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            result.priorDecisionId,
            newDecisionId,
            result.severity || 'blue',
            result.conflictType || 'Unknown',
            result.explanation || 'Potential conflict detected.',
            result.suggestedResolution || 'Review both decisions and align.',
          ],
        });
        conflictId = Number(conflictInfo.lastInsertRowid);
      }
    }

    return NextResponse.json({
      success: true,
      decisionId: newDecisionId,
      summary: result.summary,
      conflict: result.hasConflict ? {
        id: conflictId,
        severity: result.severity,
        conflictType: result.conflictType,
        explanation: result.explanation,
        suggestedResolution: result.suggestedResolution,
      } : null,
    });
  } catch (error) {
    console.error('Log API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
