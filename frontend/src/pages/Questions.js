import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Questions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [questionNumber, setQuestionNumber] = useState(1);
  const [subject, setSubject] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [modelAnswer, setModelAnswer] = useState('');
  const [maxMarks, setMaxMarks] = useState(10);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/questions/');
      setQuestions(res.data.questions || []);
    } catch {
      setError('Could not load questions.');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (!subject.trim() || !questionText.trim() || !modelAnswer.trim()) {
      setError('All fields are required.');
      return;
    }
    setSubmitting(true);
    const currentNum = parseInt(questionNumber); // ← parse here
    try {
      await axios.post('http://127.0.0.1:8000/questions/', {
        question_number: currentNum,
        subject,
        question_text: questionText,
        model_answer: modelAnswer,
        max_marks: parseInt(maxMarks),
      });
      setSuccess(`Q${currentNum} saved successfully.`);
      setQuestionNumber(currentNum + 1); // ← now this is number + 1, not "1" + 1
      setQuestionText('');
      setModelAnswer('');
      setMaxMarks(10);
      fetchQuestions();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save question.');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/questions/${id}`);
      setQuestions(questions.filter((q) => q.id !== id));
    } catch {
      setError('Failed to delete.');
    }
  };

  const s = {
    page: {
      fontFamily: "'Plus Jakarta Sans',sans-serif",
      background: '#fff',
      minHeight: '100vh',
      color: '#111',
      padding: '60px 40px',
      maxWidth: '860px',
      margin: '0 auto',
    },
    heading: { fontSize: '28px', fontWeight: '700', marginBottom: '8px' },
    sub: { fontSize: '14px', color: '#888', marginBottom: '40px' },
    section: {
      background: '#fafafa',
      border: '1px solid #eee',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '40px',
    },
    sTitle: { fontSize: '16px', fontWeight: '600', marginBottom: '24px' },
    row: { display: 'flex', gap: '16px', alignItems: 'flex-end' },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      color: '#444',
      marginBottom: '6px',
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      fontSize: '14px',
      border: '1px solid #ddd',
      borderRadius: '10px',
      marginBottom: '18px',
      outline: 'none',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
    },
    textarea: {
      width: '100%',
      padding: '10px 14px',
      fontSize: '14px',
      border: '1px solid #ddd',
      borderRadius: '10px',
      marginBottom: '18px',
      outline: 'none',
      resize: 'vertical',
      minHeight: '90px',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
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
    },
    error: {
      background: '#fff0ef',
      color: '#c0392b',
      padding: '10px 14px',
      borderRadius: '8px',
      fontSize: '13px',
      marginBottom: '16px',
    },
    success: {
      background: '#f0faf5',
      color: '#1b7a4a',
      padding: '10px 14px',
      borderRadius: '8px',
      fontSize: '13px',
      marginBottom: '16px',
    },
    card: {
      background: '#fff',
      border: '1px solid #eee',
      borderRadius: '12px',
      padding: '20px 24px',
      marginBottom: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '16px',
    },
    qnum: {
      display: 'inline-block',
      background: '#e8342a',
      color: '#fff',
      fontSize: '12px',
      fontWeight: '700',
      padding: '3px 10px',
      borderRadius: '20px',
      marginBottom: '6px',
    },
    qtext: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#111',
      marginBottom: '4px',
    },
    marks: { fontSize: '12px', color: '#888' },
    deleteBtn: {
      background: 'none',
      border: '1px solid #eee',
      borderRadius: '8px',
      padding: '6px 12px',
      fontSize: '12px',
      color: '#999',
      cursor: 'pointer',
    },
    empty: {
      textAlign: 'center',
      color: '#bbb',
      fontSize: '14px',
      padding: '32px 0',
    },
  };

  return (
    <div style={s.page}>
      <div style={s.heading}>Question Bank</div>
      <div style={s.sub}>
        Add questions with model answers. Students must write Q1, Q2... on their
        answer sheets.
      </div>

      <div style={s.section}>
        <div style={s.sTitle}>Add New Question</div>

        {error && <div style={s.error}>{error}</div>}
        {success && <div style={s.success}>{success}</div>}

        {/* Question Number + Subject in one row */}
        <div style={s.row}>
          <div style={{ flex: '0 0 120px' }}>
            <label style={s.label}>Question No.</label>
            <input
              style={{ ...s.input, marginBottom: '0' }}
              type="number"
              min="1"
              max="20"
              value={questionNumber}
              onChange={(e) => setQuestionNumber(e.target.value)}
            />
          </div>
          <div style={{ flex: '1' }}>
            <label style={s.label}>Subject</label>
            <input
              style={{ ...s.input, marginBottom: '0' }}
              placeholder="e.g. DBMS, Science"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
        </div>
        <div style={{ marginBottom: '18px' }} />

        <label style={s.label}>Question</label>
        <textarea
          style={s.textarea}
          placeholder="Enter the question..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
        />

        <label style={s.label}>Model Answer</label>
        <textarea
          style={{ ...s.textarea, minHeight: '110px' }}
          placeholder="Enter the expected correct answer..."
          value={modelAnswer}
          onChange={(e) => setModelAnswer(e.target.value)}
        />

        <label style={s.label}>Maximum Marks</label>
        <input
          style={{ ...s.input, width: '120px' }}
          type="number"
          min="1"
          max="100"
          value={maxMarks}
          onChange={(e) => setMaxMarks(e.target.value)}
        />

        <button style={s.btn} onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Question'}
        </button>
      </div>

      {/* Question list */}
      <div style={s.sTitle}>Saved Questions ({questions.length})</div>

      {loading ? (
        <div style={s.empty}>Loading...</div>
      ) : questions.length === 0 ? (
        <div style={s.empty}>No questions yet. Add one above.</div>
      ) : (
        questions.map((q) => (
          <div key={q.id} style={s.card}>
            <div>
              <div style={s.qnum}>Q{q.question_number}</div>
              <div style={s.qtext}>{q.question_text}</div>
              {/* Model Answer */}
              <div
                style={{
                  fontSize: '13px',
                  color: '#555',
                  marginTop: '6px',
                  marginBottom: '6px',
                  lineHeight: '1.5',
                }}
              >
                <strong>Model Answer:</strong> {q.model_answer}
              </div>
              <div style={s.marks}>
                {q.subject} · Max marks: {q.max_marks}
              </div>
            </div>
            <button style={s.deleteBtn} onClick={() => handleDelete(q.id)}>
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default Questions;
