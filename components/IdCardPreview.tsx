import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Download,
  Loader2,
  CreditCard
} from 'lucide-react';
import { MemberRecord, AppSettings } from '@/types';
import { formatPhoneNumber, DEFAULT_AVATAR, PERMANENT_ORG_ADDRESS } from '@/lib/storage';

interface IdCardPreviewProps {
  member: MemberRecord;
  settings: AppSettings;
}

const CARD_WIDTH = 640;
const CARD_HEIGHT = 1024;
const PREVIEW_SCALE = 0.58;
const PREVIEW_WIDTH = Math.round(CARD_WIDTH * PREVIEW_SCALE);
const PREVIEW_HEIGHT = Math.round(CARD_HEIGHT * PREVIEW_SCALE);

async function urlToBase64(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  try {
    // Try image proxy to convert cross-origin / Google Drive photos to base64
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}&format=base64`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.base64) return data.base64;
    }
  } catch (err) {
    console.warn('Proxy fetch failed, trying direct:', err);
  }

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error('Direct fetch failed');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || url);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return url;
  }
}

async function waitForAssets(element: HTMLElement) {
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const images = Array.from(element.querySelectorAll('img'));
  const promises = images.map((img) => {
    if (img.complete && img.naturalWidth !== 0) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  });

  await Promise.all(promises);
  await new Promise((r) => setTimeout(r, 200));
}

// Color convertors to make html2canvas compatible with Tailwind v4 oklch
const oklabToRgb = (l: number, a: number, b: number, alpha: number = 1): string => {
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 0.1291980315 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const rLin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  const gamma = (c: number) =>
    c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055;

  const r = Math.min(255, Math.max(0, Math.round(gamma(rLin) * 255)));
  const g = Math.min(255, Math.max(0, Math.round(gamma(gLin) * 255)));
  const bVal = Math.min(255, Math.max(0, Math.round(gamma(bLin) * 255)));

  if (alpha < 1) {
    return `rgba(${r}, ${g}, ${bVal}, ${alpha})`;
  }
  return `rgb(${r}, ${g}, ${bVal})`;
};

const oklchToRgb = (l: number, c: number, h: number, alpha: number = 1): string => {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  return oklabToRgb(l, a, b, alpha);
};

const parseAndReplaceModernColors = (cssText: string): string => {
  if (!cssText || typeof cssText !== 'string') return cssText;
  let result = cssText;

  // Replace oklch()
  result = result.replace(
    /oklch\(\s*([\d.%]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\)/gi,
    (_match, rawL, rawC, rawH, rawA) => {
      let l = parseFloat(rawL);
      if (rawL.includes('%')) l = l / 100;
      const c = parseFloat(rawC);
      const h = parseFloat(rawH);
      let alpha = 1;
      if (rawA !== undefined) {
        alpha = parseFloat(rawA);
        if (rawA.includes('%')) alpha = alpha / 100;
      }
      return oklchToRgb(l, c, h, alpha);
    }
  );

  // Replace oklab()
  result = result.replace(
    /oklab\(\s*([\d.%]+)\s+([-\d.]+)\s+([-\d.]+)(?:\s*\/\s*([\d.%]+))?\)/gi,
    (_match, rawL, rawA, rawB, rawAlpha) => {
      let l = parseFloat(rawL);
      if (rawL.includes('%')) l = l / 100;
      const a = parseFloat(rawA);
      const b = parseFloat(rawB);
      let alpha = 1;
      if (rawAlpha !== undefined) {
        alpha = parseFloat(rawAlpha);
        if (rawAlpha.includes('%')) alpha = alpha / 100;
      }
      return oklabToRgb(l, a, b, alpha);
    }
  );

  // Replace lab()
  result = result.replace(
    /\blab\(\s*([\d.%]+)\s+([-\d.]+)\s+([-\d.]+)(?:\s*\/\s*([\d.%]+))?\)/gi,
    (_match, rawL, rawA, rawB, rawAlpha) => {
      let Lval = parseFloat(rawL);
      const aVal = parseFloat(rawA);
      const bVal = parseFloat(rawB);
      let alpha = 1;
      if (rawAlpha !== undefined) {
        alpha = parseFloat(rawAlpha);
        if (rawAlpha.includes('%')) alpha = alpha / 100;
      }
      const fy = (Lval + 16) / 116;
      const fx = aVal / 500 + fy;
      const fz = fy - bVal / 200;
      const xn = 0.96422,
        yn = 1.0,
        zn = 0.82521;
      const f3 = (t: number) => (t * t * t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787);
      const X = xn * f3(fx);
      const Y = yn * f3(fy);
      const Z = zn * f3(fz);
      const rLin = X * 3.1338561 - Y * 1.6168667 - Z * 0.4906146;
      const gLin = -X * 0.9787684 + Y * 1.9161415 + Z * 0.033454;
      const bLin = X * 0.0719453 - Y * 0.2289914 + Z * 1.4052427;
      const gamma = (c: number) =>
        c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055;
      const r = Math.min(255, Math.max(0, Math.round(gamma(rLin) * 255)));
      const g = Math.min(255, Math.max(0, Math.round(gamma(gLin) * 255)));
      const bOut = Math.min(255, Math.max(0, Math.round(gamma(bLin) * 255)));
      if (alpha < 1) return `rgba(${r},${g},${bOut},${alpha})`;
      return `rgb(${r},${g},${bOut})`;
    }
  );

  // Replace color-mix()
  result = result.replace(
    /color-mix\([^)]+,\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|[a-z]+)[^)]*\)/gi,
    (_match, firstColor) => firstColor
  );

  return result;
};

const MODERN_COLOR_REGEX = /(oklch|oklab|\blab\(|color-mix)/i;

const sanitizeDocumentForHtml2Canvas = (clonedDoc: Document) => {
  const styleEls = clonedDoc.querySelectorAll('style');
  styleEls.forEach((styleEl) => {
    if (styleEl.textContent && MODERN_COLOR_REGEX.test(styleEl.textContent)) {
      styleEl.textContent = parseAndReplaceModernColors(styleEl.textContent);
    }
  });

  try {
    Array.from(clonedDoc.styleSheets).forEach((sheet) => {
      try {
        if (!sheet.cssRules) return;
        const rules = Array.from(sheet.cssRules);
        let hasModern = false;
        const cssArray: string[] = [];
        rules.forEach((rule) => {
          const txt = rule.cssText;
          if (MODERN_COLOR_REGEX.test(txt)) {
            hasModern = true;
            cssArray.push(parseAndReplaceModernColors(txt));
          } else {
            cssArray.push(txt);
          }
        });
        if (hasModern) {
          const newStyle = clonedDoc.createElement('style');
          newStyle.textContent = cssArray.join('\n');
          clonedDoc.head.appendChild(newStyle);
          if (sheet.ownerNode && sheet.ownerNode.parentNode) {
            sheet.ownerNode.parentNode.removeChild(sheet.ownerNode as Node);
          }
        }
      } catch (e) {
        // cross-origin sheets ignore
      }
    });
  } catch (e) {
    // ignore
  }

  const elementsWithStyle = clonedDoc.querySelectorAll('[style]');
  elementsWithStyle.forEach((el) => {
    const inlineStyle = el.getAttribute('style');
    if (inlineStyle && MODERN_COLOR_REGEX.test(inlineStyle)) {
      el.setAttribute('style', parseAndReplaceModernColors(inlineStyle));
    }
  });
};

// Logo Component
const JanathaHeaderLogo: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
    <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
      <svg viewBox="0 0 500 500" style={{ width: '100%', height: '100%', display: 'block' }}>
        <circle cx="170" cy="110" r="30" fill="#22c55e" />
        <path d="M 130 185 C 130 145, 170 145, 205 145 C 205 175, 180 185, 145 185 Z" fill="#22c55e" />
        <path d="M 115 165 C 115 140, 150 135, 175 140 C 160 180, 130 195, 115 165 Z" fill="#22c55e" />

        <circle cx="330" cy="110" r="30" fill="#f59e0b" />
        <path d="M 370 185 C 370 145, 330 145, 295 145 C 295 175, 320 185, 355 185 Z" fill="#f59e0b" />
        <path d="M 385 165 C 385 140, 350 135, 325 140 C 340 180, 370 195, 385 165 Z" fill="#f59e0b" />

        <circle cx="330" cy="290" r="30" fill="#ef4444" />
        <path d="M 370 215 C 370 255, 330 255, 295 255 C 295 225, 320 215, 355 215 Z" fill="#ef4444" />
        <path d="M 385 235 C 385 260, 350 265, 325 260 C 340 220, 370 205, 385 235 Z" fill="#ef4444" />

        <circle cx="170" cy="290" r="30" fill="#0284c7" />
        <path d="M 130 215 C 130 255, 170 255, 205 255 C 205 225, 180 215, 145 215 Z" fill="#0284c7" />
        <path d="M 115 235 C 115 260, 150 265, 175 260 C 160 220, 130 205, 115 235 Z" fill="#0284c7" />

        <rect x="175" y="135" width="150" height="130" rx="38" fill="#0b1e36" />
        <text
          x="250"
          y="222"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
          fontWeight="900"
          fontSize="72"
          fill="#FFFFFF"
          textAnchor="middle"
          letterSpacing="1"
        >
          JG
        </text>
      </svg>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
      <span
        style={{
          fontSize: '48px',
          fontWeight: 900,
          color: '#0b1e36',
          letterSpacing: '-0.5px'
        }}
      >
        Janatha
      </span>
      <span
        style={{
          fontSize: '48px',
          fontWeight: 900,
          color: '#0b1e36',
          letterSpacing: '-0.5px',
          marginTop: '3px'
        }}
      >
        Garage
      </span>
      <span
        style={{
          fontSize: '15px',
          fontWeight: 900,
          color: '#1e293b',
          letterSpacing: '3.5px',
          marginTop: '16px',
          textTransform: 'uppercase'
        }}
      >
        TOGETHER WE CAN
      </span>
    </div>
  </div>
);

interface FrontCardProps {
  member: MemberRecord;
  settings: AppSettings;
  photoBase64: string;
  isExport?: boolean;
}

const FrontCardContent: React.FC<FrontCardProps> = ({ member, settings, photoBase64, isExport = false }) => {
  const regNo = member.registrationNumber || member.id || 'JG260002';
  const fullName = (member.fullName || 'MD.NIROB KAZI').toUpperCase();
  const roleName = member.memberType || 'Member';
  const phoneVal = formatPhoneNumber(member.phone) || '017xxxxxxxx';
  const emailVal = member.email || 'contact.mdmaruf@gmail.com';
  const addressVal =
    member.presentAddress ||
    member.permanentAddress ||
    settings.orgAddress ||
    PERMANENT_ORG_ADDRESS;

  return (
    <div
      style={{
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        borderRadius: isExport ? '0px' : '36px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Top Accent Strip */}
      <div
        style={{
          width: '100%',
          height: '6px',
          background: 'linear-gradient(to right, #22c55e, #f59e0b, #ef4444, #0284c7)'
        }}
      />

      {/* Header Area */}
      <div
        style={{
          paddingTop: '26px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10
        }}
      >
        <JanathaHeaderLogo />

        {/* Multi-color separator line under logo */}
        <div
          style={{
            width: '320px',
            height: '5px',
            background: 'linear-gradient(to right, #22c55e, #f59e0b, #ef4444, #0284c7)',
            borderRadius: '3px',
            marginTop: '26px',
            marginBottom: '20px'
          }}
        />

        {/* MEMBER ID CARD Text */}
        <div
          style={{
            color: '#0b2b52',
            fontSize: '24px',
            fontWeight: 900,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            marginTop: '2px',
            marginBottom: '12px'
          }}
        >
          MEMBER ID CARD
        </div>
      </div>

      {/* Member Photo & Name Centered */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '20px',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Photo Box */}
        <div
          style={{
            width: '215px',
            height: '265px',
            borderRadius: '22px',
            border: '3.5px solid #005fa3',
            overflow: 'hidden',
            backgroundColor: '#f8fafc',
            boxShadow: '0 10px 25px rgba(0, 95, 163, 0.18)'
          }}
        >
          <img
            src={photoBase64 || member.photoUrl || DEFAULT_AVATAR}
            alt={fullName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
            }}
          />
        </div>

        {/* Member Name & Role */}
        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            paddingLeft: '24px',
            paddingRight: '24px'
          }}
        >
          <h2
            style={{
              fontSize: '34px',
              fontWeight: 900,
              color: '#0b1e36',
              margin: 0,
              textTransform: 'uppercase',
              lineHeight: 1.15,
              letterSpacing: '0.5px'
            }}
          >
            {fullName}
          </h2>

          <span
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#0070ba',
              marginTop: '5px'
            }}
          >
            {roleName}
          </span>

          <div
            style={{
              width: '180px',
              height: '4px',
              background: 'linear-gradient(to right, #0070ba, #22c55e, #f59e0b, #ef4444)',
              borderRadius: '2px',
              marginTop: '10px'
            }}
          />
        </div>
      </div>

      {/* Member Data Fields - Centered & Larger Font Size, No Icons */}
      <div
        style={{
          width: '560px',
          margin: '26px auto 0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Row 1: Member ID */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: '170px', textAlign: 'right', fontSize: '22px', fontWeight: 800, color: '#475569' }}>
            Member ID
          </span>
          <span style={{ width: '28px', textAlign: 'center', fontSize: '22px', fontWeight: 900, color: '#0b1e36' }}>
            :
          </span>
          <span style={{ width: '350px', textAlign: 'left', fontSize: '24px', fontWeight: 900, color: '#0b1e36' }}>
            {regNo}
          </span>
        </div>

        {/* Row 2: Mobile */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: '170px', textAlign: 'right', fontSize: '22px', fontWeight: 800, color: '#475569' }}>
            Mobile
          </span>
          <span style={{ width: '28px', textAlign: 'center', fontSize: '22px', fontWeight: 900, color: '#0b1e36' }}>
            :
          </span>
          <span style={{ width: '350px', textAlign: 'left', fontSize: '23px', fontWeight: 900, color: '#0b1e36' }}>
            {phoneVal}
          </span>
        </div>

        {/* Row 3: Email */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: '170px', textAlign: 'right', fontSize: '22px', fontWeight: 800, color: '#475569' }}>
            Email
          </span>
          <span style={{ width: '28px', textAlign: 'center', fontSize: '22px', fontWeight: 900, color: '#0b1e36' }}>
            :
          </span>
          <span style={{ width: '350px', textAlign: 'left', fontSize: '21px', fontWeight: 800, color: '#0b1e36', wordBreak: 'break-all' }}>
            {emailVal}
          </span>
        </div>

        {/* Row 4: Address */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <span style={{ width: '170px', textAlign: 'right', fontSize: '22px', fontWeight: 800, color: '#475569', paddingTop: '2px' }}>
            Address
          </span>
          <span style={{ width: '28px', textAlign: 'center', fontSize: '22px', fontWeight: 900, color: '#0b1e36', paddingTop: '2px' }}>
            :
          </span>
          <span
            style={{
              width: '350px',
              textAlign: 'left',
              fontSize: '20px',
              fontWeight: 700,
              color: '#1e293b',
              lineHeight: 1.35,
              whiteSpace: 'pre-line',
              paddingTop: '2px'
            }}
          >
            {addressVal}
          </span>
        </div>
      </div>

      {/* Bottom Area: Calligraphy and Signature */}
      <div
        style={{
          position: 'absolute',
          bottom: '26px',
          left: '44px',
          right: '44px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          zIndex: 10
        }}
      >
        <div
          style={{
            fontFamily: '"Caveat", "Dancing Script", "Brush Script MT", cursive',
            fontSize: '32px',
            fontWeight: 700,
            color: '#005fa3',
            lineHeight: 1.25,
            fontStyle: 'italic',
            transform: 'rotate(-4deg)',
            paddingBottom: '4px'
          }}
        >
          Better People
          <br />
          Better Community
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '4px'
          }}
        >
          {/* Authority Signature Image */}
          {settings.authoritySignatureUrl ? (
            <div
              style={{
                height: '48px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                marginBottom: '4px'
              }}
            >
              <img
                src={settings.authoritySignatureUrl}
                alt="Authorized Signature"
                style={{
                  maxHeight: '46px',
                  maxWidth: '165px',
                  objectFit: 'contain'
                }}
              />
            </div>
          ) : (
            <div style={{ height: '48px' }} />
          )}

          <div
            style={{
              width: '165px',
              height: '2px',
              backgroundColor: '#334155',
              marginBottom: '6px'
            }}
          />
          <span
            style={{
              fontSize: '15px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '0.4px'
            }}
          >
            {settings.authorityTitle || 'Authorized Signature'}
          </span>
        </div>
      </div>

      {/* Bottom Accent Strip */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(to right, #0284c7, #ef4444, #f59e0b, #22c55e)'
        }}
      />
    </div>
  );
};

interface BackCardProps {
  member: MemberRecord;
  settings: AppSettings;
  qrCodeUrl: string;
  isExport?: boolean;
}

const BackCardContent: React.FC<BackCardProps> = ({ settings, qrCodeUrl, isExport = false }) => {
  const orgAddress = settings.orgAddress || PERMANENT_ORG_ADDRESS;

  return (
    <div
      style={{
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        borderRadius: isExport ? '0px' : '36px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Top Accent Strip */}
      <div
        style={{
          width: '100%',
          height: '6px',
          background: 'linear-gradient(to right, #22c55e, #f59e0b, #ef4444, #0284c7)'
        }}
      />

      {/* Header Area */}
      <div
        style={{
          paddingTop: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10
        }}
      >
        <JanathaHeaderLogo />

        <div
          style={{
            width: '320px',
            height: '4px',
            background: 'linear-gradient(to right, #22c55e, #f59e0b, #ef4444, #0284c7)',
            borderRadius: '2px',
            marginTop: '26px'
          }}
        />
      </div>

      {/* Center QR Code Section - moved lower as requested */}
      <div
        style={{
          marginTop: '65px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div
          style={{
            padding: '14px',
            border: '3px solid #005fa3',
            borderRadius: '22px',
            backgroundColor: '#ffffff',
            boxShadow: '0 6px 18px rgba(0, 95, 163, 0.12)'
          }}
        >
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="Verification QR Code"
              style={{ width: '190px', height: '190px', display: 'block' }}
            />
          ) : (
            <div style={{ width: '190px', height: '190px', backgroundColor: '#e2e8f0' }} />
          )}
        </div>
        <span
          style={{
            fontSize: '19px',
            fontWeight: 800,
            color: '#0b2b52',
            marginTop: '12px',
            letterSpacing: '0.5px'
          }}
        >
          Scan for Verification
        </span>
      </div>

      {/* Our Address Container Box - clean, larger font, no icons */}
      <div
        style={{
          marginTop: '45px',
          display: 'flex',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div
          style={{
            width: '540px',
            backgroundColor: '#f0f5fb',
            border: '1.5px solid #d4e3f4',
            borderRadius: '22px',
            padding: '20px 28px',
            boxSizing: 'border-box',
            textAlign: 'center'
          }}
        >
          <h4
            style={{
              margin: '0 0 8px 0',
              fontSize: '22px',
              fontWeight: 900,
              color: '#005fa3',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Our Address
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
              color: '#334155',
              lineHeight: 1.5,
              whiteSpace: 'pre-line'
            }}
          >
            {orgAddress}
          </p>

          <div
            style={{
              height: '1.5px',
              backgroundColor: '#cfe0f2',
              margin: '14px 0 12px 0'
            }}
          />

          <span
            style={{
              fontSize: '17px',
              fontWeight: 800,
              color: '#005fa3',
              letterSpacing: '0.5px'
            }}
          >
            Community &nbsp;•&nbsp; Support &nbsp;•&nbsp; Development
          </span>
        </div>
      </div>

      {/* Slogan & Management */}
      <div
        style={{
          marginTop: '42px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10
        }}
      >
        <p
          style={{
            fontSize: '21px',
            fontStyle: 'italic',
            fontWeight: 800,
            color: '#005fa3',
            margin: '0 0 8px 0',
            textAlign: 'center'
          }}
        >
          &ldquo;Together we build a better tomorrow.&rdquo;
        </p>

        <div style={{ textAlign: 'center', width: '540px', marginTop: '4px' }}>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#0b1e36' }}>
            Janatha Garage
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#64748b' }}>
            Management Team
          </div>
        </div>
      </div>

      {/* Bottom Accent Strip */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(to right, #0284c7, #ef4444, #f59e0b, #22c55e)'
        }}
      />
    </div>
  );
};

export const IdCardPreview: React.FC<IdCardPreviewProps> = ({ member, settings }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  const exportFrontRef = useRef<HTMLDivElement>(null);
  const exportBackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAssets() {
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const regOrId = member.registrationNumber || member.id;
        const verifyUrl = `${origin}/verify?regNo=${encodeURIComponent(regOrId)}`;
        const qr = await QRCode.toDataURL(verifyUrl, {
          width: 320,
          margin: 1,
          color: { dark: '#0b2b52', light: '#ffffff' }
        });
        if (isMounted) setQrCodeUrl(qr);
      } catch (err) {
        console.error('QR error:', err);
      }

      if (member.photoUrl) {
        const b64 = await urlToBase64(member.photoUrl);
        if (isMounted) setPhotoBase64(b64);
      } else {
        if (isMounted) setPhotoBase64('');
      }
    }

    loadAssets();

    return () => {
      isMounted = false;
    };
  }, [member]);

  const html2canvasOptions = {
    scale: 3,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 0,
    onclone: (clonedDoc: Document) => {
      sanitizeDocumentForHtml2Canvas(clonedDoc);
      const container = clonedDoc.querySelector('[data-export-container]') as HTMLElement;
      if (container) {
        container.style.opacity = '1';
        container.style.visibility = 'visible';
        container.style.position = 'static';
        container.style.overflow = 'visible';
        container.style.height = 'auto';
      }
    }
  };

  const handleDownloadPdf = async () => {
    if (!exportFrontRef.current || !exportBackRef.current) return;
    setIsGeneratingPdf(true);
    try {
      await waitForAssets(exportFrontRef.current);
      await waitForAssets(exportBackRef.current);

      const canvasFront = await html2canvas(exportFrontRef.current, html2canvasOptions);
      const canvasBack = await html2canvas(exportBackRef.current, html2canvasOptions);

      // Exact card dimensions: 45mm x 72mm (Ratio 1 : 1.6)
      const cardWmm = 45;
      const cardHmm = 72;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [cardWmm, cardHmm],
        compress: true
      });

      const frontDataUrl = canvasFront.toDataURL('image/png', 1.0);
      pdf.addImage(frontDataUrl, 'PNG', 0, 0, cardWmm, cardHmm, undefined, 'FAST');

      pdf.addPage([cardWmm, cardHmm], 'portrait');
      const backDataUrl = canvasBack.toDataURL('image/png', 1.0);
      pdf.addImage(backDataUrl, 'PNG', 0, 0, cardWmm, cardHmm, undefined, 'FAST');

      const regNo = member.registrationNumber || member.id || 'ID_Card';
      pdf.save(`${regNo}_ID_Card.pdf`);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      alert('Failed to generate PDF. Please check browser console for details.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-5xl mx-auto py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full justify-items-center">
        <div className="flex flex-col items-center">
          <span className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-blue-600" /> Front Side (Portrait)
          </span>
          <div
            className="relative overflow-hidden rounded-[20px] shadow-2xl border border-slate-300 bg-white"
            style={{ width: `${PREVIEW_WIDTH}px`, height: `${PREVIEW_HEIGHT}px` }}
          >
            <div
              style={{
                width: `${CARD_WIDTH}px`,
                height: `${CARD_HEIGHT}px`,
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: 'top left'
              }}
            >
              <FrontCardContent
                member={member}
                settings={settings}
                photoBase64={photoBase64}
                isExport={false}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-blue-600" /> Back Side (Portrait)
          </span>
          <div
            className="relative overflow-hidden rounded-[20px] shadow-2xl border border-slate-300 bg-white"
            style={{ width: `${PREVIEW_WIDTH}px`, height: `${PREVIEW_HEIGHT}px` }}
          >
            <div
              style={{
                width: `${CARD_WIDTH}px`,
                height: `${CARD_HEIGHT}px`,
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: 'top left'
              }}
            >
              <BackCardContent
                member={member}
                settings={settings}
                qrCodeUrl={qrCodeUrl}
                isExport={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Export Targets Mounted inside DOM without negative coordinates */}
      <div
        data-export-container="true"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${CARD_WIDTH}px`,
          height: 'auto',
          minHeight: '2500px',
          zIndex: -9999,
          pointerEvents: 'none',
          opacity: 0,
          overflow: 'visible'
        }}
      >
        <div
          ref={exportFrontRef}
          style={{
            width: `${CARD_WIDTH}px`,
            height: `${CARD_HEIGHT}px`,
            position: 'relative',
            backgroundColor: '#ffffff'
          }}
        >
          <FrontCardContent
            member={member}
            settings={settings}
            photoBase64={photoBase64}
            isExport={true}
          />
        </div>
        <div
          ref={exportBackRef}
          style={{
            width: `${CARD_WIDTH}px`,
            height: `${CARD_HEIGHT}px`,
            position: 'relative',
            backgroundColor: '#ffffff'
          }}
        >
          <BackCardContent
            member={member}
            settings={settings}
            qrCodeUrl={qrCodeUrl}
            isExport={true}
          />
        </div>
      </div>

      <div className="pt-2 flex flex-col items-center gap-3">
        <button
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="px-9 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-base rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Printable PDF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Download ID Card (PDF)
            </>
          )}
        </button>

        <p className="text-xs text-slate-500 font-medium text-center max-w-sm">
          Print-ready PDF with exact dimensions (45mm × 72mm, Front &amp; Back).
        </p>
      </div>
    </div>
  );
};
