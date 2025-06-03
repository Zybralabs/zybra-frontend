import Link from "next/link";
import React from "react";
import { FaDiscord, FaTwitter, FaTelegram } from "react-icons/fa";
import ThreeScene from "./webgl/ThreeScene";
import { SOCIAL_LINKS } from "@/constant/social";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full text-white flex flex-col px-4 md:px-6 xl:px-10 relative overflow-hidden">
      <div className="flex flex-col-reverse xl:flex-row w-full justify-between pb-8 relative z-10">
        <div className="flex items-center gap-5 md:gap-7 xl:gap-10 h-fit">
          <a className="hover:scale-125 duration-300 relative z-10" href={SOCIAL_LINKS.TWITTER} target="_blank" rel="noopener noreferrer">
            <FaTwitter size={24} />
          </a>
          <a className="hover:scale-125 duration-300 relative z-10" href={SOCIAL_LINKS.TELEGRAM_GROUP} target="_blank" rel="noopener noreferrer">
            <FaTelegram size={24} />
          </a>
          <a className="hover:scale-125 duration-300 relative z-10" href={SOCIAL_LINKS.DISCORD} target="_blank" rel="noopener noreferrer">
            <FaDiscord size={24} />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <b className="">Resources</b>
            </div>
            <a className="text-sm text-white/70 hover:text-white relative z-10 block w-fit" href={SOCIAL_LINKS.DOCUMENTATION} target="_blank" rel="noopener noreferrer">
              Documentation
            </a>
            <Link className="text-sm text-white/70 hover:text-white relative z-10 block w-fit" href="https://zybra.finance/#faq">
              FAQ
            </Link>
            <Link className="text-sm text-white/70 hover:text-white relative z-10 block w-fit" href="https://zybra-finance.gitbook.io/zybra-general-documentation/disclosure-statements/privacy-policy">
              Help & Support
            </Link>
            <Link className="text-sm text-white/70 hover:text-white relative z-10 block w-fit" href="https://zybra-finance.gitbook.io/governance">
              Governance
            </Link>
          
          </div>
          <div className="flex flex-col gap-4">
            <b className="">Developers</b>
            <a className="text-sm text-white/70 hover:text-white relative z-10 block w-fit" href={SOCIAL_LINKS.DOCUMENTATION} target="_blank" rel="noopener noreferrer">
              Documentation
            </a>
            <Link className="text-sm text-white/70 hover:text-white relative z-10 block w-fit" href="https://zybra-finance.gitbook.io/zybra-general-documentation/disclosure-statements/security-audits-and-bug-bounty">
              Security
            </Link>
            <Link className="text-sm text-white/70 hover:text-white relative z-10 block w-fit" href="https://zybra-finance.gitbook.io/zybra-general-documentation/disclosure-statements/security-audits-and-bug-bounty">
              Bug Bounty
            </Link>
            <a className="text-sm text-white/70 hover:text-white relative z-10 block w-fit" href={`mailto:${SOCIAL_LINKS.SECURITY_EMAIL}`}>
              Report Security Issue
            </a>
          </div>
          <div className="flex flex-col gap-4">
            <b className="">Company</b>
             <div className="flex items-center gap-2">
              <span className="text-sm">→</span>
              <Link className="text-sm text-white/70 hover:text-white relative z-10 block w-fit" href="https://app.gitbook.com/o/9SCpNqj4dzL0rlsgDk9x/s/OvVVr4yH7wc1JhZmKHbN/zybra-brand-kit">
                BrandKit
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">→</span>
              <Link className="text-sm text-white/70 hover:text-white relative z-10 block w-fit" href="/privacy-policy">
                Privacy Policy
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">→</span>
              <Link className="text-sm text-white/70 hover:text-white relative z-10 block w-fit" href="https://zybra-finance.gitbook.io/zybra-general-documentation/disclosure-statements/terms-of-use">
                Terms of Use
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">→</span>
              <a className="text-sm text-white/70 hover:text-white relative z-10 block w-fit" href={SOCIAL_LINKS.TELEGRAM_CHANNEL} target="_blank" rel="noopener noreferrer">
                Telegram Community
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">→</span>
              <Link className="text-sm text-white/70 hover:text-white relative z-10 block w-fit" href={SOCIAL_LINKS.CONTACT_PAGE}>
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-700 flex flex-col md:flex-row items-center justify-between py-5 relative z-10">
        <p className="text-sm">© {year} Zybra Finance - All rights reserved</p>
        <div className="flex items-center gap-10 mt-3 md:mt-0">
          <Link className="text-sm text-white/70 hover:text-white relative z-10 block w-fit" href="https://zybra-finance.gitbook.io/zybra-general-documentation/disclosure-statements/privacy-policy">
            Privacy Policy
          </Link>
          <Link className="text-sm text-white/70 hover:text-white relative z-10 block w-fit" href="https://zybra-finance.gitbook.io/zybra-general-documentation/disclosure-statements/terms-of-use">
            Terms of Use
          </Link>
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