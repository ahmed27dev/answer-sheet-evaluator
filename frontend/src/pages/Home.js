import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: '#fff',
        minHeight: '100vh',
        color: '#111',
      }}
    >
      {/* HERO */}
      <div style={{ textAlign: 'center', padding: '100px 40px 72px' }}>
        <h1
          style={{
            fontSize: '52px',
            fontWeight: '700',
            lineHeight: '1.15',
            color: '#111',
            marginBottom: '16px',
          }}
        >
          Grade smarter, <span style={{ color: '#e8342a' }}>not harder.</span>
        </h1>
        <p style={{ fontSize: '16px', color: '#888', marginBottom: '40px' }}>
          Upload a photo or type an answer — get a score and feedback instantly.
        </p>
        <Link to="/evaluate">
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#e8342a',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              padding: '15px 32px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Start Grading
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </Link>
      </div>

      {/* STEPS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '0 40px 100px',
        }}
      >
        {/* Step 1 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            width: '200px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#fff0ef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#e8342a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: '600',
              color: '#111',
              marginBottom: '6px',
            }}
          >
            Upload answer
          </div>
          <div style={{ fontSize: '13px', color: '#999', lineHeight: '1.55' }}>
            Photo of sheet
            <br />
            or type it in
          </div>
        </div>

        {/* Arrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingBottom: '56px',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ddd"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>

        {/* Step 2 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            width: '200px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#eef4ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4a7de8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: '600',
              color: '#111',
              marginBottom: '6px',
            }}
          >
            AI evaluates
          </div>
          <div style={{ fontSize: '13px', color: '#999', lineHeight: '1.55' }}>
            Reads, understands
            <br />
            and scores it
          </div>
        </div>

        {/* Arrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingBottom: '56px',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ddd"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>

        {/* Step 3 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            width: '200px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#f0faf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1b7a4a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: '600',
              color: '#111',
              marginBottom: '6px',
            }}
          >
            Get results
          </div>
          <div style={{ fontSize: '13px', color: '#999', lineHeight: '1.55' }}>
            Score + feedback
            <br />
            in seconds
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
