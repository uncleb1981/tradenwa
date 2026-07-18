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
            fontSize: '180px',
            fontWeight: '900',
            color: 'white',
            letterSpacing: '-6px',
            lineHeight: 1,
            marginBottom: '28px',
          }}
        >
          TradeNWA
        </div>
        <div
          style={{
            fontSize: '52px',
            fontWeight: '500',
            color: 'rgba(255,255,255,0.75)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          NWA&apos;s Local Barter Marketplace
        </div>
      </div>
    ),
    { ...size }
  );
}
