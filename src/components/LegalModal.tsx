'use client';

import React from 'react';

export type LegalDocType = 'terms' | 'privacy' | 'guidelines' | 'declaration' | null;

interface LegalModalProps {
  type: LegalDocType;
  onClose: () => void;
}

export const LEGAL_DOCS: Record<NonNullable<LegalDocType>, { title: string; content: React.ReactNode }> = {
  terms: {
    title: 'Terms of Use',
    content: (
      <div className="space-y-3 text-[13px] leading-relaxed text-[#444444]">
        <p className="font-semibold text-[#111111]">
          By creating an account or signing in to ALTUS TRIBE, you agree to the following:
        </p>
        <ol className="list-decimal space-y-2 pl-4">
          <li>You confirm that the information provided during registration is accurate and belongs to you.</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials and all activities performed through your account.</li>
          <li>ALTUS TRIBE is a professional networking and business community. Members are expected to communicate respectfully and professionally at all times.</li>
          <li>
            You agree not to:
            <ul className="mt-1 list-disc space-y-1 pl-4 text-[#555555]">
              <li>Upload false or misleading information.</li>
              <li>Impersonate another individual or organization.</li>
              <li>Share offensive, abusive, defamatory, discriminatory, or illegal content.</li>
              <li>Attempt unauthorized access to the platform or other member accounts.</li>
              <li>Use automated tools, bots, or scripts to scrape or misuse platform data.</li>
            </ul>
          </li>
          <li>Your access may be suspended or terminated if you violate these terms or community guidelines.</li>
          <li>ALTUS TRIBE may update platform features, policies, or services from time to time. Continued use constitutes acceptance of such updates.</li>
          <li>We implement reasonable security measures to protect your information; however, no online platform can guarantee absolute security.</li>
          <li>Your use of ALTUS TRIBE is governed by our Privacy Policy and Community Guidelines.</li>
        </ol>
      </div>
    ),
  },
  privacy: {
    title: 'Privacy Notice',
    content: (
      <div className="space-y-3 text-[13px] leading-relaxed text-[#444444]">
        <p className="font-semibold text-[#111111]">By using ALTUS TRIBE, you acknowledge that:</p>
        <ul className="list-disc space-y-2 pl-4">
          <li>Personal information is stored securely.</li>
          <li>Visibility of profile fields follows your selected privacy preferences.</li>
          <li>Administrative users may access information only where necessary for platform administration and support.</li>
          <li>The platform may collect basic technical information (such as device, browser, IP address, and usage logs) to improve security and platform performance.</li>
          <li>Your information will not be sold to third parties without your consent, except where required by law.</li>
        </ul>
      </div>
    ),
  },
  guidelines: {
    title: 'Community Guidelines',
    content: (
      <div className="space-y-3 text-[13px] leading-relaxed text-[#444444]">
        <p className="font-semibold text-[#111111]">Every member agrees to:</p>
        <ul className="list-disc space-y-2 pl-4">
          <li>Treat every member with professionalism and respect.</li>
          <li>Use the platform for genuine business networking and collaboration.</li>
          <li>Avoid unsolicited spam, promotions, or repeated sales pitches.</li>
          <li>Respect the privacy and confidentiality of fellow members.</li>
          <li>Avoid posting misleading, offensive, unlawful, or inappropriate content.</li>
          <li>Report misuse through the platform instead of engaging in disputes.</li>
        </ul>
      </div>
    ),
  },
  declaration: {
    title: 'Profile & Onboarding Declaration',
    content: (
      <div className="space-y-3 text-[13px] leading-relaxed text-[#444444]">
        <p className="font-semibold text-[#111111]">
          Before submitting your profile, you acknowledge and agree that:
        </p>
        <ol className="list-decimal space-y-2 pl-4">
          <li>The personal and business information you provide is true, accurate, and up to date.</li>
          <li>
            You have the necessary rights to upload any profile photographs, company logos, business brochures, videos, documents, images, and other uploaded content.
          </li>
          <li>You are solely responsible for the information published through your profile.</li>
          <li>You understand that fields marked as visible may be viewed by other authorized members according to your selected privacy settings.</li>
          <li>ALTUS TRIBE reserves the right to moderate, edit, hide, or remove content that violates platform policies or applicable laws.</li>
          <li>Business introductions, referrals, collaborations, or commercial engagements made through the platform remain solely between the participating members. ALTUS TRIBE does not guarantee outcomes or assume liability for such interactions.</li>
          <li>You agree not to upload confidential information that you are not authorized to disclose.</li>
          <li>Your profile may be reviewed by administrators for verification, moderation, and community quality purposes.</li>
          <li>You may update your profile information at any time through your account settings.</li>
          <li>By submitting this profile, you consent to the storage and processing of your information for operating ALTUS TRIBE and providing community features.</li>
        </ol>
      </div>
    ),
  },
};

export default function LegalModal({ type, onClose }: LegalModalProps) {
  if (!type) return null;
  const doc = LEGAL_DOCS[type];
  if (!doc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-xl border border-[#e1e3e4] bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3">
          <h2 className="text-lg font-bold text-[#111111]">{doc.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#9a9a9a] transition-colors hover:bg-[#f5f5f5] hover:text-[#111111]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto py-4 pr-1">
          {doc.content}
        </div>
        <div className="mt-4 flex justify-end border-t border-[#f0f0f0] pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[4px] bg-[#111111] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#333333]"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
