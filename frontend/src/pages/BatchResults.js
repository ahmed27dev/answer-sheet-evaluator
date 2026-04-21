import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function BatchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;

  if (!data) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '80px 40px',
          fontFamily: "'Plus Jakarta Sans',sans-serif",
        }}
      >
        <p style={{ color: '#888' }}>No results found.</p>
        <button
          onClick={() => navigate('/evaluate')}
          style={{
            marginTop: '16px',
            background: '#e8342a',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Go to Evaluate
        </button>
      </div>
    );
  }

  const { total_marks, total_max, results, not_found } = data;
  const percentage =
    total_max > 0 ? Math.round((total_marks / total_max) * 100) : 0;

  const getColor = (pct) => {
    if (pct >= 75)
      return {
        bg: '#f0faf5',
        border: '#b2dfce',
        text: '#1b7a4a',
        label: 'Good',
      };
    if (pct >= 45)
      return {
        bg: '#fffbea',
        border: '#f5e08a',
        text: '#7a6000',
        label: 'Average',
      };
    return {
      bg: '#fff0ef',
      border: '#f5c2be',
      text: '#c0392b',
      label: 'Needs Improvement',
    };
  };

  const overall = getColor(percentage);

  const s = {
    page: {
      fontFamily: "'Plus Jakarta Sans',sans-serif",
      background: '#fff',
      minHeight: '100vh',
      padding: '60px 40px',
      maxWidth: '860px',
      margin: '0 auto',
      color: '#111',
    },
    heading: { fontSize: '28px', fontWeight: '700', marginBottom: '8px' },
    sub: { fontSize: '14px', color: '#888', marginBottom: '40px' },
    summary: {
      background: overall.bg,
      border: `1px solid ${overall.border}`,
      borderRadius: '16px',
      padding: '28px 32px',
      marginBottom: '40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalScore: { fontSize: '42px', fontWeight: '700', color: overall.text },
    verdict: {
      fontSize: '14px',
      fontWeight: '600',
      color: overall.text,
      marginTop: '4px',
    },
    card: {
      border: '1px solid #eee',
      borderRadius: '14px',
      padding: '24px',
      marginBottom: '16px',
      background: '#fff',
    },
    qnum: {
      display: 'inline-block',
      background: '#e8342a',
      color: '#fff',
      fontSize: '12px',
      fontWeight: '700',
      padding: '3px 10px',
      borderRadius: '20px',
      marginBottom: '10px',
    },
    qtext: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#111',
      marginBottom: '12px',
    },
    row: {
      display: 'flex',
      gap: '12px',
      marginBottom: '12px',
      flexWrap: 'wrap',
    },
    pill: (bg, color) => ({
      background: bg,
      color: color,
      fontSize: '12px',
      fontWeight: '600',
      padding: '4px 12px',
      borderRadius: '20px',
    }),
    label: {
      fontSize: '12px',
      color: '#999',
      marginBottom: '4px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    value: { fontSize: '14px', color: '#333', lineHeight: '1.6' },
    divider: {
      border: 'none',
      borderTop: '1px solid #f0f0f0',
      margin: '16px 0',
    },
    btn: {
      background: '#e8342a',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '600',
      padding: '12px 28px',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      marginTop: '32px',
    },
    warning: {
      background: '#fff8e1',
      border: '1px solid #ffe082',
      borderRadius: '10px',
      padding: '12px 16px',
      fontSize: '13px',
      color: '#7a5c00',
      marginBottom: '24px',
    },
  };

  const getNliColor = (nli) => {
    if (nli === 'ENTAILMENT') return ['#f0faf5', '#1b7a4a'];
    if (nli === 'NEUTRAL') return ['#fffbea', '#7a6000'];
    return ['#fff0ef', '#c0392b'];
  };

  return (
    <div style={s.page}>
      <div style={s.heading}>Evaluation Results</div>
      <div style={s.sub}>
        Full answer sheet evaluated — {results.length} question
        {results.length !== 1 ? 's' : ''} found
      </div>

      {/* Overall Score */}
      <div style={s.summary}>
        <div>
          <div
            style={{
              fontSize: '13px',
              color: overall.text,
              fontWeight: '600',
              marginBottom: '4px',
            }}
          >
            Total Score
          </div>
          <div style={s.totalScore}>
            {total_marks} / {total_max}
          </div>
          <div style={s.verdict}>
            {overall.label} · {percentage}%
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>
            Questions evaluated
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#111' }}>
            {results.length}
          </div>
        </div>
      </div>

      {/* Warning for unmatched questions */}
      {not_found?.length > 0 && (
        <div style={s.warning}>
          Questions {not_found.map((n) => `Q${n}`).join(', ')} were found in the
          image but not in the Question Bank. Add them to evaluate next time.
        </div>
      )}

      {/* Per-question results */}
      {results.map((r) => {
        const pct = Math.round((r.marks / r.max_marks) * 100);
        const c = getColor(pct);
        const [nb, nt] = getNliColor(r.nli_result);

        return (
          <div key={r.question_number} style={s.card}>
            <div style={s.qnum}>Q{r.question_number}</div>
            <div style={s.qtext}>{r.question_text}</div>

            {/* Marks + badges */}
            <div style={s.row}>
              <span style={s.pill(c.bg, c.text)}>
                {r.marks} / {r.max_marks} marks
              </span>
              <span style={s.pill('#f5f5f5', '#555')}>{pct}% match</span>
              <span style={s.pill(nb, nt)}>{r.nli_result}</span>
            </div>

            <hr style={s.divider} />

            {/* Student answer */}
            <div style={s.label}>Student Answer</div>
            <div style={{ ...s.value, marginBottom: '12px' }}>
              {r.student_answer}
            </div>

            {/* Model answer */}
            <div style={s.label}>Model Answer</div>
            <div style={{ ...s.value, marginBottom: '12px' }}>
              {r.model_answer}
            </div>

            {/* Feedback */}
            <div style={s.label}>Feedback</div>
            <div
              style={{
                ...s.value,
                background: '#fafafa',
                borderRadius: '8px',
                padding: '12px 14px',
                border: '1px solid #eee',
              }}
            >
              {r.feedback}
            </div>
          </div>
        );
      })}

      <button style={s.btn} onClick={() => navigate('/evaluate')}>
        Evaluate Another Sheet
      </button>
    </div>
  );
}

export default BatchResults;
