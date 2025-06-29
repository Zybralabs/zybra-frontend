import React from "react";
import { FaDiscord, FaTwitter, FaTelegram } from "react-icons/fa";
import ThreeScene from "./webgl/ThreeScene";
import { SOCIAL_LINKS } from "@/constant/social";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full text-white flex flex-col px-4 md:px-6 xl:px-10 relative overflow-hidden z-10">
      <div className="flex flex-col-reverse xl:flex-row w-full justify-between pb-8 relative z-20">
        <div className="flex items-center gap-5 md:gap-7 xl:gap-10 h-fit mobile-contact-icons">
          <a className="hover:scale-125 duration-300 relative z-30" href={SOCIAL_LINKS.TWITTER} target="_blank" rel="noopener noreferrer">
            <FaTwitter size={24} />
          </a>
          <a className="hover:scale-125 duration-300 relative z-30" href={SOCIAL_LINKS.TELEGRAM_GROUP} target="_blank" rel="noopener noreferrer">
            <FaTelegram size={24} />
          </a>
          <a className="hover:scale-125 duration-300 relative z-30" href={SOCIAL_LINKS.DISCORD} target="_blank" rel="noopener noreferrer">
            <FaDiscord size={24} />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-30">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <b className="">Resources</b>
            </div>
            <a className="text-sm text-white/70 hover:text-white relative z-40 block w-fit" href="https://zybra-finance.gitbook.io/zybra-general-documentation" target="_blank" rel="noopener noreferrer">
              Documentation
            </a>
            <a className="text-sm text-white/70 hover:text-white relative z-40 block w-fit" href="https://zybra-finance.gitbook.io/zybra-general-documentation/resources-and-links/faqs" target="_blank" rel="noopener noreferrer">
              FAQ
            </a>
            <a className="text-sm text-white/70 hover:text-white relative z-40 block w-fit" href="https://zybra-finance.gitbook.io/zybra-general-documentation/user-guides/onboarding-to-zybra" target="_blank" rel="noopener noreferrer">
              Help & Support
            </a>
            <a className="text-sm text-white/70 hover:text-white relative z-40 block w-fit" href="https://zybra-finance.gitbook.io/zybra-general-documentation/product/defi-layer/protocol-design/usdzfi" target="_blank" rel="noopener noreferrer">
              Governance
            </a>

          </div>
          <div className="flex flex-col gap-4">
            <b className="">Developers</b>
            <a className="text-sm text-white/70 hover:text-white relative z-40 block w-fit" href="https://zybra-finance.gitbook.io/zybra-general-documentation" target="_blank" rel="noopener noreferrer">
              Documentation
            </a>
            <a className="text-sm text-white/70 hover:text-white relative z-40 block w-fit" href="https://zybra-finance.gitbook.io/zybra-general-documentation/security" target="_blank" rel="noopener noreferrer">
              Security
            </a>
            <a className="text-sm text-white/70 hover:text-white relative z-40 block w-fit" href="https://zybra-finance.gitbook.io/zybra-general-documentation/security/audits-and-bug-bounty" target="_blank" rel="noopener noreferrer">
              Bug Bounty
            </a>
            <a className="text-sm text-white/70 hover:text-white relative z-1 block w-fit" href={`mailto:${SOCIAL_LINKS.SECURITY_EMAIL}`}>
              Report Security Issue
            </a>
          </div>
          <div className="flex flex-col gap-4">
            <b className="">Company</b>
             <div className="flex items-center gap-2">
              <span className="text-sm">→</span>
              <a className="text-sm text-white/70 hover:text-white relative z-40 block w-fit" href="https://zybra-finance.gitbook.io/zybra-general-documentation/resources-and-links/brand-kit" target="_blank" rel="noopener noreferrer">
                BrandKit
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">→</span>
              <a className="text-sm text-white/70 hover:text-white relative z-40 block w-fit" href="https://zybra-finance.gitbook.io/zybra-general-documentation/disclosure-statements/privacy-policy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">→</span>
              <a className="text-sm text-white/70 hover:text-white relative z-40 block w-fit" href="https://zybra-finance.gitbook.io/zybra-general-documentation/disclosure-statements/terms-of-use" target="_blank" rel="noopener noreferrer">
                Terms of Use
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">→</span>
              <a className="text-sm text-white/70 hover:text-white relative z-40 block w-fit" href={SOCIAL_LINKS.TELEGRAM_CHANNEL} target="_blank" rel="noopener noreferrer">
                Telegram Community
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">→</span>
              <a className="text-sm text-white/70 hover:text-white relative z-40 block w-fit" href={SOCIAL_LINKS.CONTACT_PAGE} target="_blank" rel="noopener noreferrer">
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-700 flex flex-col md:flex-row items-center justify-between py-5 relative z-20">
        <p className="text-sm">© {year} Zybra Finance - All rights reserved</p>
        <div className="flex items-center gap-10 mt-3 md:mt-0">
          <a className="text-sm text-white/70 hover:text-white relative z-40 block w-fit" href="https://zybra-finance.gitbook.io/zybra-general-documentation/disclosure-statements/privacy-policy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
          <a className="text-sm text-white/70 hover:text-white relative z-40 block w-fit" href="https://zybra-finance.gitbook.io/zybra-general-documentation/disclosure-statements/terms-of-use" target="_blank" rel="noopener noreferrer">
            Terms of Use
          </a>
        </div>
      </div>
      {/* <img
        src="/brand-bg.png"
        className="absolute top-0 left-0 z-0 w-[97%] h-[130%] opacity-15 mix-blend-screen"
        style={{
          transform: "rotateY(180deg)",
        }}
      /> */}
      <ThreeScene />
    </footer>
  );
};

export default Footer;