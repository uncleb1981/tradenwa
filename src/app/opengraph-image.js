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
          backgroundColor: '#2D4B8E',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: '140px',
            fontWeight: '900',
            color: 'white',
            letterSpacing: '-4px',
            lineHeight: 1,
            marginBottom: '24px',
          }}
        >
          TradeNWA
        </div>
        <div
          style={{
            fontSize: '64px',
            fontWeight: '600',
            color: '#EAB308',
          }}
        >
          Swap Happens
        </div>
      </div>
    ),
    { ...size }
  );
}
