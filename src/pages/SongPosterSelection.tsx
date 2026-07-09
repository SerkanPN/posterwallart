import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SongPosterSelection() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', background: '#09090b', color: '#fff', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", padding: '20px' }}>
      <h1 style={{ fontSize: '36px', marginBottom: '50px', fontWeight: 700, letterSpacing: '-0.02em' }}>Choose Song Poster Style</h1>
      
      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* SPOTIFY CARD */}
        <div 
          onClick={() => navigate('/song-poster/spotify')} 
          style={{ width: '360px', padding: '40px 30px', background: '#18181b', border: '2px solid #27272a', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center' }} 
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#1DB954';
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(29, 185, 84, 0.15)';
          }} 
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#27272a';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
            <svg width="160" height="200" viewBox="0 0 200 250" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))' }}>
              <rect width="200" height="250" rx="8" fill="#121212" stroke="#333" strokeWidth="2"/>
              <rect x="20" y="20" width="160" height="160" rx="4" fill="#282828"/>
              <rect x="20" y="195" width="100" height="12" rx="6" fill="#FFFFFF"/>
              <rect x="20" y="215" width="60" height="8" rx="4" fill="#B3B3B3"/>
              <circle cx="160" cy="210" r="16" fill="#1DB954"/>
              <path d="M156 205L166 210L156 215V205Z" fill="#121212"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '22px', marginBottom: '12px', fontWeight: 600 }}>Spotify Interface</h2>
          <p style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: 1.6, margin: 0 }}>Modern music player interface with cover art, progress bar, and play controls.</p>
        </div>
        
        {/* VINYL CARD */}
        <div 
          onClick={() => navigate('/song-poster/vinyl')} 
          style={{ width: '360px', padding: '40px 30px', background: '#18181b', border: '2px solid #27272a', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center' }} 
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#6366f1';
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.15)';
          }} 
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#27272a';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
            <svg width="160" height="200" viewBox="0 0 200 250" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))' }}>
              <rect width="200" height="250" rx="8" fill="#f5f5f5" stroke="#333" strokeWidth="2"/>
              <rect x="20" y="20" width="40" height="6" rx="3" fill="#212121"/>
              <rect x="150" y="20" width="30" height="6" rx="3" fill="#212121"/>
              <rect x="40" y="45" width="120" height="12" rx="6" fill="#212121"/>
              <rect x="60" y="65" width="80" height="6" rx="3" fill="#555555"/>
              <circle cx="100" cy="155" r="60" fill="none" stroke="#212121" strokeWidth="24"/>
              <circle cx="100" cy="155" r="54" fill="none" stroke="#444" strokeWidth="1"/>
              <circle cx="100" cy="155" r="48" fill="none" stroke="#444" strokeWidth="1"/>
              <circle cx="100" cy="155" r="66" fill="none" stroke="#444" strokeWidth="1"/>
              <circle cx="100" cy="155" r="22" fill="#e0e0e0"/>
              <circle cx="100" cy="155" r="4" fill="#111"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '22px', marginBottom: '12px', fontWeight: 600 }}>Vinyl Record</h2>
          <p style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: 1.6, margin: 0 }}>Retro record design with spiral lyrics forming the vinyl grooves in the center.</p>
        </div>
      </div>
      <button onClick={() => navigate('/music-posters')} style={{ marginTop: '40px', background: 'transparent', border: '1px solid #444', color: '#aaa', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>⟵ Back to Main Menu</button>
    </div>
  );
}
