import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #1a2f5e 0%, #2D4B8E 50%, #1e3a70 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '72px 80px',
          position: 'relative',
        }}
      >
        {/* Top accent line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '4px', backgroundColor: '#EAB308', borderRadius: '2px' }} />
          <div style={{ width: '24px', height: '4px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '2px' }} />
        </div>

        {/* Main wordmark */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
          <div
            style={{
              fontSize: '160px',
              fontWeight: '900',
              color: 'white',
              letterSpacing: '-6px',
              lineHeight: 0.9,
            }}
          >
            Trade
          </div>
          <div
            style={{
              fontSize: '160px',
              fontWeight: '900',
              color: '#EAB308',
              letterSpacing: '-6px',
              lineHeight: 0.9,
            }}
          >
            NWA
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ width: '120px', height: '2px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div style={{ fontSize: '22px', color: 'rgba(255,255,255,0.4)', letterSpacing: '6px', textTransform: 'uppercase', fontWeight: '500' }}>
            tradenwa.com
          </div>
          <div style={{ width: '120px', height: '2px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
