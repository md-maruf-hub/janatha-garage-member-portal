import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Download,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Globe,
  UserCheck,
  Droplet,
  Briefcase,
  Calendar,
  CreditCard
} from 'lucide-react';
import { MemberRecord, AppSettings } from '@/types';
import { formatPhoneNumber, DEFAULT_AVATAR } from '@/lib/storage';

interface IdCardPreviewProps {
  member: MemberRecord;
  settings: AppSettings;
}

const CARD_WIDTH = 638;
const CARD_HEIGHT = 1010;
const PREVIEW_SCALE = 0.50;
const PREVIEW_WIDTH = Math.round(CARD_WIDTH * PREVIEW_SCALE);
const PREVIEW_HEIGHT = Math.round(CARD_HEIGHT * PREVIEW_SCALE);

const DEFAULT_AVATAR_BASE64 = DEFAULT_AVATAR;

async function urlToBase64(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error('Network error');
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
  await new Promise((r) => setTimeout(r, 150));
}

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

  // Replace lab() — legacy CIE Lab color function unsupported by html2canvas
  result = result.replace(
    /\blab\(\s*([\d.%]+)\s+([-\d.]+)\s+([-\d.]+)(?:\s*\/\s*([\d.%]+))?\)/gi,
    (_match, rawL, rawA, rawB, rawAlpha) => {
      // Rough CIE Lab -> sRGB approximation via XYZ
      let Lval = parseFloat(rawL);
      if (rawL.includes('%')) Lval = Lval;
      const aVal = parseFloat(rawA);
      const bVal = parseFloat(rawB);
      let alpha = 1;
      if (rawAlpha !== undefined) {
        alpha = parseFloat(rawAlpha);
        if (rawAlpha.includes('%')) alpha = alpha / 100;
      }
      // Lab -> XYZ (D50)
      const fy = (Lval + 16) / 116;
      const fx = aVal / 500 + fy;
      const fz = fy - bVal / 200;
      const xn = 0.96422, yn = 1.0, zn = 0.82521;
      const f3 = (t: number) => t * t * t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787;
      const X = xn * f3(fx);
      const Y = yn * f3(fy);
      const Z = zn * f3(fz);
      // XYZ (D50) -> linear sRGB (D65 adapted)
      const rLin = X * 3.1338561 - Y * 1.6168667 - Z * 0.4906146;
      const gLin = -X * 0.9787684 + Y * 1.9161415 + Z * 0.0334540;
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

  // Replace color-mix() — replace with the first color argument as a fallback
  result = result.replace(
    /color-mix\([^)]+,\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|[a-z]+)[^)]*\)/gi,
    (_match, firstColor) => firstColor
  );

  return result;
};

const MODERN_COLOR_REGEX = /(oklch|oklab|\blab\(|color-mix)/i;

const sanitizeDocumentForHtml2Canvas = (clonedDoc: Document) => {
  // Sanitize <style> tags
  const styleEls = clonedDoc.querySelectorAll('style');
  styleEls.forEach((styleEl) => {
    if (styleEl.textContent && MODERN_COLOR_REGEX.test(styleEl.textContent)) {
      styleEl.textContent = parseAndReplaceModernColors(styleEl.textContent);
    }
  });

  // Sanitize linked/external stylesheets
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
        // cross-origin sheets throw — ignore
      }
    });
  } catch (e) {
    // ignore
  }

  // Sanitize inline styles
  const elementsWithStyle = clonedDoc.querySelectorAll('[style]');
  elementsWithStyle.forEach((el) => {
    const inlineStyle = el.getAttribute('style');
    if (inlineStyle && MODERN_COLOR_REGEX.test(inlineStyle)) {
      el.setAttribute('style', parseAndReplaceModernColors(inlineStyle));
    }
  });
};

const OrgHeaderLogo: React.FC<{ orgName?: string }> = ({ orgName }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <div style={{ position: 'relative', width: '58px', height: '58px', flexShrink: 0 }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <circle cx="30" cy="30" r="14" fill="#059669" />
        <circle cx="70" cy="30" r="14" fill="#f59e0b" />
        <circle cx="70" cy="70" r="14" fill="#ea580c" />
        <circle cx="30" cy="70" r="14" fill="#0284c7" />
        <circle cx="50" cy="50" r="28" fill="#0f172a" stroke="#ffffff" strokeWidth="3.5" />
        <text
          x="50"
          y="58"
          fill="#ffffff"
          fontSize="24"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          textAnchor="middle"
        >
          JG
        </text>
      </svg>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span
        style={{
          fontSize: '22px',
          fontWeight: 900,
          color: '#0f223d',
          lineHeight: 1.15,
          letterSpacing: '-0.3px',
          textTransform: 'uppercase'
        }}
      >
        {orgName || 'JANATHA GARAGE'}
      </span>
      <span
        style={{
          fontSize: '13px',
          fontWeight: 800,
          color: '#059669',
          letterSpacing: '1px',
          marginTop: '2px',
          textTransform: 'uppercase'
        }}
      >
        OFFICIAL MEMBER
      </span>
    </div>
  </div>
);

const BarcodeGraphic: React.FC<{ value: string }> = ({ value }) => {
  const code = value || 'JG260001';
  const pattern = [2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 2, 1, 1, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 1, 1, 3, 2, 1];
  const bars: React.ReactNode[] = [];
  let currentX = 0;

  for (let i = 0; i < 48; i++) {
    const width = (pattern[i % pattern.length] || 1) * 2.6;
    const isBar = i % 2 === 0;
    if (isBar) {
      bars.push(
        <rect key={i} x={currentX} y={0} width={width} height={52} fill="#0f172a" />
      );
    }
    currentX += width + (isBar ? 1.5 : 2.5);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${currentX} 52`} style={{ width: '340px', height: '48px' }} preserveAspectRatio="none">
        {bars}
      </svg>
      <span style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '2.5px', marginTop: '4px' }}>
        {code}
      </span>
    </div>
  );
};

interface FrontCardProps {
  member: MemberRecord;
  settings: AppSettings;
  photoBase64: string;
}

const FrontCardContent: React.FC<FrontCardProps> = ({ member, settings, photoBase64 }) => {
  const regNo = member.registrationNumber || member.id || 'JG260001';

  const formatName = (fullName: string) => {
    const nameStr = (fullName || 'MD MARUF').trim();
    const parts = nameStr.split(' ');
    if (parts.length === 1) {
      return <span style={{ color: '#b91c1c' }}>{parts[0]}</span>;
    }
    const first = parts[0];
    const rest = parts.slice(1).join(' ');
    return (
      <>
        <span style={{ color: '#0f172a' }}>{first} </span>
        <span style={{ color: '#b91c1c' }}>{rest}</span>
      </>
    );
  };

  const issueDateStr = member.approvalDate
    ? new Date(member.approvalDate).toLocaleDateString('en-GB')
    : '24/07/2026';

  return (
    <div
      style={{
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        borderRadius: '36px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '56px',
          height: '18px',
          borderRadius: '10px',
          backgroundColor: '#475569',
          border: '3px solid #cbd5e1',
          boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.4)',
          zIndex: 30
        }}
      />

      <div style={{ position: 'absolute', top: '50px', left: '52px', zIndex: 20 }}>
        <OrgHeaderLogo orgName={settings.orgName} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '32px',
          backgroundColor: '#b91c1c',
          zIndex: 10
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '90px',
          height: '420px',
          backgroundColor: '#b91c1c',
          borderBottomLeftRadius: '48px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '60px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ width: '90px', height: '260px', position: 'relative' }}>
          <svg
            width="90"
            height="260"
            viewBox="0 0 90 260"
            style={{ display: 'block', overflow: 'visible' }}
          >
            <text
              x="-130"
              y="36"
              fill="#ffffff"
              fontSize="21"
              fontWeight="900"
              fontFamily="sans-serif"
              letterSpacing="1"
              transform="rotate(-90)"
              textAnchor="middle"
            >
              JANATHA GARAGE
            </text>
            <text
              x="-130"
              y="58"
              fill="#ffffff"
              fontSize="13"
              fontWeight="800"
              fontFamily="sans-serif"
              letterSpacing="1.5"
              transform="rotate(-90)"
              textAnchor="middle"
              opacity="0.95"
            >
              OFFICIAL MEMBER
            </text>
          </svg>
        </div>

        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
            flexShrink: 0,
            marginTop: '10px'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              border: '2.5px solid #b91c1c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#b91c1c',
              fontWeight: 900,
              fontSize: '22px',
              letterSpacing: '-1px'
            }}
          >
            JG
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '420px',
          bottom: 0,
          right: 0,
          width: '32px',
          backgroundColor: '#b91c1c',
          zIndex: 10
        }}
      />

      <div
        style={{
          paddingLeft: '52px',
          paddingRight: '120px',
          paddingTop: '130px',
          paddingBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
          height: '100%',
          justifyContent: 'space-between'
        }}
      >
        <div
          style={{
            width: '230px',
            height: '270px',
            flexShrink: 0,
            minHeight: '270px',
            maxHeight: '270px',
            border: '2px solid #b91c1c',
            backgroundColor: '#f8fafc',
            overflow: 'hidden',
            boxSizing: 'border-box',
            boxShadow: '0 6px 12px rgba(0,0,0,0.06)'
          }}
        >
          <img
            src={photoBase64 || member.photoUrl || DEFAULT_AVATAR_BASE64}
            alt={member.fullName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR_BASE64;
            }}
          />
        </div>

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <h2
            style={{
              fontSize: '34px',
              fontWeight: 900,
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}
          >
            {formatName(member.fullName)}
          </h2>

          <div
            style={{
              display: 'inline-block',
              marginTop: '8px',
              padding: '5px 24px',
              backgroundColor: '#059669',
              color: '#ffffff',
              borderRadius: '20px',
              fontSize: '15px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            {member.memberType || 'EXECUTIVE MEMBER'}
          </div>
        </div>

        <div
          style={{
            width: '100%',
            marginTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '17px',
            fontWeight: 800,
            color: '#0f172a'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#b91c1c',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0
              }}
            >
              <UserCheck style={{ width: '18px', height: '18px' }} />
            </div>
            <span style={{ width: '135px', textTransform: 'uppercase', color: '#0f172a' }}>
              REG. NO
            </span>
            <span style={{ color: '#0f172a' }}>:</span>
            <span style={{ color: '#1d4ed8', fontWeight: 900, fontSize: '18px' }}>
              {regNo}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#b91c1c',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0
              }}
            >
              <Phone style={{ width: '18px', height: '18px' }} />
            </div>
            <span style={{ width: '135px', textTransform: 'uppercase', color: '#0f172a' }}>
              PHONE
            </span>
            <span style={{ color: '#0f172a' }}>:</span>
            <span style={{ color: '#0f172a' }}>{formatPhoneNumber(member.phone)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#b91c1c',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0
              }}
            >
              <Droplet style={{ width: '18px', height: '18px' }} />
            </div>
            <span style={{ width: '135px', textTransform: 'uppercase', color: '#0f172a' }}>
              BLOOD GROUP
            </span>
            <span style={{ color: '#0f172a' }}>:</span>
            <span style={{ color: '#dc2626', fontWeight: 900, fontSize: '19px' }}>
              {member.bloodGroup || 'A+'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#b91c1c',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0
              }}
            >
              <Briefcase style={{ width: '18px', height: '18px' }} />
            </div>
            <span style={{ width: '135px', textTransform: 'uppercase', color: '#0f172a' }}>
              OCCUPATION
            </span>
            <span style={{ color: '#0f172a' }}>:</span>
            <span style={{ color: '#0f172a' }}>{member.occupation || 'Student'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#b91c1c',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0
              }}
            >
              <Calendar style={{ width: '18px', height: '18px' }} />
            </div>
            <span style={{ width: '135px', textTransform: 'uppercase', color: '#0f172a' }}>
              ISSUED
            </span>
            <span style={{ color: '#0f172a' }}>:</span>
            <span style={{ color: '#0f172a' }}>{issueDateStr}</span>
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          <BarcodeGraphic value={regNo} />
        </div>

        <div
          style={{
            width: '100%',
            height: '42px',
            backgroundColor: '#b91c1c',
            borderRadius: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: '#ffffff',
            fontSize: '17px',
            fontWeight: 800,
            marginTop: '8px'
          }}
        >
          <Globe style={{ width: '20px', height: '20px' }} />
          <span>www.janathagarage.org</span>
        </div>
      </div>
    </div>
  );
};

interface BackCardProps {
  member: MemberRecord;
  settings: AppSettings;
  qrCodeUrl: string;
}

const BackCardContent: React.FC<BackCardProps> = ({ settings, qrCodeUrl }) => {
  return (
    <div
      style={{
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        borderRadius: '36px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '56px',
          height: '18px',
          borderRadius: '10px',
          backgroundColor: '#475569',
          border: '3px solid #cbd5e1',
          boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.4)',
          zIndex: 30
        }}
      />

      <div style={{ position: 'absolute', top: '50px', left: '52px', zIndex: 20 }}>
        <OrgHeaderLogo orgName={settings.orgName} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '32px',
          backgroundColor: '#b91c1c',
          zIndex: 10
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '75px',
          height: '320px',
          backgroundColor: '#b91c1c',
          borderBottomLeftRadius: '40px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '60px',
          boxSizing: 'border-box'
        }}
      >
        <svg
          width="75"
          height="220"
          viewBox="0 0 75 220"
          style={{ display: 'block', overflow: 'visible' }}
        >
          <text
            x="-110"
            y="42"
            fill="#ffffff"
            fontSize="22"
            fontWeight="900"
            fontFamily="sans-serif"
            letterSpacing="2"
            transform="rotate(-90)"
            textAnchor="middle"
          >
            INFORMATION
          </text>
        </svg>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '320px',
          bottom: 0,
          right: 0,
          width: '32px',
          backgroundColor: '#b91c1c',
          zIndex: 10
        }}
      />

      <div
        style={{
          paddingLeft: '52px',
          paddingRight: '100px',
          paddingTop: '130px',
          paddingBottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          height: '100%',
          justifyContent: 'space-between'
        }}
      >
        <div
          style={{
            marginTop: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            fontSize: '16px',
            fontWeight: 700,
            color: '#1e293b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                backgroundColor: '#b91c1c',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
                marginTop: '2px'
              }}
            >
              <MapPin style={{ width: '18px', height: '18px' }} />
            </div>
            <p style={{ margin: 0, lineHeight: 1.35, fontSize: '16px', fontWeight: 700 }}>
              {settings.orgAddress || 'Plot #14, Road #05\nDhanmondi, Dhaka-1205\nBangladesh'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                backgroundColor: '#b91c1c',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0
              }}
            >
              <Phone style={{ width: '18px', height: '18px' }} />
            </div>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{settings.orgPhone || '+8801700000000'}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                backgroundColor: '#b91c1c',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0
              }}
            >
              <Mail style={{ width: '18px', height: '18px' }} />
            </div>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{settings.orgEmail || 'info@janathagarage.org'}</p>
          </div>
        </div>

        <div style={{ height: '2px', backgroundColor: '#b91c1c', width: '100%', margin: '16px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              padding: '6px',
              border: '2px solid #b91c1c',
              borderRadius: '8px',
              backgroundColor: '#ffffff'
            }}
          >
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" style={{ width: '140px', height: '140px', display: 'block' }} />
            ) : (
              <div style={{ width: '140px', height: '140px', backgroundColor: '#e2e8f0' }} />
            )}
          </div>
        </div>

        <div style={{ marginTop: '14px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#b91c1c', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            TERMS & CONDITIONS
          </h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: '18px',
              fontSize: '14px',
              fontWeight: 700,
              color: '#334155',
              lineHeight: 1.6
            }}
          >
            <li>This card is non-transferable.</li>
            <li>This card is the property of Janatha Garage.</li>
            <li>Please return this card if found.</li>
            <li>Misuse of this card is strictly prohibited.</li>
          </ul>
        </div>

        <div style={{ height: '2px', backgroundColor: '#b91c1c', width: '100%', margin: '16px 0 10px 0' }} />

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px' }}>
            AUTHORIZED SIGNATURE
          </span>
          <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'center' }}>
            <svg viewBox="0 0 180 38" style={{ width: '160px', height: '34px' }}>
              <path
                d="M 10 28 C 30 10, 40 32, 60 12 C 80 -2, 90 35, 120 18 C 140 8, 150 28, 170 14"
                fill="none"
                stroke="#0f172a"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export const IdCardPreview: React.FC<IdCardPreviewProps> = ({ member, settings }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [isGeneratingPng, setIsGeneratingPng] = useState<boolean>(false);

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
          color: { dark: '#0f172a', light: '#ffffff' }
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
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    foreignObjectRendering: false,
    imageTimeout: 0,
    onclone: (clonedDoc: Document) => {
      sanitizeDocumentForHtml2Canvas(clonedDoc);
    }
  };

  const handleDownloadPng = async () => {
    if (!exportFrontRef.current || !exportBackRef.current) return;
    setIsGeneratingPng(true);
    try {
      await waitForAssets(exportFrontRef.current);
      await waitForAssets(exportBackRef.current);

      const canvasFront = await html2canvas(exportFrontRef.current, html2canvasOptions);
      const canvasBack  = await html2canvas(exportBackRef.current,  html2canvasOptions);

      const regNo = member.registrationNumber || member.id || 'ID_Card';

      const frontLink = document.createElement('a');
      frontLink.download = `${regNo}_ID_Card_Front.png`;
      frontLink.href = canvasFront.toDataURL('image/png', 1.0);
      document.body.appendChild(frontLink);
      frontLink.click();
      document.body.removeChild(frontLink);

      await new Promise((r) => setTimeout(r, 500));

      const backLink = document.createElement('a');
      backLink.download = `${regNo}_ID_Card_Back.png`;
      backLink.href = canvasBack.toDataURL('image/png', 1.0);
      document.body.appendChild(backLink);
      backLink.click();
      document.body.removeChild(backLink);
    } catch (err) {
      console.error('PNG Generation failed:', err);
      alert('Failed to generate PNG images. Please try again.');
    } finally {
      setIsGeneratingPng(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!exportFrontRef.current || !exportBackRef.current) return;
    setIsGeneratingPng(true);
    try {
      await waitForAssets(exportFrontRef.current);
      await waitForAssets(exportBackRef.current);

      const canvasFront = await html2canvas(exportFrontRef.current, html2canvasOptions);
      const canvasBack  = await html2canvas(exportBackRef.current,  html2canvasOptions);

      // CR80 portrait in mm: 54 × 85.6 mm
      const cardWmm = 54;
      const cardHmm = 85.6;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [cardWmm, cardHmm]
      });

      const frontDataUrl = canvasFront.toDataURL('image/png', 1.0);
      pdf.addImage(frontDataUrl, 'PNG', 0, 0, cardWmm, cardHmm);

      pdf.addPage([cardWmm, cardHmm], 'portrait');
      const backDataUrl = canvasBack.toDataURL('image/png', 1.0);
      pdf.addImage(backDataUrl, 'PNG', 0, 0, cardWmm, cardHmm);

      const regNo = member.registrationNumber || member.id || 'ID_Card';
      pdf.save(`${regNo}_ID_Card.pdf`);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPng(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-5xl mx-auto py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full justify-items-center">
        <div className="flex flex-col items-center">
          <span className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-rose-600" /> Front Side (Portrait)
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
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-rose-600" /> Back Side (Portrait)
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
              />
            </div>
          </div>
        </div>
      </div>

      {/* Off-screen export targets — left:-99999px so they are in DOM but not visible.
           html2canvas requires elements to be rendered (not opacity:0 / display:none). */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: '-99999px',
          width: `${CARD_WIDTH}px`,
          pointerEvents: 'none'
        }}
      >
        <div ref={exportFrontRef} style={{ width: `${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px`, position: 'relative', backgroundColor: '#ffffff' }}>
          <FrontCardContent
            member={member}
            settings={settings}
            photoBase64={photoBase64}
          />
        </div>
        <div ref={exportBackRef} style={{ width: `${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px`, position: 'relative', backgroundColor: '#ffffff' }}>
          <BackCardContent
            member={member}
            settings={settings}
            qrCodeUrl={qrCodeUrl}
          />
        </div>
      </div>

      <div className="pt-2 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={handleDownloadPng}
            disabled={isGeneratingPng}
            className="px-7 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-2.5 active:scale-95 disabled:opacity-50"
          >
            {isGeneratingPng ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download PNG
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPng}
            className="px-7 py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-2.5 active:scale-95 disabled:opacity-50"
          >
            {isGeneratingPng ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download PDF
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-500 font-medium text-center max-w-sm">
          High-resolution PNG or print-ready PDF (CR80 card size, front &amp; back).
        </p>
      </div>
    </div>
  );
};
